const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true
  },
  grid_size: {
    type: Number,
    required: true,
    min: 2,
    max: 10
  },
  max_players: {
    type: Number,
    required: true,
    default: 2,
    min: 2,
    max: 50
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'cancelled'],
    default: 'waiting'
  },
  started_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  player_count: {
    type: Number,
    default: 0
  },
  winner_count: {
    type: Number,
    default: 0
  },
  game_code: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 6,
    maxlength: 6
  },
  current_turn: {
    type: Number,
    default: 0
  },
  turn_order: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  current_player_index: {
    type: Number,
    default: 0
  },
  round: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Generate game code before saving
gameSchema.pre('save', function(next) {
  if (!this.game_code) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.game_code = result;
  }
  next();
});

// Ensure virtual fields are serialized
gameSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Game', gameSchema);
