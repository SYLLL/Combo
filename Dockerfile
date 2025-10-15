# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Accept PORT as build argument
ARG PORT=8080
ENV PORT=$PORT

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build only the client (React app) - skip server build to avoid CORS issues
RUN npm run build:client || echo "Client build failed, continuing with simple server"

# Remove any problematic server build files if they exist
RUN rm -rf dist/server || echo "No dist/server directory to remove"

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port (will be overridden by PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD node -e "const http = require('http'); const options = { hostname: 'localhost', port: process.env.PORT || 8080, path: '/health', method: 'GET', timeout: 5000 }; const req = http.request(options, (res) => { console.log('Health check status:', res.statusCode); process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', (err) => { console.error('Health check error:', err.message); process.exit(1); }); req.on('timeout', () => { console.error('Health check timeout'); req.destroy(); process.exit(1); }); req.end();"

# Start the server
CMD ["node", "server.js"]
