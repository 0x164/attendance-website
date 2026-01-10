
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'attendance.json');

// Global Middleware
app.use(express.json());

// MIME Type Fix for .tsx and .ts files
app.use((req, res, next) => {
    if (req.path.endsWith('.tsx') || req.path.endsWith('.ts')) {
        res.set('Content-Type', 'application/javascript');
    }
    next();
});

/**
 * Optimized API Routes
 */

// Helper to load attendance data
const loadData = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
        return {};
    } catch (err) {
        console.error('Read error:', err);
        return {};
    }
};

app.get('/api/attendance', (req, res) => {
    res.json(loadData());
});

// Full overwrite endpoint (kept for compatibility)
app.post('/api/attendance', (req, res) => {
    try {
        const newData = req.body;
        fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2), 'utf8');
        res.json({ success: true });
    } catch (err) {
        console.error('Write error:', err);
        res.status(500).json({ error: 'Failed to save attendance data' });
    }
});

// NEW: Optimized Partial Update endpoint
app.post('/api/attendance/update', (req, res) => {
    try {
        const { weekId, sessionId, value } = req.body;
        
        if (!weekId || !sessionId) {
            return res.status(400).json({ error: 'Missing weekId or sessionId' });
        }

        const currentData = loadData();
        
        // Deep merge the specific field
        if (!currentData[weekId]) currentData[weekId] = {};
        currentData[weekId][sessionId] = value;

        fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2), 'utf8');
        res.json({ success: true });
    } catch (err) {
        console.error('Partial update error:', err);
        res.status(500).json({ error: 'Failed to update attendance' });
    }
});

/**
 * Static Files & SPA Routing
 */
app.use(express.static(__dirname));

app.use((req, res) => {
    const ext = path.extname(req.path);
    if (ext && ext !== '.html') {
        res.status(404).send('Not Found');
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('\x1b[36m%s\x1b[0m', '-----------------------------------------');
    console.log('\x1b[1m\x1b[32m%s\x1b[0m', '  UniAttend Shared Server is LIVE!');
    console.log('\x1b[36m%s\x1b[0m', '-----------------------------------------');
    console.log(` Port:    ${PORT}`);
    console.log(` Optimization: Delta Sync Enabled`);
    console.log('\x1b[36m%s\x1b[0m', '-----------------------------------------');
});
