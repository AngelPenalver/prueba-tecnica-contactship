FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install ALL dependencies (needed for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install ALL dependencies (some are needed at runtime)
RUN pnpm install --frozen-lockfile

# Copy built application from base stage
COPY --from=base /app/dist ./dist

# Expose port
EXPOSE 4321

# Start the application
CMD ["node", "dist/main.js"]
