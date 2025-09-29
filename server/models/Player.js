const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  game_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  player_code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 8,
    maxlength: 8
  },
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  is_winner: {
    type: Boolean,
    default: false
  },
  is_admin_created: {
    type: Boolean,
    default: false
  },
  is_invited: {
    type: Boolean,
    default: false
  },
  invited_at: {
    type: Date
  },
  last_activity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
playerSchema.index({ game_id: 1 });
playerSchema.index({ is_winner: 1 });
playerSchema.index({ player_code: 1 });
playerSchema.index({ username: 1 });
playerSchema.index({ is_admin_created: 1 });
playerSchema.index({ is_invited: 1 });

module.exports = mongoose.model('Player', playerSchema);
