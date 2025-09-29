const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Game = require('../models/Game');
const Player = require('../models/Player');
const Prize = require('../models/Prize');
const CardReveal = require('../models/CardReveal');
const GameSession = require('../models/GameSession');
const { authenticateToken, validateGameAccess } = require('../middleware/auth');
const { shuffleArray, generatePlayerCode, generateUsername } = require('../utils/gameUtils');

const router = express.Router();

// Get all games for admin
router.get('/', authenticateToken, async (req, res) => {
  try {
    const adminId = req.admin.id;
    
    const games = await Game.aggregate([
      { $match: { admin_id: adminId } },
      {
        $lookup: {
          from: 'players',
          localField: '_id',
          foreignField: 'game_id',
          as: 'players'
        }
      },
      {
        $addFields: {
          player_count: { $size: '$players' },
          winner_count: {
            $size: {
              $filter: {
                input: '$players',
                cond: { $eq: ['$$this.is_winner', true] }
              }
            }
          }
        }
      },
      {
        $project: {
          players: 0 // Remove the players array from the response
        }
      },
      { $sort: { created_at: -1 } }
    ]);

    // Transform _id to id for frontend compatibility
    const transformedGames = games.map(game => ({
      ...game,
      id: game._id,
      created_at: game.createdAt,
      started_at: game.started_at,
      completed_at: game.completed_at
    }));

    res.json({ games: transformedGames });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single game details
router.get('/:gameId', authenticateToken, validateGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Get players for this game
    const players = await Player.find({ game_id: gameId });
    
    // Get prizes for this game
    const prizes = await Prize.find({ game_id: gameId });

    // Transform _id to id for frontend compatibility
    const transformedGame = {
      ...game.toObject(),
      id: game._id,
      created_at: game.createdAt,
      started_at: game.started_at,
      completed_at: game.completed_at,
      players: players.map(player => ({
        ...player.toObject(),
        id: player._id,
        joined_at: player.createdAt,
        last_activity: player.last_activity || player.updatedAt
      })),
      prizes: prizes.map(prize => ({
        ...prize.toObject(),
        id: prize._id,
        content: JSON.parse(prize.content)
      }))
    };

    res.json({
      game: transformedGame
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new game
router.post('/', authenticateToken, [
  body('name').trim().notEmpty().withMessage('Game name is required'),
  body('description').optional().trim(),
  body('grid_size').isInt({ min: 2, max: 10 }).withMessage('Grid size must be between 2 and 10'),
  body('max_players').isInt({ min: 2, max: 50 }).withMessage('Max players must be between 2 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, grid_size, max_players, prizes } = req.body;
    const adminId = req.admin.id;

    const game = new Game({
      admin_id: adminId,
      name,
      description,
      grid_size,
      max_players
    });

    await game.save();

    // Create prizes if provided
    if (prizes && prizes.length > 0) {
      const Prize = require('../models/Prize');
      const prizePromises = prizes.map((prize, index) => {
        return new Prize({
          game_id: game._id,
          type: prize.type,
          content: JSON.stringify(prize.content),
          position: index
        }).save();
      });
      await Promise.all(prizePromises);
    }

    // Transform _id to id for frontend compatibility
    const transformedGame = {
      ...game.toObject(),
      id: game._id,
      created_at: game.createdAt,
      started_at: game.started_at,
      completed_at: game.completed_at
    };

    res.status(201).json({
      message: 'Game created successfully',
      game: transformedGame
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start game
router.put('/:gameId/start', authenticateToken, validateGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game is not in waiting status' });
    }

    // Check if prizes already exist for this game
    const existingPrizes = await Prize.find({ game_id: gameId });
    
    if (existingPrizes.length === 0) {
      // Generate only ONE winning prize for the game
      const totalCards = game.grid_size * game.grid_size;
      const winningPosition = Math.floor(Math.random() * totalCards);
      
      const prize = {
        game_id: gameId,
        type: 'word',
        content: JSON.stringify({ 
          word: 'Grand Prize', 
          value: Math.floor(Math.random() * 1000) + 500 
        }),
        position: winningPosition
      };

      await Prize.create(prize);
    }

    // Get all players for this game
    const players = await Player.find({ game_id: gameId }).sort({ created_at: 1 });
    
    // Initialize turn order and game state
    game.status = 'active';
    game.started_at = new Date();
    game.turn_order = players.map(p => p._id);
    game.current_player_index = 0;
    game.current_turn = 1;
    game.round = 1;
    await game.save();

    res.json({
      message: 'Game started successfully',
      game: {
        ...game.toObject(),
        game_code: game.game_code
      }
    });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// End game
router.put('/:gameId/end', authenticateToken, validateGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'active') {
      return res.status(400).json({ error: 'Game is not active' });
    }

    game.status = 'completed';
    game.completed_at = new Date();
    await game.save();

    res.json({
      message: 'Game ended successfully',
      game: {
        ...game.toObject(),
        game_code: game.game_code
      }
    });
  } catch (error) {
    console.error('End game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete game
router.delete('/:gameId', authenticateToken, validateGameAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Convert to ObjectId
    const objectId = new mongoose.Types.ObjectId(gameId);
    
    const game = await Game.findById(objectId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status === 'active') {
      return res.status(400).json({ error: 'Cannot delete active game' });
    }

    console.log(`Deleting game ${gameId} and related data...`);
    
    // Delete related data in the correct order
    const cardRevealsResult = await CardReveal.deleteMany({ game_id: objectId });
    console.log(`Deleted ${cardRevealsResult.deletedCount} card reveals`);
    
    const gameSessionsResult = await GameSession.deleteMany({ game_id: objectId });
    console.log(`Deleted ${gameSessionsResult.deletedCount} game sessions`);
    
    const playersResult = await Player.deleteMany({ game_id: objectId });
    console.log(`Deleted ${playersResult.deletedCount} players`);
    
    const prizesResult = await Prize.deleteMany({ game_id: objectId });
    console.log(`Deleted ${prizesResult.deletedCount} prizes`);
    
    const gameResult = await Game.findByIdAndDelete(objectId);
    console.log(`Deleted game: ${gameResult ? 'success' : 'failed'}`);

    res.json({ 
      message: 'Game deleted successfully',
      gameId: gameId,
      deletedCounts: {
        cardReveals: cardRevealsResult.deletedCount,
        gameSessions: gameSessionsResult.deletedCount,
        players: playersResult.deletedCount,
        prizes: prizesResult.deletedCount
      }
    });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk delete games
router.delete('/bulk', authenticateToken, [
  body('gameIds').isArray().withMessage('Game IDs must be an array'),
  body('gameIds.*').isMongoId().withMessage('Invalid game ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameIds } = req.body;
    const adminId = req.admin.id;

    // Verify all games belong to the admin and are not active
    const games = await Game.find({
      _id: { $in: gameIds },
      admin_id: adminId
    });

    if (games.length !== gameIds.length) {
      return res.status(400).json({ error: 'Some games not found or not owned by admin' });
    }

    const activeGames = games.filter(game => game.status === 'active');
    if (activeGames.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete active games',
        activeGameIds: activeGames.map(g => g._id)
      });
    }

    console.log(`Bulk deleting ${gameIds.length} games...`);
    
    const cardRevealsResult = await CardReveal.deleteMany({ 
      game_id: { $in: gameIds } 
    });
    
    const gameSessionsResult = await GameSession.deleteMany({ 
      game_id: { $in: gameIds } 
    });
    
    const playersResult = await Player.deleteMany({ 
      game_id: { $in: gameIds } 
    });
    
    const prizesResult = await Prize.deleteMany({ 
      game_id: { $in: gameIds } 
    });
    
    const gamesResult = await Game.deleteMany({ 
      _id: { $in: gameIds } 
    });

    res.json({ 
      message: `Successfully deleted ${gamesResult.deletedCount} games`,
      deletedCounts: {
        cardReveals: cardRevealsResult.deletedCount,
        gameSessions: gameSessionsResult.deletedCount,
        players: playersResult.deletedCount,
        prizes: prizesResult.deletedCount,
        games: gamesResult.deletedCount
      }
    });
  } catch (error) {
    console.error('Bulk delete games error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create player for game (admin only)
router.post('/:gameId/players', authenticateToken, validateGameAccess, [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('name').optional().trim()
], async (req, res) => {
  try {
    console.log('Create player request:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameId } = req.params;
    const { username, email, phone, name } = req.body;
    console.log('Creating player for game:', gameId, 'with username:', username);

    // Check if game exists and is in waiting status
    const game = await Game.findById(gameId);
    console.log('Found game:', game);
    if (!game) {
      console.log('Game not found for ID:', gameId);
      return res.status(404).json({ error: 'Game not found' });
    }

    console.log('Game status:', game.status);
    if (game.status !== 'waiting') {
      console.log('Game is not in waiting status, current status:', game.status);
      return res.status(400).json({ error: 'Game is not accepting new players' });
    }

    // Check if max players reached
    const currentPlayerCount = await Player.countDocuments({ game_id: gameId });
    if (currentPlayerCount >= game.max_players) {
      return res.status(400).json({ error: 'Game is full' });
    }

    // Check if username already exists globally
    const existingUsername = await Player.findOne({ username: username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Generate player name from username
    const playerName = name || `Player_${username}`;

    // Generate unique player code
    let playerCode;
    let isCodeUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isCodeUnique && attempts < maxAttempts) {
      playerCode = generatePlayerCode();
      const existingCode = await Player.findOne({ player_code: playerCode });
      if (!existingCode) {
        isCodeUnique = true;
      }
      attempts++;
    }

    if (!isCodeUnique) {
      return res.status(500).json({ error: 'Failed to generate unique player code' });
    }

    // Create player
    const player = new Player({
      game_id: gameId,
      player_code: playerCode,
      username: username,
      name: playerName,
      email: email || null,
      phone: phone || null,
      is_admin_created: true,
      is_invited: false
    });

    await player.save();

    // Update player count
    game.player_count = currentPlayerCount + 1;
    await game.save();

    res.status(201).json({
      message: 'Player created successfully',
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
    console.error('Create player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update player for game (admin only)
router.put('/:gameId/players/:playerId', authenticateToken, validateGameAccess, [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('name').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameId, playerId } = req.params;
    const { username, email, phone, name } = req.body;

    // Check if player exists and belongs to this game
    const player = await Player.findOne({ _id: playerId, game_id: gameId });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if username already exists (excluding current player)
    const existingUsername = await Player.findOne({ 
      username: username, 
      _id: { $ne: playerId } 
    });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Update player
    player.username = username;
    if (email !== undefined) player.email = email;
    if (phone !== undefined) player.phone = phone;
    if (name !== undefined) player.name = name;
    
    await player.save();

    res.json({
      message: 'Player updated successfully',
      player: {
        id: player._id,
        player_code: player.player_code,
        username: player.username,
        name: player.name,
        email: player.email,
        phone: player.phone
      }
    });
  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete player from game (admin only)
router.delete('/:gameId/players/:playerId', authenticateToken, validateGameAccess, async (req, res) => {
  try {
    const { gameId, playerId } = req.params;
    console.log('Delete player request - gameId:', gameId, 'playerId:', playerId);

    // Check if player exists and belongs to this game
    const player = await Player.findOne({ _id: playerId, game_id: gameId });
    console.log('Found player to delete:', player);
    
    if (!player) {
      console.log('Player not found for deletion');
      return res.status(404).json({ error: 'Player not found' });
    }

    // Delete player
    const deleteResult = await Player.findByIdAndDelete(playerId);
    console.log('Player deletion result:', deleteResult);

    // Update game's player count
    const game = await Game.findById(gameId);
    if (game) {
      const newCount = Math.max(0, game.player_count - 1);
      game.player_count = newCount;
      await game.save();
      console.log('Updated game player count to:', newCount);
    }

    res.json({
      message: 'Player deleted successfully',
      playerId: playerId
    });
  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite player (admin only) - marks player as invited for offline assignment
router.post('/:gameId/players/:playerId/invite', authenticateToken, validateGameAccess, async (req, res) => {
  try {
    const { gameId, playerId } = req.params;
    
    const player = await Player.findOne({
      _id: playerId,
      game_id: gameId
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (!player.is_admin_created) {
      return res.status(400).json({ error: 'Only admin-created players can be invited' });
    }

    if (player.is_invited) {
      return res.status(400).json({ error: 'Player has already been invited' });
    }

    // Mark player as invited
    player.is_invited = true;
    player.invited_at = new Date();
    await player.save();

    res.json({
      message: 'Player invited successfully',
      player: {
        id: player._id,
        player_code: player.player_code,
        username: player.username,
        name: player.name,
        is_invited: player.is_invited,
        invited_at: player.invited_at
      }
    });
  } catch (error) {
    console.error('Invite player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign username to invited player (public endpoint for offline assignment)
router.post('/:gameId/players/:playerId/assign-username', [
  body('username').trim().notEmpty().withMessage('Username is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameId, playerId } = req.params;
    const { username } = req.body;
    
    const player = await Player.findOne({
      _id: playerId,
      game_id: gameId
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (!player.is_invited) {
      return res.status(400).json({ error: 'Player has not been invited yet' });
    }

    // Check if username is already taken
    const existingUsername = await Player.findOne({ 
      username: username,
      _id: { $ne: playerId }
    });
    
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Update player username
    player.username = username;
    await player.save();

    res.json({
      message: 'Username assigned successfully',
      player: {
        id: player._id,
        player_code: player.player_code,
        username: player.username,
        name: player.name,
        is_invited: player.is_invited
      }
    });
  } catch (error) {
    console.error('Assign username error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;