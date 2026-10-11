# --- build stage: install all workspace deps and compile the API ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/api/package.json services/api/
COPY apps/admin/package.json apps/admin/
COPY packages/tokens/package.json packages/tokens/
COPY packages/ui/package.json packages/ui/
RUN npm ci

COPY . .
RUN npm run build --workspace services/api

# --- runtime stage: prod deps + compiled output only ---
FROM node:20-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/api/package.json services/api/
COPY apps/admin/package.json apps/admin/
COPY packages/tokens/package.json packages/tokens/
COPY packages/ui/package.json packages/ui/
RUN npm ci --omit=dev

COPY --from=build /app/services/api/dist services/api/dist
COPY --from=build /app/services/api/migrations services/api/migrations

EXPOSE 8080

CMD ["node", "services/api/dist/index.js"]
