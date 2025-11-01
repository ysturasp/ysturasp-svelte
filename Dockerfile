FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production=false

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY --from=builder /usr/src/app/build ./build
COPY --from=builder /usr/src/app/.svelte-kit ./.svelte-kit
COPY --from=builder /usr/src/app/static ./static

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host"]