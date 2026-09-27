FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/api/package.json services/api/
COPY apps/admin/package.json apps/admin/
COPY packages/tokens/package.json packages/tokens/
COPY packages/ui/package.json packages/ui/
RUN npm ci

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev", "--workspace", "services/api"]
