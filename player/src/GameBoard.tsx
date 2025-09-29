import React, { useState, useEffect } from 'react';

interface GameState {
  game: {
    id: string;
    name: string;
    description: string;
    grid_size: number;
    status: string;
    current_turn: number;
    round: number;
    current_player_index: number;
    turn_order: any[];
    started_at: string;
  };
  prizes: Array<{
    id: string;
    type: string;
    content: string;
    position: number;
    is_revealed: boolean;
    revealed_by?: string;
    revealed_at?: string;
  }>;
  reveals: Array<{
    id: string;
    card_id: number;
    player: any;
    revealed_at: string;
  }>;
  players: Array<{
    id: string;
    name: string;
    username: string;
    is_winner: boolean;
  }>;
}

interface GameBoardProps {
  gameId: string;
  playerId: string;
  onGameEnd?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameId, playerId, onGameEnd }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revealing, setRevealing] = useState<number | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [hasShuffled, setHasShuffled] = useState(false);

  const fetchGameState = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/players/game-state/${gameId}`);
      const data = await response.json();
      
      if (response.ok) {
        setGameState(data);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch game state');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Fetch game state error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameState();
    
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchGameState, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  // Shuffle animation effect
  useEffect(() => {
    if (gameState && !hasShuffled) {
      console.log('Starting shuffle animation');
      setIsShuffling(true);
      setHasShuffled(true);
      
      // Shuffle animation duration
      setTimeout(() => {
        console.log('Shuffle animation complete');
        setIsShuffling(false);
      }, 2000);
    }
  }, [gameState, hasShuffled]);

  const handleRevealCard = async (cardId: number) => {
    console.log('handleRevealCard called with cardId:', cardId);
    if (revealing !== null) {
      console.log('Already revealing a card, ignoring');
      return;
    }
    
    if (!isMyTurn) {
      console.log('Not your turn, ignoring click');
      return;
    }
    
    console.log('Setting revealing state and making API call');
    setRevealing(cardId);
    try {
      const response = await fetch('http://localhost:5000/api/players/reveal-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_id: gameId,
          player_id: playerId,
          card_id: cardId
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Card revealed successfully:', data);
        // Clear any previous errors
        setError('');
        // Refresh game state
        await fetchGameState();
        
        // Check if game ended
        if (data.player.is_winner) {
          setTimeout(() => {
            onGameEnd?.();
          }, 2000);
        }
      } else {
        console.error('Card reveal failed:', data);
        setError(data.error || 'Failed to reveal card');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Reveal card error:', err);
    } finally {
      setRevealing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-center">
        {error}
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="text-center text-gray-400">
        No game state available
      </div>
    );
  }

  const { game, prizes, players, reveals } = gameState;
  const currentPlayer = game.turn_order[game.current_player_index];
  // Extract the ObjectId string properly
  let currentPlayerId: string | null = null;
  if (currentPlayer) {
    if (typeof currentPlayer === 'string') {
      currentPlayerId = currentPlayer;
    } else if (currentPlayer._id) {
      currentPlayerId = currentPlayer._id.toString();
    } else if (currentPlayer.id) {
      currentPlayerId = currentPlayer.id.toString();
    } else if (currentPlayer.toString) {
      currentPlayerId = currentPlayer.toString();
    }
  }
  const isMyTurn = currentPlayerId === playerId;
  
  // Additional debugging
  console.log('Turn Debug:', {
    currentPlayer,
    currentPlayerType: typeof currentPlayer,
    currentPlayerId,
    playerId,
    isMyTurn,
    comparison: currentPlayerId === playerId,
    currentPlayerKeys: currentPlayer ? Object.keys(currentPlayer) : null,
    currentPlayerString: currentPlayer ? currentPlayer.toString() : null,
    currentPlayerIdString: currentPlayerId ? currentPlayerId.toString() : null
  });
  const myPlayer = players.find(p => p.id === playerId);

  // Create grid
  const gridSize = game.grid_size;
  const totalCards = gridSize * gridSize;
  const cards = Array.from({ length: totalCards }, (_, i) => {
    const prize = prizes.find(p => p.position === i);
    const reveal = reveals.find(r => r.card_id === i);
    return {
      id: i,
      prize,
      isRevealed: prize?.is_revealed || false,
      revealedBy: reveal?.player?.name || reveal?.player?.username || 'Unknown',
      revealedAt: reveal?.revealed_at
    };
  });

  // Debug logging
  console.log('GameBoard Debug:', {
    playerId,
    currentPlayer: currentPlayer,
    currentPlayerId,
    isMyTurn,
    gameStatus: game.status,
    currentTurn: game.current_turn,
    currentPlayerIndex: game.current_player_index,
    turnOrder: game.turn_order,
    gridSize,
    totalCards: cards.length,
    cards: cards.slice(0, 5) // First 5 cards for debugging
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4">
      {/* Game Header */}
      <div className="text-center bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-6 border border-gray-600/50">
        <h2 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {game.name}
        </h2>
        <div className="flex items-center justify-center space-x-8 text-lg">
          <div className="bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-400/30">
            <span className="text-blue-300 font-semibold">Round {game.round}</span>
          </div>
          <div className="bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-400/30">
            <span className="text-purple-300 font-semibold">Turn {game.current_turn}</span>
          </div>
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            game.status === 'active' ? 'bg-green-500/20 border border-green-400/30 text-green-300' : 'bg-yellow-500/20 border border-yellow-400/30 text-yellow-300'
          }`}>
            {game.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Winner Announcement */}
      {game.status === 'completed' && (
        <div className="relative overflow-hidden mb-8">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          
          {/* Main content */}
          <div className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-8 rounded-2xl text-center shadow-2xl border-4 border-yellow-300">
            {/* Confetti effect simulation */}
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
            <div className="absolute top-0 right-1/4 w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-lg">
              GAME OVER!
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-yellow-100 mb-4">
              WINNER FOUND!
            </h2>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                🎉 {players.find(p => p.is_winner)?.name || 'Unknown'} 🎉
              </div>
              <div className="text-lg text-yellow-100 font-semibold">
                Won the prize!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Turn Info */}
      <div className={`relative overflow-hidden rounded-2xl p-6 text-center border-2 transition-all duration-500 ${
        isShuffling 
          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/50 shadow-yellow-500/20' 
          : game.status === 'completed'
            ? 'bg-gradient-to-r from-red-500/20 to-gray-600/20 border-red-400/50 shadow-red-500/20'
            : isMyTurn 
              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 shadow-green-500/20 shadow-lg'
              : 'bg-gradient-to-r from-gray-800/50 to-slate-700/50 border-gray-600/50'
      }`}>
        {/* Animated background effects */}
        {isMyTurn && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent animate-pulse"></div>
        )}
        {isShuffling && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-pulse"></div>
        )}
        
        <div className="relative z-10">
          {isShuffling ? (
            <div className="space-y-4">
              <div className="text-4xl animate-spin">🔀</div>
              <div className="text-yellow-400 font-bold text-xl md:text-2xl animate-pulse">
                SHUFFLING CARDS...
              </div>
              <div className="text-yellow-300 font-semibold text-lg">
                GET READY!
              </div>
            </div>
          ) : game.status === 'completed' ? (
            <div className="space-y-4">
              <div className="text-4xl animate-bounce">❌</div>
              <div className="text-red-400 font-bold text-xl md:text-2xl">
                GAME ENDED
              </div>
              <div className="text-red-300 font-semibold text-lg">
                NO MORE CHOICES ALLOWED
              </div>
            </div>
          ) : isMyTurn ? (
            <div className="space-y-4">
              <div className="text-4xl animate-bounce">🎯</div>
              <div className="text-green-400 font-bold text-xl md:text-2xl animate-pulse">
                IT'S YOUR TURN!
              </div>
              <div className="text-green-300 font-semibold text-lg">
                CLICK ANY BLUE CARD TO REVEAL IT!
              </div>
              <div className="w-full bg-green-500/20 rounded-full h-2">
                <div className="bg-green-400 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
              </div>
          </div>
        ) : (
            <div className="space-y-4">
              <div className="text-4xl animate-pulse">⏳</div>
              <div className="text-gray-300 font-semibold text-lg">
                Waiting for
              </div>
              <div className="text-white font-bold text-xl md:text-2xl bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                @{currentPlayer?.username || 'Unknown'}
              </div>
              <div className="text-gray-400 font-medium">
                to make their move...
              </div>
              <div className="w-full bg-gray-600/20 rounded-full h-2">
                <div className="bg-gray-400 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
              </div>
          </div>
        )}
        </div>
      </div>


      {/* Game Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Game Grid */}
        <div className="lg:col-span-3">
      <div 
            className={`game-grid mx-auto p-8 ${isShuffling ? 'shuffle-container' : ''} bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 shadow-2xl`}
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              width: 'fit-content',
              maxWidth: '90vw'
            }}
          >
            {cards.map((card) => {
              // Assign different shuffle animations to create variety
              const shuffleClass = isShuffling ? `shuffle-animation-${(card.id % 6) + 1}` : '';
              
              return (
          <div
            key={card.id}
            className={`
                    game-card card-hover transition-all duration-300 transform
              ${card.isRevealed 
                      ? 'bg-gradient-to-br from-white to-gray-100 border-2 border-gray-300 card-flip cursor-default shadow-lg' 
                      : game.status === 'completed'
                        ? 'bg-gradient-to-br from-gray-400 to-gray-600 border-2 border-gray-500 cursor-not-allowed opacity-30'
                        : isMyTurn && revealing !== card.id && !isShuffling
                          ? 'bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 border-2 border-blue-300 hover:from-blue-400 hover:via-purple-500 hover:to-indigo-500 shadow-xl hover:shadow-2xl cursor-pointer hover:scale-105 hover:rotate-1'
                          : 'bg-gradient-to-br from-gray-500 to-gray-700 border-2 border-gray-400 cursor-not-allowed opacity-50'
                    }
                    ${revealing === card.id ? 'animate-pulse scale-110 shadow-2xl' : ''}
                    ${shuffleClass}
                    rounded-2xl overflow-hidden
            `}
            onClick={() => {
                    console.log('Card clicked:', {
                      cardId: card.id,
                      isMyTurn,
                      isRevealed: card.isRevealed,
                      revealing,
                      isShuffling,
                      canClick: isMyTurn && !card.isRevealed && revealing === null && !isShuffling,
                      currentPlayerId: currentPlayerId,
                      playerId: playerId
                    });
                    if (game.status === 'completed') {
                      console.log('Game completed - no more choices allowed');
                    } else if (isMyTurn && !card.isRevealed && revealing === null && !isShuffling) {
                      console.log('Calling handleRevealCard');
                handleRevealCard(card.id);
                    } else {
                      console.log('Cannot click card - conditions not met');
              }
            }}
          >
            {card.isRevealed ? (
                    <div className="text-center p-3 h-full flex flex-col justify-center animate-fade-in bg-gradient-to-br from-white to-gray-50">
                {card.prize ? (
                        <div className="animate-bounce space-y-2">
                          <div className="text-2xl mb-2">🎉</div>
                          <div className="text-lg font-black text-yellow-600 mb-2 drop-shadow-sm">
                            WIN!
                    </div>
                          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-2 mb-2 border border-yellow-200">
                            <div className="text-sm font-bold text-gray-800 mb-1">
                              {JSON.parse(card.prize.content).text}
                    </div>
                            <div className="text-lg text-green-600 font-black">
                      ${JSON.parse(card.prize.content).value}
                            </div>
                          </div>
                          <div className="text-xs text-blue-600 font-semibold bg-blue-50 rounded-full px-2 py-1">
                            Found by: {card.revealedBy}
                    </div>
                  </div>
                ) : (
                        <div className="text-center space-y-2">
                          <div className="text-2xl mb-2">😞</div>
                          <div className="text-lg font-bold text-red-600 mb-2">
                      Try Again
                    </div>
                          <div className="text-sm text-gray-500 mb-2">
                      You Lose
                    </div>
                          <div className="text-xs text-blue-600 font-semibold bg-blue-50 rounded-full px-2 py-1">
                            Revealed by: {card.revealedBy}
                          </div>
                  </div>
                )}
              </div>
            ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl relative overflow-hidden group">
                      <div className="text-white text-6xl md:text-8xl font-black z-10 drop-shadow-2xl animate-pulse group-hover:scale-110 transition-transform duration-300">
                  ?
                </div>
                      {/* Enhanced shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 -translate-x-full animate-shimmer"></div>
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                      {/* Outer glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/60 to-purple-500/60 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                      {/* Hover effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            )}
                </div>
              );
            })}
          </div>
      </div>

        {/* Players Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl sticky top-4">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="text-2xl mr-2">👥</span>
              Turn Order
            </h3>
            <div className="space-y-3">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`
                    flex items-center justify-between p-4 rounded-xl transition-all duration-300 transform hover:scale-105
                    ${currentPlayer?.id === player.id ? 'bg-gradient-to-r from-blue-500/30 to-indigo-500/30 border-2 border-blue-400 shadow-blue-500/20 shadow-lg' : 'bg-gradient-to-r from-gray-700/50 to-slate-700/50 border border-gray-600'}
                    ${player.is_winner ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400 shadow-yellow-500/20 shadow-lg' : ''}
                    ${isShuffling ? 'opacity-50' : ''}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg
                      ${currentPlayer?.id === player.id ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white animate-pulse' : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300'}
                      ${player.is_winner ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black animate-bounce' : ''}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-white font-semibold">@{player.username}</div>
                      <div className="text-xs text-gray-400">{player.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {currentPlayer?.id === player.id ? (
                      <div className="text-blue-400 text-xs font-bold bg-blue-500/20 px-2 py-1 rounded-full animate-pulse">
                        Current Turn
                      </div>
                    ) : player.is_winner ? (
                      <div className="text-yellow-400 text-xs font-bold bg-yellow-500/20 px-2 py-1 rounded-full animate-bounce">
                        🏆 Winner
                      </div>
                    ) : (
                      <div className="text-gray-500 text-xs bg-gray-600/20 px-2 py-1 rounded-full">
                        Waiting
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Game Stats */}
            <div className="mt-6 pt-4 border-t border-slate-600/50">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">{game.current_turn}</div>
                  <div className="text-xs text-gray-400">Turn</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">{game.round}</div>
                  <div className="text-xs text-gray-400">Round</div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Player Info */}
      {myPlayer && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Your Status</h3>
          <div className="flex items-center justify-between">
            <span className="text-white">@{myPlayer.username}</span>
            {myPlayer.is_winner ? (
              <span className="text-yellow-400 font-bold">🎉 WINNER! 🎉</span>
            ) : (
              <span className="text-gray-400">Playing...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
