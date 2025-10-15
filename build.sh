#!/bin/bash

# Ultra-lightweight build script for Render
echo "Starting ultra-lightweight build..."

# Set very conservative memory limits
export NODE_OPTIONS="--max-old-space-size=2048"

# Install only essential dependencies
echo "Installing root dependencies..."
npm install --production --no-optional --no-audit --no-fund --no-save

# Install client dependencies with minimal memory
echo "Installing client dependencies..."
cd client
npm install --production --no-optional --no-audit --no-fund --no-save

# Build with minimal memory usage
echo "Building client..."
GENERATE_SOURCEMAP=false NODE_OPTIONS="--max-old-space-size=2048" npm run build

echo "Build completed successfully!"
