const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const playerRoutes = require('./routes/players');
const { connectToPostgreSQL } = require('./database/postgresql');
const { setupDatabase } = require('./database/setup-postgresql');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));

// Rate limiting - temporarily disabled for development
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/players', playerRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-game', (data) => {
    const { gameId, playerId } = data;
    socket.join(`game-${gameId}`);
    console.log(`Player ${playerId} joined game ${gameId}`);
  });

  socket.on('reveal-card', (data) => {
    const { gameId, cardId, playerId } = data;
    // Broadcast card reveal to all players in the game
    socket.to(`game-${gameId}`).emit('card-revealed', {
      cardId,
      playerId,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
connectToPostgreSQL().then(async (connected) => {
  if (connected) {
    // Setup database tables
    await setupDatabase();
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('PostgreSQL connected successfully');
    });
  } else {
    console.error('Failed to connect to PostgreSQL. Server not started.');
    process.exit(1);
  }
}).catch(err => {
  console.error('Failed to setup database:', err);
  process.exit(1);
});

