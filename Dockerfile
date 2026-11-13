# Stage 1: Build Frontend
FROM node:22-alpine AS client-builder
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm ci --workspace=client
COPY client/ ./client/
ENV VITE_API_URL=""
RUN npm run build --workspace=client

# Stage 2: Build Backend
FROM node:22-alpine AS server-builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
COPY prisma/ ./prisma/
RUN npm ci --workspace=server
RUN npx prisma generate --schema=prisma/schema.prisma
COPY server/ ./server/
RUN npm run build --workspace=server

# Stage 3: Unified Production Runtime
FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache openssl

# Explicitly install Prisma CLI pinned to 5.22.0 and tsx globally for migration and seed execution (S3)
RUN npm install -g prisma@5.22.0 tsx

# Set up non-root user and directories
ENV NODE_ENV=production
ENV TZ=Asia/Bangkok
ENV PORT=3000
EXPOSE 3000

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm ci --omit=dev --workspace=server

COPY --from=server-builder /app/prisma ./prisma
COPY --from=server-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=server-builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/src ./server/src
COPY --from=client-builder /app/client/dist ./client/dist
COPY server/docker-entrypoint.sh ./server/docker-entrypoint.sh

RUN chmod +x ./server/docker-entrypoint.sh && chown -R node:node /app

USER node
WORKDIR /app/server

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
