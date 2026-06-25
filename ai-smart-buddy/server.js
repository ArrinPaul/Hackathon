/**
 * Simple HTTP Server for AI Smart Buddy
 * Run: node server.js
 * Access: http://localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DEFAULT_CONFIG = {
    groqApiKey: '',
    groqModel: 'openai/gpt-oss-120b',
    groqBaseUrl: 'https://api.groq.com/openai/v1/chat/completions'
};

function loadDotEnv(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith('#')) {
            return;
        }

        const separatorIndex = trimmedLine.indexOf('=');
        if (separatorIndex === -1) {
            return;
        }

        const key = trimmedLine.slice(0, separatorIndex).trim();
        let value = trimmedLine.slice(separatorIndex + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    });
}

loadDotEnv(path.join(__dirname, '.env'));

function getClientConfig() {
    return {
        groqApiKey: process.env.GROQ_API_KEY || DEFAULT_CONFIG.groqApiKey,
        groqModel: process.env.GROQ_MODEL || DEFAULT_CONFIG.groqModel,
        groqBaseUrl: process.env.GROQ_BASE_URL || DEFAULT_CONFIG.groqBaseUrl
    };
}

function injectClientConfig(html) {
    const configScript = `<script>window.__AI_SMART_BUDDY_CONFIG__ = ${JSON.stringify(getClientConfig())};</script>`;

    if (html.includes('</head>')) {
        return html.replace('</head>', `${configScript}\n</head>`);
    }

    return `${configScript}\n${html}`;
}

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);

    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });

            if (extname === '.html') {
                res.end(injectClientConfig(content.toString('utf-8')));
                return;
            }

            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║         AI Smart Buddy - CampusFlow              ║
║                                                  ║
║  Server running at: http://localhost:${PORT}       ║
║                                                  ║
║  Press Ctrl+C to stop                            ║
╚══════════════════════════════════════════════════╝
    `);
});
