const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple test endpoints
app.get('/', (req, res) => {
  res.json({ 
    message: 'RazzWars API is running!',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Simple game endpoints
app.get('/api/games', (req, res) => {
  res.json({ games: [] });
});

app.post('/api/games', (req, res) => {
  res.json({ message: 'Game created', id: 'test123' });
});

// Simple player endpoints
app.post('/api/players/join', (req, res) => {
  res.json({ 
    message: 'Player joined successfully',
    game: { id: 'test123', name: 'Test Game', status: 'waiting' },
    player: { id: 'player123', name: 'Test Player' }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Simple server started successfully');
});
