FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/admin/package.json apps/admin/
COPY packages/tokens/package.json packages/tokens/
COPY packages/ui/package.json packages/ui/
RUN npm ci

COPY . .
RUN npm run build --workspace apps/admin

EXPOSE 3000

CMD ["npm", "start", "--workspace", "apps/admin"]
