const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Library Management System Backend...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found. Creating default .env file...');
  const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
  fs.writeFileSync(envPath, envExample);
  console.log('✅ .env file created. Please update it with your database credentials.\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  exec('npm install', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error installing dependencies:', error);
      return;
    }
    console.log('✅ Dependencies installed successfully\n');
    startServer();
  });
} else {
  startServer();
}

function startServer() {
  console.log('🔧 Setting up database...');
  exec('node setup.js', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Database setup failed:', error);
      console.log('⚠️  Please ensure MySQL is running and check your .env configuration');
      return;
    }
    console.log(stdout);
    
    console.log('🌟 Starting server...');
    // Use spawn instead of exec to keep the server running
    const serverProcess = spawn('node', ['server.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });

    serverProcess.on('error', (error) => {
      console.error('❌ Server start failed:', error);
    });

    serverProcess.on('exit', (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down server...');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });
  });
}
