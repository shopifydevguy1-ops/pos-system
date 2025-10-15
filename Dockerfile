# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build the React app
RUN cd client && npm run build

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the application
CMD ["npm", "start"]
