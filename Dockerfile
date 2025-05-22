FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY swagger.yaml ./
COPY src ./src

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

COPY swagger.yaml ./swagger.yaml
COPY .env.production .env

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/server.js"]
