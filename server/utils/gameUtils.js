// Fisher-Yates shuffle algorithm for secure card shuffling
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate unique player code (8 characters)
function generatePlayerCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate unique username
function generateUsername() {
  const adjectives = ['Cool', 'Swift', 'Bright', 'Bold', 'Sharp', 'Quick', 'Smart', 'Wild', 'Brave', 'Lucky'];
  const nouns = ['Player', 'Gamer', 'Champion', 'Hero', 'Warrior', 'Master', 'Legend', 'Star', 'Ace', 'Pro'];
  const numbers = Math.floor(Math.random() * 9999) + 1;
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${numbers}`;
}

// Generate card positions for a grid
function generateCardPositions(gridSize) {
  const positions = [];
  for (let i = 0; i < gridSize * gridSize; i++) {
    positions.push(i);
  }
  return positions;
}

// Shuffle cards for a specific game
function shuffleGameCards(prizes, gridSize) {
  const totalCards = gridSize * gridSize;
  const prizeCount = prizes.length;
  
  // Create array of all card positions
  const cardPositions = generateCardPositions(gridSize);
  
  // Shuffle the positions
  const shuffledPositions = shuffleArray(cardPositions);
  
  // Create cards array with prizes and empty slots
  const cards = [];
  for (let i = 0; i < totalCards; i++) {
    if (i < prizeCount) {
      cards.push({
        id: i,
        position: shuffledPositions[i],
        prize: prizes[i],
        isRevealed: false
      });
    } else {
      cards.push({
        id: i,
        position: shuffledPositions[i],
        prize: null,
        isRevealed: false
      });
    }
  }
  
  return cards;
}

// Validate game state
function validateGameState(game, players, prizes) {
  const errors = [];
  
  if (!game) {
    errors.push('Game not found');
    return errors;
  }
  
  if (game.status === 'waiting' && players.length < 2) {
    errors.push('At least 2 players required to start game');
  }
  
  if (players.length > game.max_players) {
    errors.push('Too many players for this game');
  }
  
  if (prizes.length > game.grid_size * game.grid_size) {
    errors.push('Too many prizes for grid size');
  }
  
  return errors;
}

// Check if game can be started
function canStartGame(game, playerCount) {
  return game.status === 'waiting' && playerCount >= 2 && playerCount <= game.max_players;
}

// Check if game is active
function isGameActive(game) {
  return game.status === 'active';
}

// Check if game is completed
function isGameCompleted(game) {
  return game.status === 'completed';
}

// Generate game statistics
function generateGameStats(game, players, prizes, reveals) {
  const totalCards = game.grid_size * game.grid_size;
  const revealedCards = reveals.length;
  const revealedPrizes = prizes.filter(prize => prize.is_revealed).length;
  const totalPrizes = prizes.length;
  
  return {
    totalCards,
    revealedCards,
    revealedPrizes,
    totalPrizes,
    remainingCards: totalCards - revealedCards,
    remainingPrizes: totalPrizes - revealedPrizes,
    playerCount: players.length,
    gameProgress: totalCards > 0 ? (revealedCards / totalCards) * 100 : 0
  };
}

// Check for winning condition
function checkWinningCondition(game, prizes, reveals) {
  const revealedPrizes = prizes.filter(prize => prize.is_revealed);
  const totalPrizes = prizes.length;
  
  // Game is won when all prizes are revealed
  return revealedPrizes.length === totalPrizes;
}

// Get player activity summary
function getPlayerActivity(players, reveals) {
  return players.map(player => {
    const playerReveals = reveals.filter(reveal => reveal.player_id === player.id);
    return {
      ...player,
      revealCount: playerReveals.length,
      lastActivity: playerReveals.length > 0 
        ? Math.max(...playerReveals.map(r => new Date(r.revealed_at).getTime()))
        : new Date(player.joined_at).getTime()
    };
  });
}

module.exports = {
  shuffleArray,
  generatePlayerCode,
  generateUsername,
  generateCardPositions,
  shuffleGameCards,
  validateGameState,
  canStartGame,
  isGameActive,
  isGameCompleted,
  generateGameStats,
  checkWinningCondition,
  getPlayerActivity
};

