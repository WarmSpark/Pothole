FROM golang:alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o togethr-backend .

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/togethr-backend .

EXPOSE 8080
CMD ["./togethr-backend"]
