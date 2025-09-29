const express = require('express');
const { pool } = require('../database/postgresql');

const router = express.Router();

// Join game
router.post('/join', async (req, res) => {
  try {
    const { game_code } = req.body;
    
    // Find game by code
    const gameResult = await pool.query(
      'SELECT * FROM games WHERE game_code = $1',
      [game_code]
    );
    
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const game = gameResult.rows[0];
    
    // Check if game is full
    const playerCountResult = await pool.query(
      'SELECT COUNT(*) FROM players WHERE game_id = $1',
      [game.id]
    );
    
    const playerCount = parseInt(playerCountResult.rows[0].count);
    if (playerCount >= game.max_players) {
      return res.status(400).json({ error: 'Game is full' });
    }
    
    // Create player
    const player_code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const playerResult = await pool.query(`
      INSERT INTO players (game_id, player_code, name, username)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [game.id, player_code, `Player ${playerCount + 1}`, `player${playerCount + 1}`]);
    
    const player = playerResult.rows[0];
    
    res.json({
      game: {
        id: game.id,
        name: game.name,
        description: game.description,
        grid_size: game.grid_size,
        max_players: game.max_players,
        player_count: playerCount + 1,
        status: game.status
      },
      player: {
        id: player.id,
        player_code: player.player_code,
        username: player.username,
        name: player.name
      }
    });
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get players for a game
router.get('/:gameId/players', async (req, res) => {
  try {
    const { gameId } = req.params;
    const result = await pool.query(
      'SELECT * FROM players WHERE game_id = $1 ORDER BY created_at',
      [gameId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
