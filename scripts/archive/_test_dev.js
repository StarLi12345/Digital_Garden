const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');

const cwd = __dirname;
console.log('Starting Next.js dev server...');

const child = spawn('npx', ['next', 'dev'], {
  cwd,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env, PATH: process.env.PATH },
});

let output = '';
child.stdout.on('data', (d) => { output += d.toString(); });
child.stderr.on('data', (d) => { output += d.toString(); });

// After 10 seconds, try to access the page
setTimeout(() => {
  console.log('--- Server stdout/stderr ---');
  console.log(output.slice(-3000));

  // Try HTTP request
  const req = http.get('http://localhost:3000', (res) => {
    let body = '';
    res.on('data', (c) => body += c.toString());
    res.on('end', () => {
      console.log('--- HTTP Response ---');
      console.log('Status:', res.statusCode);
      // Extract error message if any
      const errMatch = body.match(/<div[^>]*id="[^"]*error[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
        || body.match(/Error:([^<]+)/)
        || body.match(/error:\s*"([^"]+)"/)
        || body.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
      if (errMatch) console.log('Error found:', errMatch[1]?.slice(0, 500) || errMatch[0]?.slice(0, 500));
      console.log('Body length:', body.length);
      console.log('First 500 chars:', body.slice(0, 500));
      child.kill();
      process.exit(0);
    });
  });
  req.on('error', (e) => {
    console.log('HTTP connection error:', e.message);
    child.kill();
    process.exit(1);
  });
  req.setTimeout(5000, () => {
    console.log('HTTP request timed out');
    child.kill();
    process.exit(1);
  });
}, 10000);
