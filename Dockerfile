# =============================================================================
# Stage 1: Build the React frontend
# No VITE_* build args needed — the app fetches all config from GET /config
# at runtime, so the bundle is environment-agnostic.
# =============================================================================
FROM node:20-alpine AS frontend-build

WORKDIR /app
COPY package*.json bun.lockb* ./
RUN npm install -g bun && bun install || npm install
COPY . .
RUN npm run build

# =============================================================================
# Stage 2: Build the Express server (TypeScript → JavaScript)
# =============================================================================
FROM node:20-alpine AS server-build

WORKDIR /server
COPY server/package*.json ./
RUN npm install
COPY server/ .
RUN npm run build

# =============================================================================
# Stage 3: Production image
# All config — URLs, client IDs, secrets — is injected at runtime via env vars.
# No rebuild needed when any value changes.
# =============================================================================
FROM node:20-slim AS production

WORKDIR /app

# Frontend static files
COPY --from=frontend-build /app/dist ./dist

# Server compiled JS and its dependencies
COPY --from=server-build /server/dist ./server/dist
COPY --from=server-build /server/node_modules ./server/node_modules

EXPOSE 8080

CMD ["node", "server/dist/server.js"]
