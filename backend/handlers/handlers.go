package handlers

import (
	"togethr-backend/config"
	"togethr-backend/db/generated"
	"togethr-backend/ws"
)

type Handlers struct {
	Queries    *db.Queries
	HubManager *ws.HubManager
	Config     config.Config
}

func NewHandlers(q *db.Queries, hm *ws.HubManager, cfg config.Config) *Handlers {
	return &Handlers{
		Queries:    q,
		HubManager: hm,
		Config:     cfg,
	}
}
