const http = require('http');

function fetchPage(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let body = '';
      res.on('data', (c) => body += c.toString());
      res.on('end', () => {
        // Look for Next.js error overlay or compile errors
        const hasError = body.includes('__nextjs_error') ||
          body.includes('next-error') ||
          body.includes('Build Error') ||
          body.includes('Compile Error') ||
          (body.includes('Error:') && body.length < 1000);

        // Extract error
        let error = null;
        const m = body.match(/Error:\s*([^<]{10,300})/);
        if (m) error = m[1].trim();

        resolve({ path, status: res.statusCode, len: body.length, hasError, error, preview: body.slice(0, 300) });
      });
    });
    req.on('error', (e) => reject(e));
    req.setTimeout(5000, () => reject(new Error('timeout')));
  });
}

async function main() {
  const pages = ['/', '/garden', '/graph', '/chat', '/plant', '/login', '/drafts', '/settings'];
  for (const p of pages) {
    try {
      const r = await fetchPage(p);
      console.log(`[${r.status}] ${p} — ${r.len} bytes ${r.hasError ? '⚠️ ERROR' : ''} ${r.error ? r.error : ''}`);
      if (r.hasError || r.status >= 500) console.log('  Preview:', r.preview.slice(0, 200));
    } catch(e) {
      console.log(`[ERR] ${p} — ${e.message}`);
    }
  }
}
main().catch(e => console.error(e));
