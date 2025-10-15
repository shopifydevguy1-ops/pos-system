#!/bin/bash

# Vercel-optimized build script
echo "Starting Vercel build..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build client
echo "Building client..."
cd client
npm install
npm run build

echo "Vercel build completed successfully!"
