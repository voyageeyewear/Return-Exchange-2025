#!/bin/bash
set -e

echo "🔨 Building Return & Exchange System..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Verify build
if [ -d "build" ]; then
  echo "✅ Frontend build successful!"
  ls -la build
else
  echo "❌ Frontend build failed!"
  exit 1
fi

cd ..
echo "✅ Build complete!"

