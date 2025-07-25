# ---  Build Stage ---
# Use an official Node.js image that includes build tools
FROM node:22-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker layer caching
COPY server/package*.json ./server/
COPY packages/types/package.json ../packages/types/
COPY packages/types/index.ts ../packages/types/

# Install all dependencies, including devDependencies needed for building
RUN cd server && npm install

# Copy the full source code from the subdirectories
COPY server ./server
COPY packages ./packages

# Transpile TypeScript to JavaScript
RUN cd server && npm run build
# --- Production Stage ---
# Use a slim, secure base image for the final container
FROM node:22-alpine

WORKDIR /app

# Copy only the production package files
COPY server/package*.json ./

# Install ONLY production dependencies to keep the image small
RUN npm install --omit=dev

# Copy the compiled JavaScript code from the 'builder' stage
COPY --from=builder /app/server/dist ./dist

# Expose the port the app runs on
EXPOSE 5001

# The command to run when the container starts
CMD ["node", "dist/server/src/app.js"]
