# --- Stage 1: Build Stage ---
# Use a specific Node.js version to build the React app
FROM node:22-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY frontend/package*.json ./
COPY ../packages/types/package.json ../packages/types/

# Install dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY frontend/ ./

# Copy the shared types too
COPY ../packages/types ../packages/types

# Build the production-ready static files
RUN npm run build

# --- Stage 2: Production Stage ---
# Use a lightweight Nginx image to serve the static files
FROM nginx:1.27-alpine

# Copy the built static files from the 'builder' stage to the Nginx public directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
# This ensures that all routes are directed to index.html for our Single-Page App
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx server
EXPOSE 80

# The default command for Nginx is to start the server, so we don't need a CMD instruction.
