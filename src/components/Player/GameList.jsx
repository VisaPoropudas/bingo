import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './Player.css';

const GameList = ({ onJoinGame }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
    // Päivitä lista säännöllisesti
    const interval = setInterval(loadGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadGames = async () => {
    try {
      const q = query(
        collection(db, 'games'),
        where('status', 'in', ['waiting', 'active'])
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

  if (loading) {
    return <div className="loading">Ladataan pelejä...</div>;
  }

  return (
    <div className="game-list">
      <h2>Käynnissä olevat pelit</h2>

      <div className="games-container">
        {games.map(game => (
          <div key={game.id} className="game-list-card">
            <div className="game-list-header">
              <h3>{game.name}</h3>
              <span className={`status-badge status-${game.status}`}>
                {game.status === 'waiting' ? 'Odottaa' : 'Käynnissä'}
              </span>
            </div>
            <div className="game-list-body">
              <p><strong>Isäntä:</strong> {game.hostName}</p>
              <p><strong>Palloja arvottu:</strong> {game.calledBalls?.length || 0} / 75</p>
              <p><strong>Voittotavat:</strong></p>
              <ul>
                {game.winConditions?.straightLine && <li>Suora linja</li>}
                {game.winConditions?.corners && <li>Kulmat</li>}
                {game.winConditions?.fullCard && <li>Koko ruudukko</li>}
              </ul>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => onJoinGame(game.id)}
            >
              Liity peliin
            </button>
          </div>
        ))}

        {games.length === 0 && (
          <div className="no-games">
            <p>Ei käynnissä olevia pelejä</p>
            <p className="hint">Tarkista hetken kuluttua uudelleen</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameList;
