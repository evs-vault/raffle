const mongoose = require('mongoose');

const cardRevealSchema = new mongoose.Schema({
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
  card_id: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
cardRevealSchema.index({ game_id: 1 });
cardRevealSchema.index({ player_id: 1 });
cardRevealSchema.index({ card_id: 1 });

module.exports = mongoose.model('CardReveal', cardRevealSchema);



