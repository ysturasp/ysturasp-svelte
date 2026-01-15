FROM node:20-bookworm-slim AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-bookworm-slim AS build

WORKDIR /app
ENV NODE_ENV=production \
    BUILD_ADAPTER=node

# Build-time envs for import.meta.env (VITE_*) only
ARG VITE_NOTIFICATIONS_API_URL
ENV VITE_NOTIFICATIONS_API_URL=$VITE_NOTIFICATIONS_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prepare && npm run build

FROM node:20-bookworm-slim AS prod-deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --omit=optional --no-audit --no-fund && npm cache clean --force

FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runner

ARG DATABASE_URL
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG YOOKASSA_SHOP_ID
ARG YOOKASSA_SECRET_KEY
ARG GROQ_API_KEY
ARG SESSION_SECRET
ARG BOT_DATABASE
ARG TELEGRAM_BOT_TOKEN
ARG REDIS_HOST
ARG REDIS_PORT
ARG REDIS_PASSWORD
ARG ONLINE_SECRET
ARG YSTU_TOKENS_SECRET
ARG YSTU_OAUTH_CLIENT_ID
ARG YSTU_OAUTH_CLIENT_SECRET
ARG YSTU_OAUTH_REDIRECT_URI

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=5173 \
    BODY_SIZE_LIMIT=50M \
    DATABASE_URL=${DATABASE_URL:-} \
    GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-} \
    GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-} \
    YOOKASSA_SHOP_ID=${YOOKASSA_SHOP_ID:-} \
    YOOKASSA_SECRET_KEY=${YOOKASSA_SECRET_KEY:-} \
    GROQ_API_KEY=${GROQ_API_KEY:-} \
    SESSION_SECRET=${SESSION_SECRET:-} \
    BOT_DATABASE=${BOT_DATABASE:-} \
    TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:-} \
    REDIS_HOST=${REDIS_HOST:-} \
    REDIS_PORT=${REDIS_PORT:-} \
    REDIS_PASSWORD=${REDIS_PASSWORD:-} \
    ONLINE_SECRET=${ONLINE_SECRET:-} \
    YSTU_TOKENS_SECRET=${YSTU_TOKENS_SECRET:-} \
    YSTU_OAUTH_CLIENT_ID=${YSTU_OAUTH_CLIENT_ID:-} \
    YSTU_OAUTH_CLIENT_SECRET=${YSTU_OAUTH_CLIENT_SECRET:-} \
    YSTU_OAUTH_REDIRECT_URI=${YSTU_OAUTH_REDIRECT_URI:-}
    
COPY --chown=nonroot:nonroot --from=prod-deps /app/node_modules ./node_modules
COPY --chown=nonroot:nonroot --from=build /app/build ./build

EXPOSE 5173

USER nonroot

CMD ["build/index.js"]