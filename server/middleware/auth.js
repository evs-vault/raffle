const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Game = require('../models/Game');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret-key');
    
    // Verify admin still exists
    const admin = await Admin.findById(decoded.adminId).select('_id username email');

    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.admin = {
      id: admin._id,
      username: admin.username,
      email: admin.email
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const validateGameAccess = async (req, res, next) => {
  const { gameId } = req.params;
  const adminId = req.admin.id;

  try {
    // Convert to ObjectId
    const mongoose = require('mongoose');
    const objectId = new mongoose.Types.ObjectId(gameId);
    
    const game = await Game.findOne({
      _id: objectId,
      admin_id: adminId
    });

    if (!game) {
      return res.status(403).json({ error: 'Access denied to this game' });
    }

    next();
  } catch (error) {
    console.error('ValidateGameAccess error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
};

module.exports = { authenticateToken, validateGameAccess };

