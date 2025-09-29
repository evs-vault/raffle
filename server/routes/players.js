const express = require('express');
const { body, validationResult } = require('express-validator');
const Game = require('../models/Game');
const Player = require('../models/Player');
const Prize = require('../models/Prize');
const CardReveal = require('../models/CardReveal');
const { authenticateToken, validateGameAccess } = require('../middleware/auth');
const { generatePlayerCode, generateUsername } = require('../utils/gameUtils');

const router = express.Router();

// Get all players (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const players = await Player.find()
      .populate('game_id', 'name game_code status')
      .sort({ created_at: -1 });
    
    res.json({ players });
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug endpoint to check player codes
router.get('/debug-codes', async (req, res) => {
  try {
    const players = await Player.find({}, 'player_code username name game_id');
    console.log('All player codes:', players);
    res.json({ 
      message: 'Player codes debug',
      players: players,
      count: players.length
    });
  } catch (error) {
    console.error('Debug codes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Player join using game code (public endpoint)
router.post('/join', [
  body('game_code').trim().notEmpty().withMessage('Game code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { game_code } = req.body;
    console.log('Player join request - game_code:', game_code);

    // Find game by player code (look up the player first, then get their game)
    const existingPlayer = await Player.findOne({ 
      player_code: game_code.toUpperCase() 
    });
    console.log('Found player by code:', existingPlayer);

    if (!existingPlayer) {
      console.log('Player not found for code:', game_code.toUpperCase());
      // Let's also check what player codes exist
      const allPlayers = await Player.find({}, 'player_code game_id');
      console.log('Available player codes:', allPlayers);
      return res.status(404).json({ error: 'Invalid player code' });
    }

    // Get the game from the player
    const game = await Game.findById(existingPlayer.game_id);
    console.log('Found game from player:', game);

    if (!game) {
      return res.status(404).json({ error: 'Game not found for this player' });
    }

    // Check if game is still active
    if (game.status === 'completed' || game.status === 'cancelled') {
      return res.status(400).json({ error: 'Game is no longer active' });
    }

    // Player already exists, just return their info
    const player = existingPlayer;

    // Get current player count
    const currentPlayerCount = await Player.countDocuments({ game_id: game._id });

    res.json({
      message: 'Successfully joined the game',
      player: {
        id: player._id,
        player_code: player.player_code,
        username: player.username,
        name: player.name
      },
      game: {
        id: game._id,
        name: game.name,
        description: game.description,
        grid_size: game.grid_size,
        max_players: game.max_players,
        player_count: currentPlayerCount,
        status: game.status
      }
    });
  } catch (error) {
    console.error('Player join error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add player to game (legacy endpoint - use games/:gameId/players instead)
router.post('/:gameId/players', authenticateToken, validateGameAccess, [
  body('name').trim().notEmpty().withMessage('Player name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('username').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameId } = req.params;
    const { name, email, phone, username } = req.body;

    // Check if game exists and is in waiting status
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game is not accepting new players' });
    }

    // Check if max players reached
    const currentPlayerCount = await Player.countDocuments({ game_id: gameId });
    if (currentPlayerCount >= game.max_players) {
      return res.status(400).json({ error: 'Game is full' });
    }

    // Check if player name already exists in this game
    const existingPlayer = await Player.findOne({
      game_id: gameId,
      name: name
    });

    if (existingPlayer) {
      return res.status(400).json({ error: 'Player name already exists in this game' });
    }

    // Generate unique username if not provided
    let finalUsername = username;
    if (!finalUsername) {
      let isUsernameUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUsernameUnique && attempts < maxAttempts) {
        finalUsername = generateUsername();
        const existingUsername = await Player.findOne({ username: finalUsername });
        if (!existingUsername) {
          isUsernameUnique = true;
        }
        attempts++;
      }

      if (!isUsernameUnique) {
        return res.status(500).json({ error: 'Failed to generate unique username' });
      }
    } else {
      // Check if provided username is unique
      const existingUsername = await Player.findOne({ username: finalUsername });
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    // Generate unique player code
    let playerCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      playerCode = generatePlayerCode();
      const existingCode = await Player.findOne({ player_code: playerCode });
      if (!existingCode) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique player code' });
    }

    // Create player
    const player = new Player({
      game_id: gameId,
      player_code: playerCode,
      username: finalUsername,
      name,
      email,
      phone,
      is_admin_created: true,
      is_invited: false
    });

    await player.save();

    // Update player count
    game.player_count = currentPlayerCount + 1;
    await game.save();

    res.status(201).json({
      message: 'Player added successfully',
      player: {
        id: player._id,
        player_code: player.player_code,
        username: player.username,
        name: player.name,
        email: player.email,
        phone: player.phone,
        is_admin_created: player.is_admin_created,
        is_invited: player.is_invited
      }
    });
  } catch (error) {
    console.error('Add player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get players for a game
router.get('/:gameId/players', authenticateToken, validateGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const players = await Player.find({ game_id: gameId }).sort({ created_at: 1 });
    
    res.json({ players });
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove player from game
router.delete('/:gameId/players/:playerId', authenticateToken, validateGameAccess, async (req, res) => {
  try {
    const { gameId, playerId } = req.params;
    
    const player = await Player.findOne({
      _id: playerId,
      game_id: gameId
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    await Player.findByIdAndDelete(playerId);

    // Update player count
    const game = await Game.findById(gameId);
    if (game) {
      game.player_count = Math.max(0, game.player_count - 1);
      await game.save();
    }

    res.json({ message: 'Player removed successfully' });
  } catch (error) {
    console.error('Remove player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join game (public endpoint for players) - Alternative endpoint
router.post('/join-game', [
  body('game_code').trim().notEmpty().withMessage('Game code is required'),
  body('name').trim().notEmpty().withMessage('Player name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('username').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { game_code, name, email, phone, username } = req.body;

    // Find game by code (using the last 6 characters of the ID)
    const game = await Game.findOne({
      $expr: {
        $eq: [
          { $substr: [{ $toString: '$_id' }, -6, 6] },
          game_code.toUpperCase()
        ]
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game is not accepting new players' });
    }

    // Check if max players reached
    const currentPlayerCount = await Player.countDocuments({ game_id: game._id });
    if (currentPlayerCount >= game.max_players) {
      return res.status(400).json({ error: 'Game is full' });
    }

    // Check if player name already exists in this game
    const existingPlayer = await Player.findOne({
      game_id: game._id,
      name: name
    });

    if (existingPlayer) {
      return res.status(400).json({ error: 'Player name already exists in this game' });
    }

    // Generate unique username if not provided
    let finalUsername = username;
    if (!finalUsername) {
      let isUsernameUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUsernameUnique && attempts < maxAttempts) {
        finalUsername = generateUsername();
        const existingUsername = await Player.findOne({ username: finalUsername });
        if (!existingUsername) {
          isUsernameUnique = true;
        }
        attempts++;
      }

      if (!isUsernameUnique) {
        return res.status(500).json({ error: 'Failed to generate unique username' });
      }
    } else {
      // Check if provided username is unique
      const existingUsername = await Player.findOne({ username: finalUsername });
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    // Generate unique player code
    let playerCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      playerCode = generatePlayerCode();
      const existingCode = await Player.findOne({ player_code: playerCode });
      if (!existingCode) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique player code' });
    }

    // Create player
    const player = new Player({
      game_id: game._id,
      player_code: playerCode,
      username: finalUsername,
      name,
      email,
      phone,
      is_admin_created: false,
      is_invited: false
    });

    await player.save();

    // Update player count
    game.player_count = currentPlayerCount + 1;
    await game.save();

    res.status(201).json({
      message: 'Successfully joined game',
      player: {
        id: player._id,
        player_code: player.player_code,
        username: player.username,
        name: player.name,
        email: player.email,
        phone: player.phone
      },
      game: {
        id: game._id,
        name: game.name,
        description: game.description,
        grid_size: game.grid_size,
        max_players: game.max_players,
        player_count: game.player_count
      }
    });
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reveal card (public endpoint for players)
router.post('/reveal-card', [
  body('game_id').notEmpty().withMessage('Game ID is required'),
  body('player_id').notEmpty().withMessage('Player ID is required'),
  body('card_id').isInt({ min: 0 }).withMessage('Card ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { game_id, player_id, card_id } = req.body;

    // Verify game exists and is active
    const game = await Game.findById(game_id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'active') {
      return res.status(400).json({ error: 'Game is not active' });
    }

    // Verify player exists and is in this game
    const player = await Player.findOne({
      _id: player_id,
      game_id: game_id
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found in this game' });
    }

    // Check if it's this player's turn
    const currentPlayerId = game.turn_order[game.current_player_index];
    if (currentPlayerId.toString() !== player_id) {
      return res.status(400).json({ 
        error: 'Not your turn', 
        current_player: currentPlayerId,
        turn_order: game.turn_order,
        current_index: game.current_player_index
      });
    }

    // Check if card has already been revealed
    const existingReveal = await CardReveal.findOne({
      game_id: game_id,
      card_id: card_id
    });

    if (existingReveal) {
      return res.status(400).json({ error: 'Card has already been revealed' });
    }

    // Record the card reveal
    const cardReveal = new CardReveal({
      game_id: game_id,
      player_id: player_id,
      card_id: card_id
    });

    await cardReveal.save();

    // Get the prize for this card position
    const prize = await Prize.findOne({
      game_id: game_id,
      position: card_id
    });

    let isWinner = false;
    if (prize) {
      // Mark prize as revealed
      prize.is_revealed = true;
      prize.revealed_by = player_id;
      prize.revealed_at = new Date();
      await prize.save();

      // Player found the winning card!
      player.is_winner = true;
      isWinner = true;
      await player.save();

      // End the game immediately - someone won!
      game.status = 'completed';
      game.completed_at = new Date();
      await game.save();

      // Update winner count
      game.winner_count = await Player.countDocuments({
        game_id: game_id,
        is_winner: true
      });
    }

    // Move to next player's turn
    game.current_player_index = (game.current_player_index + 1) % game.turn_order.length;
    
    // If we've completed a full round (all players have had a turn)
    if (game.current_player_index === 0) {
      game.round += 1;
    }
    
    game.current_turn += 1;
    await game.save();

    // Get next player info
    const nextPlayerId = game.turn_order[game.current_player_index];
    const nextPlayer = await Player.findById(nextPlayerId);

    res.json({
      message: 'Card revealed successfully',
      prize: prize ? {
        id: prize._id,
        type: prize.type,
        content: prize.content,
        position: prize.position,
        is_revealed: prize.is_revealed
      } : null,
      player: {
        id: player._id,
        name: player.name,
        is_winner: player.is_winner
      },
      game_state: {
        current_turn: game.current_turn,
        round: game.round,
        current_player_index: game.current_player_index,
        next_player: nextPlayer ? {
          id: nextPlayer._id,
          name: nextPlayer.name,
          username: nextPlayer.username
        } : null,
        turn_order: game.turn_order
      }
    });
  } catch (error) {
    console.error('Reveal card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game state (public endpoint for players)
router.get('/game-state/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Get game with populated turn order
    const game = await Game.findById(gameId).populate('turn_order', 'name username');
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Get all prizes for this game
    const prizes = await Prize.find({ game_id: gameId }).sort({ position: 1 });
    
    // Get all reveals for this game
    const reveals = await CardReveal.find({ game_id: gameId }).populate('player_id', 'name username');

    // Get all players
    const players = await Player.find({ game_id: gameId });

    res.json({
      game: {
        id: game._id,
        name: game.name,
        description: game.description,
        grid_size: game.grid_size,
        status: game.status,
        current_turn: game.current_turn,
        round: game.round,
        current_player_index: game.current_player_index,
        turn_order: game.turn_order,
        started_at: game.started_at
      },
      prizes: prizes.map(prize => ({
        id: prize._id,
        type: prize.type,
        content: prize.content,
        position: prize.position,
        is_revealed: prize.is_revealed,
        revealed_by: prize.revealed_by,
        revealed_at: prize.revealed_at
      })),
      reveals: reveals.map(reveal => ({
        id: reveal._id,
        card_id: reveal.card_id,
        player: reveal.player_id,
        revealed_at: reveal.created_at
      })),
      players: players.map(player => ({
        id: player._id,
        name: player.name,
        username: player.username,
        is_winner: player.is_winner
      }))
    });
  } catch (error) {
    console.error('Get game state error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;