import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import CreateGame from './CreateGame';
import GameControl from './GameControl';
import './Host.css';

const HostDashboard = () => {
  const { currentUser } = useAuth();
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, [currentUser]);

  const loadGames = async () => {
    try {
      const q = query(
        collection(db, 'games'),
        where('hostId', '==', currentUser.uid)
      );
      const gamesSnapshot = await getDocs(q);
      const gamesData = gamesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGames(gamesData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading games:', error);
      setLoading(false);
    }
  };

  const handleGameCreated = (gameId) => {
    setShowCreateGame(false);
    setSelectedGame(gameId);
    loadGames();
  };

  if (selectedGame) {
    return (
      <div className="host-dashboard">
        <button
          className="back-btn"
          onClick={() => setSelectedGame(null)}
        >
          ← Takaisin peleihin
        </button>
        <GameControl gameId={selectedGame} />
      </div>
    );
  }

  if (showCreateGame) {
    return (
      <div className="host-dashboard">
        <button
          className="back-btn"
          onClick={() => setShowCreateGame(false)}
        >
          ← Takaisin
        </button>
        <CreateGame onGameCreated={handleGameCreated} />
      </div>
    );
  }

  return (
    <div className="host-dashboard">
      <div className="dashboard-header">
        <h1>Pelien hallinta</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateGame(true)}
        >
          + Luo uusi peli
        </button>
      </div>

      {loading ? (
        <div className="loading">Ladataan pelejä...</div>
      ) : (
        <div className="games-grid">
          {games.map(game => (
            <div key={game.id} className="game-card">
              <div className="game-card-header">
                <h3>{game.name}</h3>
                <span className={`status-badge status-${game.status}`}>
                  {game.status === 'waiting' ? 'Odottaa' :
                   game.status === 'active' ? 'Käynnissä' :
                   'Päättynyt'}
                </span>
              </div>
              <div className="game-card-body">
                <p>Arvottuja palloja: {game.calledBalls?.length || 0} / 75</p>
                <p>Ruudukoita: {game.maxCards}</p>
                <p>Luotu: {new Date(game.createdAt).toLocaleDateString('fi-FI')}</p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedGame(game.id)}
              >
                Avaa peli
              </button>
            </div>
          ))}

          {games.length === 0 && (
            <div className="no-games">
              <p>Ei vielä luotuja pelejä</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateGame(true)}
              >
                Luo ensimmäinen peli
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HostDashboard;
