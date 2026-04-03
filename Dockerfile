# Use official Node.js image to build
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (only package.json first for cache)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build Next.js
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV production

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

# Start server
CMD ["node", "server.js"]
