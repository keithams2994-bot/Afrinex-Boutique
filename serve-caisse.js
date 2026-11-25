const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const LOCAL_HTML = path.join(__dirname, 'caisse-pos-autonome.html');
const DESKTOP_HTML = 'C:\\Users\\PC\\Desktop\\CAISSE-BOUTIQUE-PRO.html';
const HTML_FILE = fs.existsSync(LOCAL_HTML) ? LOCAL_HTML : DESKTOP_HTML;

process.on('uncaughtException', (err) => {
  console.error('[SAFEGUARD] Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[SAFEGUARD] Unhandled Rejection:', reason);
});

const server = http.createServer((req, res) => {
  req.on('error', (err) => {
    console.error('Request error:', err.message);
  });
  res.on('error', (err) => {
    console.error('Response error:', err.message);
  });

  if (req.url === '/ping') {
    try {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('pong');
    } catch (e) {}
    return;
  }

  // Gestion des images et fichiers statiques dans assets/
  if (req.url.startsWith('/assets/')) {
    const safePath = path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, safePath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.ico': 'image/x-icon'
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400'
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  fs.readFile(HTML_FILE, 'utf8', (err, content) => {
    if (res.writableEnded || res.destroyed) return;
    try {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Erreur de lecture du fichier caisse : ' + err.message);
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content);
    } catch (e) {
      console.error('Error sending response:', e.message);
    }
  });
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur Caisse Boutique Pro actif sur http://localhost:${PORT}`);
});

// Empêche Node de quitter
setInterval(() => {}, 60000);

