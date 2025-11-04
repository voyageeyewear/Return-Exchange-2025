#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 Running postinstall script...');
console.log('📌 NODE_ENV:', process.env.NODE_ENV);

if (process.env.NODE_ENV === 'production') {
  console.log('🏗️  Production build detected - building frontend...');
  
  const frontendDir = path.join(__dirname, '..', 'frontend');
  
  try {
    // Check if frontend directory exists
    if (!fs.existsSync(frontendDir)) {
      console.error('❌ Frontend directory not found:', frontendDir);
      process.exit(1);
    }
    
    console.log('📦 Installing frontend dependencies...');
    // Use npm install with force flag for Railway compatibility
    execSync('npm install --production=false --legacy-peer-deps', { 
      cwd: frontendDir, 
      stdio: 'inherit' 
    });
    
    console.log('🔨 Building frontend...');
    execSync('npm run build', { 
      cwd: frontendDir, 
      stdio: 'inherit' 
    });
    
    const buildDir = path.join(frontendDir, 'build');
    if (fs.existsSync(buildDir)) {
      console.log('✅ Frontend build successful!');
      console.log('📁 Build directory:', buildDir);
    } else {
      console.error('❌ Frontend build directory not found!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
} else {
  console.log('ℹ️  Development mode - skipping frontend build');
}

console.log('✅ Postinstall complete!');

