# --- Stage 1: Build Stage ---
# Use an official Node.js image that includes build tools
FROM node:22-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker layer caching
COPY package*.json ./

# Install all dependencies, including devDependencies needed for building
RUN npm install

# Copy the rest of your application's source code
COPY . .

# Transpile TypeScript to JavaScript
RUN npm run build

# --- Stage 2: Production Stage ---
# Use a slim, secure base image for the final container
FROM node:22-alpine

WORKDIR /app

# Copy only the production package files
COPY package*.json ./

# Install ONLY production dependencies to keep the image small
RUN npm install --omit=dev

# Copy the compiled JavaScript code from the 'builder' stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 5001

# The command to run when the container starts
CMD [ "node", "dist/app.js" ]
