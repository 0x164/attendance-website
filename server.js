
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'attendance.json');

// Middleware
app.use(express.json());
// Serve static files (index.html, index.tsx, etc.) from the current directory
app.use(express.static(__dirname));

/**
 * API: Get all attendance data
 */
app.get('/api/attendance', (req, res) => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return res.json(JSON.parse(data));
        }
        // Return empty object if file doesn't exist yet
        res.json({});
    } catch (err) {
        console.error('Read error:', err);
        res.status(500).json({ error: 'Failed to read attendance data' });
    }
});

/**
 * API: Update attendance data
 */
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

// Fallback to index.html for client-side routing if needed
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(` UniAttend Server running!`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Storage: ${DATA_FILE}`);
    console.log(`-----------------------------------------`);
});
