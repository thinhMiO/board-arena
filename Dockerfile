# Production Dockerfile for BOARD ARENA
FROM node:20-alpine

WORKDIR /app

# Copy root and workspace package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies for all workspaces
RUN npm install

# Copy all source files
COPY . .

# Build the frontend client with Vite
RUN npm run build

# Default production port
ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

# Start unified Node.js server (Serving REST API + WebSockets + Static React Client)
CMD ["npm", "start"]
