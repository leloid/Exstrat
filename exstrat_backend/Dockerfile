# Dockerfile pour le backend NestJS
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Copier le reste du code
COPY . .

# Générer Prisma Client
RUN npx prisma generate

# Build l'application
RUN npm run build

# Production
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers nécessaires
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Générer Prisma Client pour la production
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:prod"]

