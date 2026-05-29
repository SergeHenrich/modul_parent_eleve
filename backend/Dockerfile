# Multi-stage Dockerfile pour le backend Node.js

# Stage de base
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package*.json ./
EXPOSE 5000

# Stage de développement
FROM base AS development
ENV NODE_ENV=development
RUN npm ci --include=dev
COPY . .
USER node
CMD ["dumb-init", "npm", "run", "dev"]

# Stage de build pour la production
FROM base AS build
ENV NODE_ENV=production
RUN npm ci --only=production && npm cache clean --force
COPY . .

# Stage de production
FROM node:18-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app .
USER nodejs
EXPOSE 5000
CMD ["dumb-init", "node", "server.js"]

# Stage de test
FROM development AS test
ENV NODE_ENV=test
RUN npm run test
CMD ["npm", "test"]