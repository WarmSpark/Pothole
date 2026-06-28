-- name: CreateUser :one
INSERT INTO users (username, display_name, avatar_url)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUser :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByUsername :one
SELECT * FROM users WHERE username = $1;

-- name: CreateRoom :one
INSERT INTO rooms (invite_code, created_by)
VALUES ($1, $2)
RETURNING *;

-- name: JoinRoom :one
UPDATE rooms
SET partner_id = $1
WHERE invite_code = $2 AND partner_id IS NULL AND created_by != $1
RETURNING *;

-- name: GetRoom :one
SELECT * FROM rooms WHERE id = $1;

-- name: GetRoomByInviteCode :one
SELECT * FROM rooms WHERE invite_code = $1;

-- name: UpdateRoomName :one
UPDATE rooms SET name = $2 WHERE id = $1 RETURNING *;

-- name: AddRoomMember :one
INSERT INTO room_members (room_id, user_id)
VALUES ($1, $2)
ON CONFLICT (room_id, user_id) DO NOTHING
RETURNING *;

-- name: GetRoomMembers :many
SELECT u.* 
FROM users u
JOIN room_members rm ON u.id = rm.user_id
WHERE rm.room_id = $1;

-- name: AddQueueItem :one
INSERT INTO queue_items (room_id, added_by, type, title, thumbnail_url, duration_seconds, source_url, youtube_id, tmdb_id, position)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: GetQueueItems :many
SELECT * FROM queue_items 
WHERE room_id = $1 AND played_at IS NULL
ORDER BY position ASC;

-- name: UpdateQueueItemPosition :exec
UPDATE queue_items SET position = $2 WHERE id = $1;

-- name: RemoveQueueItem :exec
DELETE FROM queue_items WHERE id = $1;

-- name: MarkQueueItemPlayed :exec
UPDATE queue_items SET played_at = NOW() WHERE id = $1;

-- name: AddMessage :one
INSERT INTO messages (room_id, user_id, content, type)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetMessages :many
SELECT * FROM messages
WHERE room_id = $1
ORDER BY created_at DESC
LIMIT 50;
