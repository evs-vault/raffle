const { execSync } = require('child_process');
const path = require('path');

console.log('Building frontend applications...');

try {
  // Build admin
  console.log('Building admin panel...');
  process.chdir(path.join(__dirname, 'admin'));
  execSync('npm ci', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  
  // Build player
  console.log('Building player interface...');
  process.chdir(path.join(__dirname, 'player'));
  execSync('npm ci', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('All frontends built successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
