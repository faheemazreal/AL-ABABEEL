import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'database.sqlite');
export const db = new sqlite3.Database(dbPath);

export const initDb = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create Users Table
            db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        displayName TEXT,
        email TEXT UNIQUE,
        password TEXT,
        photoURL TEXT,
        role TEXT,
        reputation INTEGER,
        upiId TEXT,
        lat REAL,
        lng REAL,
        address TEXT
      )`);

            // Create Requests Table
            db.run(`CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        requesterId TEXT,
        requesterName TEXT,
        title TEXT,
        description TEXT,
        category TEXT,
        targetAmount INTEGER,
        raisedAmount INTEGER,
        urgency TEXT,
        status TEXT,
        lat REAL,
        lng REAL,
        address TEXT,
        proofUrls TEXT,
        createdAt INTEGER
      )`);

            // Create NeededItems Table
            db.run(`CREATE TABLE IF NOT EXISTS neededItems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requestId TEXT,
        name TEXT,
        total INTEGER,
        fulfilled INTEGER,
        FOREIGN KEY (requestId) REFERENCES requests(id)
      )`);

            // Create Donations Table
            db.run(`CREATE TABLE IF NOT EXISTS donations (
        id TEXT PRIMARY KEY,
        requestId TEXT,
        donorId TEXT,
        donorName TEXT,
        amount INTEGER,
        transactionId TEXT,
        timestamp INTEGER
      )`);

            // Create Verifications Table
            db.run(`CREATE TABLE IF NOT EXISTS verifications (
        id TEXT PRIMARY KEY,
        requestId TEXT,
        verifierId TEXT,
        verifierName TEXT,
        photoUrl TEXT,
        lat REAL,
        lng REAL,
        timestamp INTEGER,
        status TEXT,
        notes TEXT
      )`);

            // Create Vendors Table
            db.run(`CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT,
        rating REAL,
        distance TEXT,
        items TEXT,
        upiId TEXT
      )`);

            // Seed Initial Data if empty
            db.get("SELECT count(*) as count FROM users", async (err, row) => {
                if (!err && row.count === 0) {
                    await seedData();
                }
                resolve();
            });
        });
    });
};

const seedData = async () => {
    const defaultPassword = await bcrypt.hash('password123', 10);

    // Seed generic users
    const users = [
        { id: 'user_1', displayName: 'Demo Donor', email: 'donor@example.com', role: 'donor', reputation: 150, upiId: 'donor@okaxis', password: defaultPassword },
        { id: 'user_2', displayName: 'Demo Requester', email: 'requester@example.com', role: 'requester', reputation: 45, upiId: 'requester@okicici', password: defaultPassword },
        { id: 'user_3', displayName: 'Demo Verifier', email: 'verifier@example.com', role: 'eyewitness', reputation: 85, upiId: '', password: defaultPassword }
    ];

    users.forEach(u => {
        db.run(`INSERT INTO users (id, displayName, email, password, photoURL, role, reputation, upiId) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [u.id, u.displayName, u.email, u.password, `https://ui-avatars.com/api/?name=${u.displayName.replace(' ', '+')}`, u.role, u.reputation, u.upiId]);
    });

    // Seed generic requests
    const reqs = [
        {
            id: 'req_1', requesterId: 'user_2', requesterName: 'Demo Requester', title: 'Emergency Food Support for Village',
            description: 'Local community affected by heavy rains. Urgent supplies needed for 50 families.',
            category: 'Food', targetAmount: 15000, raisedAmount: 4500, urgency: 'High', status: 'Verified',
            lat: 12.9716, lng: 77.5946, address: 'Central Area, City',
            proofUrls: JSON.stringify(['https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800']),
            createdAt: Date.now() - 172800000,
            items: [{ name: 'Meal Kits', total: 50, fulfilled: 12 }, { name: 'Water Cartons', total: 20, fulfilled: 5 }]
        }
    ];

    reqs.forEach(r => {
        db.run(`INSERT INTO requests (id, requesterId, requesterName, title, description, category, targetAmount, raisedAmount, urgency, status, lat, lng, address, proofUrls, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [r.id, r.requesterId, r.requesterName, r.title, r.description, r.category, r.targetAmount, r.raisedAmount, r.urgency, r.status, r.lat, r.lng, r.address, r.proofUrls, r.createdAt]);

        r.items.forEach(i => {
            db.run(`INSERT INTO neededItems (requestId, name, total, fulfilled) VALUES (?, ?, ?, ?)`, [r.id, i.name, i.total, i.fulfilled]);
        });
    });

    // Seed generic Vendors
    const vendors = [
        { id: 'vendor_1', name: 'Community Kitchen Co.', category: 'Food', rating: 4.8, distance: '1.2 km', items: JSON.stringify([{ name: 'Meal Kit (Family)', price: 250 }]), upiId: 'kitchen@okaxis' },
        { id: 'vendor_2', name: 'City Pharmacy', category: 'Medical', rating: 4.5, distance: '0.8 km', items: JSON.stringify([{ name: 'Medicine Kit', price: 1200 }]), upiId: 'pharmacy@okicici' },
        { id: 'vendor_3', name: 'Global Stationery Works', category: 'Education', rating: 4.2, distance: '2.5 km', items: JSON.stringify([{ name: 'School Kit', price: 500 }]), upiId: 'stationery@okaxis' }
    ];
    vendors.forEach(v => {
        db.run(`INSERT INTO vendors (id, name, category, rating, distance, items, upiId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [v.id, v.name, v.category, v.rating, v.distance, v.items, v.upiId]);
    });
};
