# Backend Production Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies (ci for exact version match)
RUN npm ci --only=production

COPY . .

# Use non-root user for security
USER node

EXPOSE 5000

CMD ["node", "index.js"]
