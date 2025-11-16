# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./ 
COPY tsconfig.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2: run
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY package.json ./package.json
RUN npm ci --production --no-audit --no-fund
EXPOSE 3000
CMD ["node", "dist/server.js"]
