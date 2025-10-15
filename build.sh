#!/bin/bash

# Memory-optimized build script for Render
echo "Starting memory-optimized build..."

# Set memory limits
export NODE_OPTIONS="--max-old-space-size=4096"

# Install root dependencies
echo "Installing root dependencies..."
npm install --production --no-optional --no-audit --no-fund

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install --production --no-optional --no-audit --no-fund

# Build with memory optimization
echo "Building client..."
GENERATE_SOURCEMAP=false NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo "Build completed successfully!"
