
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'attendance.json');

// 1. Global Middleware
app.use(express.json());

/**
 * 2. API Routes (Check these before serving static files)
 */
app.get('/api/attendance', (req, res) => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return res.json(JSON.parse(data));
        }
        res.json({});
    } catch (err) {
        console.error('Read error:', err);
        res.status(500).json({ error: 'Failed to read attendance data' });
    }
});

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

/**
 * 3. Static Files
 */
app.use(express.static(__dirname));

/**
 * 4. Catch-all Route for SPA
 * The '(.*)' syntax is required for newer path-to-regexp versions to avoid the 
 * "Missing parameter name" error.
 */
app.get('(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('\x1b[36m%s\x1b[0m', '-----------------------------------------');
    console.log('\x1b[1m\x1b[32m%s\x1b[0m', '  UniAttend Shared Server is LIVE!');
    console.log('\x1b[36m%s\x1b[0m', '-----------------------------------------');
    console.log(` Port:    ${PORT}`);
    console.log(` Data:    ${DATA_FILE}`);
    console.log('\x1b[36m%s\x1b[0m', '-----------------------------------------');
});
