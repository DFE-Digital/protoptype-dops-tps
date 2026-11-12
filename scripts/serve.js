const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../dist');
const port = Number(process.env.PORT || 4173);
const basePath = process.env.BASE_PATH || '';
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.txt': 'text/plain' };
http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (basePath && !pathname.startsWith(basePath + '/')) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  const relativePath = pathname.slice(basePath.length);
  const file = path.resolve(root, '.' + (relativePath === '/' ? '/index.html' : relativePath));
  if (!file.startsWith(root + path.sep)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }
  fs.readFile(file, (error, content) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500);
      response.end(error.code === 'ENOENT' ? 'Not found' : 'Could not read the file');
      return;
    }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    response.end(content);
  });
}).listen(port, '127.0.0.1', () => console.log(`Prototype ready at http://127.0.0.1:${port}`));
