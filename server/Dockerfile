# Backend Production Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies (ci for exact version match)
RUN npm ci --only=production

COPY . .

# Pre-create logs directory and set permissions
RUN mkdir -p logs && chown -R node:node /app

# Use non-root user for security
USER node

EXPOSE 5000

CMD ["node", "index.js"]
