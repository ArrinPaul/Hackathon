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
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const appRoutes = [
    '/',
    '/chat',
    '/flashcards',
    '/quiz',
    '/tools',
    '/tools/summarize-notes',
    '/tools/study-schedule',
    '/tools/concept-map',
    '/tools/explain-concept',
    '/tools/attendance-risk',
    '/tools/notice-summarizer'
];

function isAppRoute(urlPath) {
    const cleanPath = urlPath.split('?')[0].split('#')[0];
    return appRoutes.includes(cleanPath);
}

const server = http.createServer((req, res) => {
    const urlPath = req.url.split('?')[0].split('#')[0];

    if (urlPath === '/') {
        const indexPath = path.join(__dirname, 'index.html');
        fs.readFile(indexPath, (error, content) => {
            if (error) {
                res.writeHead(500);
                res.end('Server Error');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(injectClientConfig(content.toString('utf-8')));
        });
        return;
    }

    const filePath = path.join(__dirname, urlPath);
    const extname = path.extname(filePath).toLowerCase();

    if (extname && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const contentType = mimeTypes[extname] || 'application/octet-stream';
        const content = fs.readFileSync(filePath);

        if (extname === '.html') {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(injectClientConfig(content.toString('utf-8')));
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
        return;
    }

    if (isAppRoute(urlPath)) {
        const indexPath = path.join(__dirname, 'index.html');
        fs.readFile(indexPath, (error, content) => {
            if (error) {
                res.writeHead(500);
                res.end('Server Error');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(injectClientConfig(content.toString('utf-8')));
        });
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Not Found</h1>');
});

server.listen(PORT, () => {
    console.log(`
  AI Smart Buddy - CampusFlow

  Server running at: http://localhost:${PORT}

  Routes:
    /chat              - AI Chat Assistant
    /flashcards        - Flashcard Generator
    /quiz              - MCQ Quiz Generator
    /tools             - Smart Tools
    /tools/:toolSlug   - Individual Smart Tool

  Press Ctrl+C to stop
    `);
});
