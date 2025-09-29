# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY admin/package*.json ./admin/
COPY player/package*.json ./player/

# Install dependencies
RUN npm ci --only=production

# Build admin app
FROM base AS admin-builder
WORKDIR /app
COPY admin/package*.json ./admin/
RUN cd admin && npm ci
COPY admin ./admin
RUN cd admin && npm run build

# Build player app
FROM base AS player-builder
WORKDIR /app
COPY player/package*.json ./player/
RUN cd player && npm ci
COPY player ./player
RUN cd player && npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Copy built applications
COPY --from=admin-builder /app/admin/build ./admin/build
COPY --from=player-builder /app/player/build ./player/build

# Copy server files
COPY server ./server
COPY package*.json ./
COPY .env ./

# Install production dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
