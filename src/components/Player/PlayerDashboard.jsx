import { useState } from 'react';
import GameList from './GameList';
import PlayGame from './PlayGame';
import './Player.css';

const PlayerDashboard = () => {
  const [selectedGame, setSelectedGame] = useState(null);

  const handleJoinGame = (gameId) => {
    setSelectedGame(gameId);
  };

  const handleLeaveGame = () => {
    setSelectedGame(null);
  };

  if (selectedGame) {
    return <PlayGame gameId={selectedGame} onLeaveGame={handleLeaveGame} />;
  }

  return (
    <div className="player-dashboard">
      <GameList onJoinGame={handleJoinGame} />
    </div>
  );
};

export default PlayerDashboard;
