FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --workspace=apps/web --include-workspace-root=false

COPY apps/web apps/web
RUN npm --workspace=apps/web run build

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/apps/web/dist /srv/frontend
