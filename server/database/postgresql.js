const { Pool } = require('pg');

// PostgreSQL connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'raffle_memory',
  user: process.env.DB_USER || 'raffle_user',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
async function connectToPostgreSQL() {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    return false;
  }
}

// Close connection
async function disconnectFromPostgreSQL() {
  try {
    await pool.end();
    console.log('Disconnected from PostgreSQL');
  } catch (error) {
    console.error('PostgreSQL disconnection error:', error);
  }
}

module.exports = {
  pool,
  connectToPostgreSQL,
  disconnectFromPostgreSQL
};
