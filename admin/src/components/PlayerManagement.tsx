import React, { useState, useEffect } from 'react';
import { Player, Game } from '../types';
import { playersAPI, gamesAPI } from '../services/api';

const PlayerManagement: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    username: '',
    gameId: ''
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    gameId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data...');
      const [gamesResponse, playersResponse] = await Promise.all([
        gamesAPI.getAll(),
        playersAPI.getAll()
      ]);
      console.log('Games response:', gamesResponse.data);
      console.log('Players response:', playersResponse.data);
      
      const gamesData = gamesResponse.data.games || [];
      const playersData = playersResponse.data.players || [];
      
      console.log('Setting games:', gamesData);
      console.log('Setting players:', playersData);
      
      setGames(gamesData);
      setPlayers(playersData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.gameId || !newPlayer.username) {
      setError('Please select a game and enter a username');
      return;
    }

    try {
      console.log('Creating player with:', { gameId: newPlayer.gameId, username: newPlayer.username });
      const response = await gamesAPI.createPlayer(newPlayer.gameId, {
        username: newPlayer.username
      });
      console.log('Create player response:', response);
      setNewPlayer({ username: '', gameId: '' });
      setShowAddPlayer(false);
      fetchData();
    } catch (err: any) {
      console.error('Create player error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Full error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to add player');
    }
  };

  const handleInvitePlayer = async (player: Player) => {
    try {
      const game = games.find(g => g.id === player.game_id);
      if (game) {
        await gamesAPI.invitePlayer(game.id, player.id);
        fetchData();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to invite player');
    }
  };

  const handleAssignUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    try {
      const game = games.find(g => g.id === selectedPlayer.game_id);
      if (game) {
        await gamesAPI.assignUsername(game.id, selectedPlayer.id, {
          username: inviteUsername
        });
        setShowInviteModal(false);
        setSelectedPlayer(null);
        setInviteUsername('');
        fetchData();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign username');
    }
  };

  const openInviteModal = (player: Player) => {
    setSelectedPlayer(player);
    setInviteUsername(player.username || '');
    setShowInviteModal(true);
  };

  const handleDeletePlayer = async (player: Player) => {
    console.log('Delete button clicked for player:', player);
    console.log('Player ID:', player.id);
    console.log('Player _id:', (player as any)._id);
    if (window.confirm(`Are you sure you want to delete player @${player.username}? This action cannot be undone.`)) {
      try {
        console.log('User confirmed deletion');
        
        // Handle both string IDs and populated game objects
        const gameIdString = getGameIdString(player.game_id);
        if (!gameIdString) {
          console.error('Invalid game_id format:', player.game_id);
          setError('Invalid game ID format');
          return;
        }
        
        const game = games.find(g => g.id === gameIdString);
        console.log('Found game for player:', game);
        if (game) {
          // Handle both _id and id properties for player ID
          const playerId = player.id || (player as any)._id;
          console.log('Deleting player:', playerId, 'from game:', game.id);
          const response = await gamesAPI.deletePlayer(game.id, playerId);
          console.log('Delete response:', response);
          console.log('Player deleted successfully');
          fetchData();
        } else {
          console.error('Game not found for player');
          setError('Game not found for this player');
        }
      } catch (err: any) {
        console.error('Delete player error:', err);
        console.error('Error response:', err.response?.data);
        setError(err.response?.data?.error || 'Failed to delete player');
      }
    } else {
      console.log('User cancelled deletion');
    }
  };

  const getGameIdString = (gameId: string | { _id: string; id?: string; name?: string; game_code?: string; status?: string }): string => {
    if (typeof gameId === 'string') {
      return gameId;
    } else if (gameId && typeof gameId === 'object' && '_id' in gameId) {
      return gameId._id;
    } else if (gameId && typeof gameId === 'object' && 'id' in gameId) {
      return (gameId as { id?: string }).id || '';
    }
    return '';
  };

  const openEditModal = (player: Player) => {
    setEditPlayer(player);
    setEditForm({
      username: player.username,
      gameId: getGameIdString(player.game_id)
    });
    setShowEditModal(true);
  };

  const handleEditPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlayer || !editForm.username || !editForm.gameId) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const game = games.find(g => g.id === editForm.gameId);
      if (game) {
        // Handle both _id and id properties for player ID
        const playerId = editPlayer.id || (editPlayer as any)._id;
        console.log('Updating player:', playerId, 'in game:', game.id);
        await gamesAPI.updatePlayer(game.id, playerId, {
          username: editForm.username
        });
        setShowEditModal(false);
        setEditPlayer(null);
        setEditForm({ username: '', gameId: '' });
        fetchData();
      }
    } catch (err: any) {
      console.error('Update player error:', err);
      setError(err.response?.data?.error || 'Failed to update player');
    }
  };

  const filteredPlayers = selectedGame === 'all' 
    ? players 
    : players.filter(player => player.game_id === selectedGame);

  const getGameName = (gameId: any) => {
    console.log('getGameName called with gameId:', gameId);
    console.log('gameId type:', typeof gameId);
    console.log('Available games:', games.map(g => ({ id: g.id, name: g.name })));
    
    // Handle both string IDs and populated game objects
    let gameIdString: string;
    if (typeof gameId === 'string') {
      gameIdString = gameId;
    } else if (gameId && typeof gameId === 'object' && gameId._id) {
      gameIdString = gameId._id;
    } else if (gameId && typeof gameId === 'object' && gameId.id) {
      gameIdString = gameId.id;
    } else {
      console.log('Invalid gameId format:', gameId);
      return 'Unknown Game';
    }
    
    const game = games.find(g => g.id === gameIdString);
    console.log('Found game:', game);
    return game ? game.name : 'Unknown Game';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Player Management</h2>
        <button
          onClick={() => setShowAddPlayer(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-medium flex items-center space-x-2 whitespace-nowrap min-w-fit"
        >
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="flex-shrink-0">Add Players</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Game Filter */}
      <div className="bg-gradient-to-r from-gray-800/30 to-gray-700/30 border border-gray-600/30 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">Filter by Game</span>
          </div>
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-[200px]"
            style={{ colorScheme: 'dark' }}
          >
            <option value="all">All Games</option>
            {games.map(game => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Players List */}
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
            <span>Usernames</span>
            <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm">
              {filteredPlayers.length}
            </span>
          </h3>
        </div>
        
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="text-gray-400 text-lg mb-2">No usernames found</div>
            <p className="text-gray-500">Add usernames to get started with raffle sales</p>
          </div>
        ) : (
                 <div className="space-y-3">
                   {filteredPlayers.map((player) => (
                     <div key={`player-${player.id}`} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/70 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-lg font-semibold text-white">
                      @{player.username}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-500/20 text-blue-300 text-xs font-mono px-2 py-1 rounded">
                        {player.player_code}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(player.player_code);
                          alert('Player code copied!');
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                        title="Copy player code"
                      >
                        📋
                      </button>
                    </div>
                    <div className="text-sm text-gray-400">
                      {getGameName(player.game_id)}
                    </div>
                    {player.is_admin_created && !player.is_invited && (
                      <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">
                        Ready
                      </span>
                    )}
                    {player.is_invited && (
                      <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded">
                        Assigned
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(player)}
                      className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 px-3 py-1 rounded text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlayer(player)}
                      className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-3 py-1 rounded text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Username Modal */}
      {showAddPlayer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600/50 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">Add Username</h3>
            </div>
            <form onSubmit={handleAddPlayer}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Select Game</label>
                        <select
                          value={newPlayer.gameId}
                          onChange={(e) => setNewPlayer({ ...newPlayer, gameId: e.target.value })}
                          required
                          className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          style={{ colorScheme: 'dark' }}
                        >
                    <option value="">🎮 Choose a game...</option>
                    {games.map(game => (
                      <option key={game.id} value={game.id}>
                        {game.name} ({game.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Username</label>
                        <input
                          type="text"
                          placeholder="Enter username..."
                          value={newPlayer.username}
                          onChange={(e) => setNewPlayer({ ...newPlayer, username: e.target.value })}
                          required
                          className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          style={{ colorScheme: 'dark' }}
                        />
                </div>
              </div>
              <div className="flex space-x-4 mt-8">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Add Username
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPlayer(false)}
                  className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Assign Username</h3>
            <p className="text-gray-400 mb-4">
              Assign a username for {selectedPlayer.name} to use when they join offline.
            </p>
            <form onSubmit={handleAssignUsername}>
              <input
                type="text"
                placeholder="Enter username"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                style={{ colorScheme: 'dark' }}
              />
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="btn-primary px-4 py-2"
                >
                  Assign Username
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedPlayer(null);
                    setInviteUsername('');
                  }}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {showEditModal && editPlayer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600/50 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">Edit Player</h3>
            </div>
            <form onSubmit={handleEditPlayer}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Username</label>
                  <input
                    type="text"
                    placeholder="Enter username..."
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    required
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Game</label>
                  <select
                    value={editForm.gameId}
                    onChange={(e) => setEditForm({ ...editForm, gameId: e.target.value })}
                    required
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="">🎮 Choose a game...</option>
                    {games.map(game => (
                      <option key={game.id} value={game.id}>
                        {game.name} ({game.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex space-x-4 mt-8">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Update Player
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditPlayer(null);
                    setEditForm({ username: '', gameId: '' });
                  }}
                  className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerManagement;
