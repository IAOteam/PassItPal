# ---- Stage 1: Build the entire monorepo using a single image ----
FROM node:22-alpine AS builder
# Use pnpm for better monorepo support and caching
RUN npm i -g pnpm

WORKDIR /app

# Copy lockfile and package.json files
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy all workspace package.json files
COPY server/package.json ./server/
COPY frontend/package.json ./frontend/
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and build the frontend package with Turbo
COPY . .
RUN pnpm turbo run build --filter=frontend

# ---- Stage 2: Serve with Nginx ----
FROM nginx:1.27-alpine-slim
# Copy the built static assets from the builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
# Copy your custom Nginx configuration from the source code
COPY --from=builder /app/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
