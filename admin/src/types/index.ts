export interface Admin {
  id: string;
  username: string;
  email: string;
}

export interface Game {
  id: string;
  name: string;
  description?: string;
  grid_size: number;
  max_players: number;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  player_count?: number;
  winner_count?: number;
  game_code: string;
}

export interface Player {
  id: string;
  game_id: string | { _id: string; id?: string; name?: string; game_code?: string; status?: string };
  player_code: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  is_winner: boolean;
  is_admin_created: boolean;
  is_invited: boolean;
  invited_at?: string;
  joined_at: string;
  last_activity: string;
}

export interface Prize {
  id: string;
  type: 'image' | 'word' | 'nft';
  content: any;
  position: number;
  is_revealed: boolean;
  revealed_by?: string;
  revealed_at?: string;
}

export interface CardReveal {
  id: string;
  game_id: string;
  player_id: string;
  card_id: number;
  revealed_at: string;
  player_name: string;
}

export interface GameDetails extends Game {
  players: Player[];
  prizes: Prize[];
  reveals: CardReveal[];
}

export interface CreateGameData {
  name: string;
  description?: string;
  gridSize: number;
  maxPlayers: number;
  prizes: {
    type: 'image' | 'word' | 'nft';
    content: any;
  }[];
}

export interface CreatePlayerData {
  name: string;
  email?: string;
  phone?: string;
  username?: string;
}

export interface InvitePlayerData {
  playerId: string;
  gameId: string;
}

export interface AssignUsernameData {
  username: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthContextType {
  admin: Admin | null;
  login: (data: LoginData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

