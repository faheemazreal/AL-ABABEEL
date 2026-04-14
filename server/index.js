import express from 'express';
import cors from 'cors';
import { db, initDb } from './database.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super-secret-aidconnect-key-2026';

// Users API
app.post('/api/auth/login', (req, res) => {
    const { email, password, role } = req.body;

    // If just role is provided, simulate test login for backwards compatibility with test UI buttons
    if (role && !email) {
        db.get('SELECT * FROM users WHERE role = ? LIMIT 1', [role], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: "No user found for role" });
            const token = jwt.sign({ id: row.id, role: row.role }, JWT_SECRET, { expiresIn: '1d' });
            return res.json({ token, user: row });
        });
        return;
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        delete user.password;
        res.json({ token, user });
    });
});

app.post('/api/auth/register', async (req, res) => {
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existing) => {
        if (existing) return res.status(400).json({ error: 'Email already in use' });

        const id = "user_" + crypto.randomUUID();
        const displayName = `${firstName} ${lastName}`;
        const role = 'donor';
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (id, displayName, email, password, photoURL, role, reputation, upiId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, displayName, email, hashedPassword, `https://ui-avatars.com/api/?name=${firstName}+${lastName}`, role, 0, ''],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
                    if (err) return res.status(500).json({ error: err.message });
                    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
                    delete user.password;
                    res.json({ token, user });
                });
            }
        );
    });
});

// Middleware to verify JWT token dynamically mapped
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Requests API
app.get('/api/requests', (req, res) => {
    db.all('SELECT * FROM requests ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Fetch needed items for each request
        db.all('SELECT * FROM neededItems', [], (err2, items) => {
            if (err2) return res.status(500).json({ error: err2.message });

            const resData = rows.map(r => {
                return {
                    ...r,
                    location: { lat: r.lat, lng: r.lng, address: r.address },
                    proofUrls: JSON.parse(r.proofUrls || '[]'),
                    neededItems: items.filter(i => i.requestId === r.id)
                }
            });
            res.json(resData);
        });
    });
});

app.post('/api/requests', authenticateToken, (req, res) => {
    const { requesterName, title, description, category, targetAmount, raisedAmount, urgency, location, proofUrls, neededItems } = req.body;
    const id = "req_" + crypto.randomUUID();
    const requesterId = req.user.id;

    db.run(
        `INSERT INTO requests(id, requesterId, requesterName, title, description, category, targetAmount, raisedAmount, urgency, status, lat, lng, address, proofUrls, createdAt)
         VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?)`,
        [id, requesterId, requesterName, title, description, category, targetAmount, raisedAmount || 0, urgency, location.lat, location.lng, location.address, JSON.stringify(proofUrls), Date.now()],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            if (neededItems && neededItems.length > 0) {
                const stmt = db.prepare(`INSERT INTO neededItems(requestId, name, total, fulfilled) VALUES(?, ?, ?, ?)`);
                neededItems.forEach(i => stmt.run(id, i.name, i.total, i.fulfilled || 0));
                stmt.finalize();
            }
            res.json({ id });
        }
    );
});

// Donations 
app.post('/api/donations', authenticateToken, (req, res) => {
    const { requestId, donorName, amount, transactionId } = req.body;
    const id = "don_" + crypto.randomUUID();
    const donorId = req.user.id;

    db.run('UPDATE requests SET raisedAmount = raisedAmount + ? WHERE id = ?', [amount, requestId], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        db.run(`INSERT INTO donations(id, requestId, donorId, donorName, amount, transactionId, timestamp) VALUES(?, ?, ?, ?, ?, ?, ?)`,
            [id, requestId, donorId, donorName, amount, transactionId, Date.now()], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id });
            });
    });
});

// Vendors
app.get('/api/vendors', (req, res) => {
    db.all('SELECT * FROM vendors', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const resData = rows.map(r => ({ ...r, items: JSON.parse(r.items) }));
        res.json(resData);
    });
});

// Fulfill Needs API
app.post('/api/fulfill', authenticateToken, (req, res) => {
    const { requestId, itemName, amount } = req.body;
    db.run(`UPDATE neededItems SET fulfilled = fulfilled + ? WHERE requestId = ? AND name = ? `, [amount, requestId, itemName], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

const PORT = 3001;
initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
