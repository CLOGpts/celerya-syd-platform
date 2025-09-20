const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './index.html';

  const extname = path.extname(filePath);
  let contentType = 'text/html';

  switch(extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.jsx': contentType = 'text/javascript'; break;
    case '.ts': contentType = 'text/javascript'; break;
    case '.tsx': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end('File not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(5174, () => {
  console.log('🚀 Server running at http://localhost:5174/');
  console.log('✅ NO DEPENDENCIES NEEDED');
  console.log('✅ SERVES FILES WITH CORRECT MIME TYPES');
});