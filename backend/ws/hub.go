package ws

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type HubManager struct {
	hubs map[string]*Hub
	mu   sync.RWMutex
}

func NewHubManager() *HubManager {
	return &HubManager{
		hubs: make(map[string]*Hub),
	}
}

func (m *HubManager) GetHub(roomId string) *Hub {
	m.mu.Lock()
	defer m.mu.Unlock()

	if hub, ok := m.hubs[roomId]; ok {
		return hub
	}

	hub := NewHub(roomId, m)
	m.hubs[roomId] = hub
	go hub.Run()
	return hub
}

func (m *HubManager) RemoveHub(roomId string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.hubs, roomId)
}

type Hub struct {
	roomId     string
	manager    *HubManager
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
}

func NewHub(roomId string, manager *HubManager) *Hub {
	return &Hub{
		roomId:     roomId,
		manager:    manager,
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	// Close down empty hubs to free resources
	idleTimer := time.NewTimer(5 * time.Minute)
	defer idleTimer.Stop()

	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			if !idleTimer.Stop() {
				<-idleTimer.C
			}
			idleTimer.Reset(5 * time.Minute)
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			if len(h.clients) == 0 {
				h.manager.RemoveHub(h.roomId)
				return // terminate hub
			}
		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		case <-idleTimer.C:
			if len(h.clients) == 0 {
				h.manager.RemoveHub(h.roomId)
				return
			}
			idleTimer.Reset(5 * time.Minute)
		}
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all for now
	},
}

func ServeWs(manager *HubManager, roomId string, userId string, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	hub := manager.GetHub(roomId)
	client := &Client{hub: hub, conn: conn, send: make(chan []byte, 256), userId: userId}
	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()
}
