const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 5000;
const LOCAL_HTML = path.join(__dirname, 'caisse-pos-autonome.html');
const DESKTOP_HTML = 'C:\\Users\\PC\\Desktop\\CAISSE-BOUTIQUE-PRO.html';
const HTML_FILE = fs.existsSync(LOCAL_HTML) ? LOCAL_HTML : DESKTOP_HTML;
const APK_FILE = path.join(__dirname, 'Afrinex-Boutique.apk');

// Dossier de persistance locale du Hub
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const JOURNAL_FILE = path.join(DATA_DIR, 'hub_journal_ventes.json');
const CLOTURES_FILE = path.join(DATA_DIR, 'hub_clotures_z.json');

// Chargement en mémoire des index d'idempotence
let journalVentes = [];
let cloturesZ = [];
const seenClientUuids = new Set();

try {
  if (fs.existsSync(JOURNAL_FILE)) {
    journalVentes = JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf8'));
    journalVentes.forEach(v => {
      if (v.uuid_client) seenClientUuids.add(v.uuid_client);
    });
  }
} catch (e) {
  console.error('[HUB DB] Erreur lecture journal_ventes:', e.message);
}

try {
  if (fs.existsSync(CLOTURES_FILE)) {
    cloturesZ = JSON.parse(fs.readFileSync(CLOTURES_FILE, 'utf8'));
    cloturesZ.forEach(c => {
      if (c.uuid_client) seenClientUuids.add(c.uuid_client);
    });
  }
} catch (e) {
  console.error('[HUB DB] Erreur lecture clotures_z:', e.message);
}

function getLocalIpAddresses() {
  const ips = [];
  const ifaces = os.networkInterfaces();
  for (const name in ifaces) {
    for (const net of ifaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ name, address: net.address });
      }
    }
  }
  return ips;
}

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

  // Headers CORS pour synchronisation universelle multi-postes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Terminal-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Health check & Ping
  if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('pong');
    return;
  }

  // 2. Info Réseau Local du Hub
  if (req.url === '/api/network-info') {
    const ips = getLocalIpAddresses();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'active',
      hubMode: 'master',
      port: PORT,
      interfaces: ips,
      primaryIp: ips.length > 0 ? ips[0].address : '127.0.0.1',
      hubUrl: `http://${ips.length > 0 ? ips[0].address : 'localhost'}:${PORT}`,
      totalVentesIngerees: journalVentes.length,
      totalCloturesZ: cloturesZ.length,
      serverTime: new Date().toISOString()
    }));
    return;
  }

  // 3. Statut de Synchronisation du Hub
  if (req.url === '/api/sync/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      totalVentes: journalVentes.length,
      totalCloturesZ: cloturesZ.length,
      derniereSynchro: journalVentes.length > 0 ? journalVentes[journalVentes.length - 1].enregistre_le : null,
      serverTime: new Date().toISOString()
    }));
    return;
  }

  // 4. Endpoint de Synchronisation Réseau Local (POST /api/sync)
  if (req.url === '/api/sync' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Limite de taille : 20 Mo
      if (body.length > 20 * 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload trop volumineux' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const terminalId = payload.terminal_id || req.headers['x-terminal-id'] || 'SATELLITE-INCONNU';
        const incomingVentes = Array.isArray(payload.transactions) ? payload.transactions : [];
        const incomingZ = Array.isArray(payload.clotures_z) ? payload.clotures_z : [];

        let acceptedVentes = 0;
        let skippedVentes = 0;
        let acceptedZ = 0;
        let skippedZ = 0;

        const serverNow = new Date().toISOString();

        // Traitement des transactions avec idempotence stricte
        incomingVentes.forEach(v => {
          if (!v.uuid_client) {
            // Création d'un UUID de secours si absent
            v.uuid_client = 'TX-' + Math.random().toString(36).substring(2, 10);
          }

          if (seenClientUuids.has(v.uuid_client)) {
            skippedVentes++;
          } else {
            seenClientUuids.add(v.uuid_client);
            v.terminal_source = terminalId;
            v.enregistre_le = serverNow; // Horodatage serveur légal faisant foi
            journalVentes.push(v);
            acceptedVentes++;
          }
        });

        // Traitement des clôtures Z
        incomingZ.forEach(z => {
          const zId = z.uuid_client || `Z-${z.numero_z}-${z.date_cloture}`;
          if (seenClientUuids.has(zId)) {
            skippedZ++;
          } else {
            seenClientUuids.add(zId);
            z.uuid_client = zId;
            z.terminal_source = terminalId;
            z.enregistre_le = serverNow;
            cloturesZ.push(z);
            acceptedZ++;
          }
        });

        // Sauvegarde asynchrone sur disque
        if (acceptedVentes > 0) {
          fs.writeFileSync(JOURNAL_FILE, JSON.stringify(journalVentes, null, 2), 'utf8');
        }
        if (acceptedZ > 0) {
          fs.writeFileSync(CLOTURES_FILE, JSON.stringify(cloturesZ, null, 2), 'utf8');
        }

        console.log(`[SYNC INGEST] Terminal ${terminalId} : +${acceptedVentes} ventes (+${skippedVentes} doublons ignorés) | +${acceptedZ} Z`);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          terminal_id: terminalId,
          acceptedVentes,
          skippedVentes,
          acceptedZ,
          skippedZ,
          totalJournalServer: journalVentes.length,
          enregistre_le: serverNow
        }));
      } catch (err) {
        console.error('[SYNC ERROR]:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Format JSON invalide', details: err.message }));
      }
    });
    return;
  }

  // 5. Téléchargement direct de l'APK Android
  if (req.url === '/Afrinex-Boutique.apk' || req.url === '/download/apk') {
    if (fs.existsSync(APK_FILE)) {
      const stat = fs.statSync(APK_FILE);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename="Afrinex-Boutique.apk"'
      });
      fs.createReadStream(APK_FILE).pipe(res);
      return;
    }
  }

  // 6. Gestion des images et fichiers statiques dans assets/
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
        '.ico': 'image/x-icon',
        '.js': 'application/javascript',
        '.css': 'text/css'
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

  // 7. Page Web Caisse POS
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
  const ips = getLocalIpAddresses();
  console.log(`\n======================================================`);
  console.log(`🌐 HUB SERVEUR CAISSE MULTI-POSTES AFRINEX ACTIF`);
  console.log(`   Accès Local PC : http://localhost:${PORT}`);
  ips.forEach(ip => {
    console.log(`   Accès Réseau Wi-Fi/LAN (${ip.name}) : http://${ip.address}:${PORT}`);
  });
  console.log(`   Endpoint Synchronisation : POST http://<IP>:${PORT}/api/sync`);
  console.log(`   Téléchargement APK : http://<IP>:${PORT}/Afrinex-Boutique.apk`);
  console.log(`======================================================\n`);
});

// Empêche Node de quitter
setInterval(() => {}, 60000);
