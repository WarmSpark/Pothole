FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN apk add --no-cache ffmpeg cmake make g++ python3
RUN npm install

COPY . .

EXPOSE 3005

CMD ["npm", "start"]
