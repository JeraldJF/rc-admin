# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb* ./

# Install dependencies using bun (if available) or npm
RUN npm install -g bun && bun install || npm install

# Copy environment file first
COPY .env* ./

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port 8080 (Vite preview server)
EXPOSE 8080

# Start the preview server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8080"]