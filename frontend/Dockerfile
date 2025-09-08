# ---- Stage 1: Base image with dependencies ----
FROM node:22-alpine AS base
WORKDIR /app

# Copy all package.json files from the monorepo root
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY frontend/package.json ./frontend/
COPY packages/types/package.json ./packages/types/

# Install all monorepo dependencies
RUN npm install

# ---- Stage 2: Build the 'types' package ----
FROM base AS types-builder
WORKDIR /app
COPY packages/types ./packages/types
RUN npm run build --workspace=@passitpal/types

# ---- Stage 3: Build the 'frontend' application ----
FROM base AS frontend-builder
WORKDIR /app
# Copy the built types from the previous stage
COPY --from=types-builder /app/packages/types/dist ./packages/types/dist
# Copy frontend source code
COPY frontend ./frontend
RUN npm run build --workspace=frontend

# ---- Stage 4: Serve with Nginx ----
FROM nginx:1.27-alpine-slim
# Copy the built static assets from the frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
# Copy your custom Nginx configuration FROM THE BUILDER STAGE
COPY --from=frontend-builder /app/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
