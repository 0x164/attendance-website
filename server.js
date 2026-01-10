import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'attendance.json');

// --- SESSION MAPPING (Static Schedule Logic) ---
const DEFAULT_SCHEDULE_MAPPING = [
  { id: 'mon_1', courseCode: 'FIT1047', sessionType: 'W02' },
  { id: 'tue_1', courseCode: 'FIT1058', sessionType: 'W02-P1' },
  { id: 'tue_2', courseCode: 'FIT1058', sessionType: 'W02-P2' },
  { id: 'tue_3', courseCode: 'FIT1051', sessionType: 'W01' },
  { id: 'wed_1', courseCode: 'FIT1045', sessionType: 'W02' },
  { id: 'wed_2', courseCode: 'FIT1058', sessionType: 'A01' },
  { id: 'thu_1', courseCode: 'FIT1047', sessionType: 'A01' },
  { id: 'fri_1', courseCode: 'FIT1051', sessionType: 'A08' },
  { id: 'fri_2', courseCode: 'FIT1045', sessionType: 'A08' }
];

// Global Middleware
app.use(express.json());
app.use((req, res, next) => {
    if (req.path.endsWith('.tsx') || req.path.endsWith('.ts')) {
        res.set('Content-Type', 'application/javascript');
    }
    next();
});

// Data persistence helpers
const loadData = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
        return {};
    } catch (err) {
        return {};
    }
};

const saveData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
};

/**
 * CLEAN VERSIONED API (v1)
 */

// 1. Get All Data (Dashboard)
app.get('/api/attendance', (req, res) => {
    res.json(loadData());
});

// 2. Delta Update (App Persistence)
app.post('/api/attendance/update', (req, res) => {
    const { weekId, sessionId, value } = req.body;
    if (!weekId || !sessionId) return res.status(400).json({ error: 'Missing IDs' });
    const data = loadData();
    if (!data[weekId]) data[weekId] = {};
    data[weekId][sessionId] = (value || "").toUpperCase().slice(0, 5);
    saveData(data);
    res.json({ success: true });
});

/**
 * 3. Targeted Lookup Endpoint
 * Usage: GET /api/v1/code/:weekId/:courseCode/:sessionType
 * Example: GET /api/v1/code/w1/FIT1047/W02
 */
app.get('/api/v1/code/:weekId/:courseCode/:sessionType', (req, res) => {
    const { weekId, courseCode, sessionType } = req.params;
    
    // Find internal ID for this course+session
    const session = DEFAULT_SCHEDULE_MAPPING.find(
        s => s.courseCode.toLowerCase() === courseCode.toLowerCase() && 
             s.sessionType.toLowerCase() === sessionType.toLowerCase()
    );

    if (!session) {
        return res.status(404).json({ error: 'Session configuration not found' });
    }

    const data = loadData();
    const weekData = data[weekId] || {};
    const code = weekData[session.id] || "";

    res.json({
        weekId,
        courseCode: session.courseCode,
        sessionType: session.sessionType,
        code: code,
        found: !!code
    });
});

/**
 * Static Files & SPA Routing
 */
app.use(express.static(__dirname));
app.use((req, res) => {
    const ext = path.extname(req.path);
    if (ext && ext !== '.html') res.status(404).send('Not Found');
    else res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('\x1b[36m%s\x1b[0m', '-----------------------------------------');
    console.log('\x1b[1m\x1b[32m%s\x1b[0m', '  UniAttend API Server LIVE');
    console.log('\x1b[36m%s\x1b[0m', '-----------------------------------------');
    console.log(` Endpoints:`);
    console.log(`  GET  /api/v1/code/:w/:c/:s -> Targeted Code Lookup`);
    console.log(`  POST /api/attendance/update -> Internal App Sync`);
    console.log('\x1b[36m%s\x1b[0m', '-----------------------------------------');
});