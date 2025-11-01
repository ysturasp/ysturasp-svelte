FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=5173

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/.svelte-kit ./.svelte-kit
COPY --from=build /app/static ./static
COPY vite.config.ts ./vite.config.ts

RUN chown -R nodeuser:nodejs /app

EXPOSE 5173

USER nodeuser

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]