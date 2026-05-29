# Multi-stage Dockerfile pour le frontend React

# Stage de base
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

# Stage de développement
FROM base AS development
ENV NODE_ENV=development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Stage de build
FROM base AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ENV NODE_ENV=production
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage de production avec Nginx
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Stage de test
FROM base AS test
ENV NODE_ENV=test
RUN npm ci
COPY . .
RUN npm run lint
RUN npm run build
CMD ["npm", "test"]