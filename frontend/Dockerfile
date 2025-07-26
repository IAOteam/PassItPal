# --- Stage 1: Build Stage ---
# Use a specific Node.js version to build the React app
FROM node:22-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy all package.json and lock files to leverage Docker layer caching
# This ensures npm can resolve the "workspace:*" protocol
COPY package*.json ./
COPY server/package.json ./server/
COPY frontend/package.json ./frontend/
COPY packages/types/package.json ./packages/types/

# Install dependencies
# Running from the root installs dependencies for all workspaces
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the production-ready static files
# The --workspace flag tells npm to run the build script for the 'frontend' package
RUN npm run build --workspace=frontend

# --- Stage 2: Production Stage ---
# Use a lightweight Nginx image to serve the static files
FROM nginx:1.27-alpine

# Copy the built static files from the 'builder' stage to the Nginx public directory
# The build output is now located in the frontend/dist directory
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
# This ensures that all routes are directed to index.html for our Single-Page App
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx server
EXPOSE 80

# The default command for Nginx is to start the server, so we don't need a CMD instruction.
