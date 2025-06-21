import { createServer } from 'http';
import { parse } from 'url';
import { readFileSync } from 'fs';
import { handleChat } from './api/chat.js';

const server = createServer(async (req, res) => {
  const { pathname } = parse(req.url, true);

  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const { message } = JSON.parse(body);
      const reply = await handleChat(message);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ reply }));
    });
  } else if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(readFileSync('./index.html'));
  } else if (pathname === '/style.css') {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end(readFileSync('./style.css'));
  } else if (pathname === '/script.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(readFileSync('./script.js'));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(process.env.PORT || 8080, () => {
  console.log('Server running on port 8080');
});