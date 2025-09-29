const mongoose = require('mongoose');

const prizeSchema = new mongoose.Schema({
  game_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'word', 'nft'],
    required: true
  },
  content: {
    type: String,
    required: true // JSON string for prize data
  },
  position: {
    type: Number,
    required: true,
    min: 0
  },
  is_revealed: {
    type: Boolean,
    default: false
  },
  revealed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  revealed_at: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
prizeSchema.index({ game_id: 1 });
prizeSchema.index({ position: 1 });

module.exports = mongoose.model('Prize', prizeSchema);



