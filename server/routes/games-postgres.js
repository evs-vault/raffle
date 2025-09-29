const express = require('express');
const { pool } = require('../database/postgresql');

const router = express.Router();

// Get all games
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, COUNT(p.id) as player_count 
      FROM games g 
      LEFT JOIN players p ON g.id = p.game_id 
      GROUP BY g.id 
      ORDER BY g.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM games WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new game
router.post('/', async (req, res) => {
  try {
    const { name, description, grid_size, max_players } = req.body;
    const game_code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const result = await pool.query(`
      INSERT INTO games (name, description, grid_size, max_players, game_code)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, description, grid_size || 4, max_players || 4, game_code]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update game
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, grid_size, max_players, status } = req.body;
    
    const result = await pool.query(`
      UPDATE games 
      SET name = $1, description = $2, grid_size = $3, max_players = $4, status = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [name, description, grid_size, max_players, status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete game
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM games WHERE id = $1', [id]);
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
