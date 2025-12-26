const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('People Platform API is running');
});

// Placeholder routes
app.get('/api/auth/me', (req, res) => {
    // Mock user
    res.json({ id: 1, name: 'Test User', role: 'initiator' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
