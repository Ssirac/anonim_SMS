require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
app.use(express.json());

// --- Firebase initialize ---
let serviceAccount;
if (process.env.FIREBASE_KEY_BASE64) {
  serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_KEY_BASE64, 'base64').toString('utf8')
  );
} else if (process.env.FIREBASE_KEY_PATH) {
  serviceAccount = require(process.env.FIREBASE_KEY_PATH);
} else {
  throw new Error('Firebase açarı tapılmadı (.env-də qeyd et)');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// --- Statik frontend göstərmək ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Mesajları gətir ---
app.get('/api/posts', async (req, res) => {
  try {
    const snapshot = await db.collection('posts').orderBy('ts', 'desc').get();
    const posts = snapshot.docs.map(doc => doc.data());
    res.json(posts);
  } catch (err) {
    console.error('Xəta (GET /api/posts):', err);
    res.status(500).json({ error: 'Server xətası' });
  }
});

// --- Yeni mesaj əlavə et ---
app.post('/api/posts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text lazımdır' });

    const post = { text, ts: Date.now() };
    await db.collection('posts').add(post);
    res.status(201).json(post);
  } catch (err) {
    console.error('Xəta (POST /api/posts):', err);
    res.status(500).json({ error: 'Server xətası' });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server http://localhost:${PORT} üzərində işləyir`));
