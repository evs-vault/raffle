const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  game_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  player_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  socket_id: {
    type: String,
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_ping: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
gameSessionSchema.index({ game_id: 1 });
gameSessionSchema.index({ socket_id: 1 });
gameSessionSchema.index({ is_active: 1 });

module.exports = mongoose.model('GameSession', gameSessionSchema);



