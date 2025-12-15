import { useState } from 'react';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { generateBingoCard } from '../../utils/bingoUtils';
import './Host.css';

const CreateGame = ({ onGameCreated }) => {
  const { currentUser } = useAuth();
  const [gameName, setGameName] = useState('');
  const [centerFree, setCenterFree] = useState(true);
  const [winConditions, setWinConditions] = useState({
    straightLine: true,
    corners: false,
    fullCard: false
  });
  const [cardCount, setCardCount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleWinConditionChange = (condition) => {
    setWinConditions({
      ...winConditions,
      [condition]: !winConditions[condition]
    });
  };

  const handleCreateGame = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!gameName.trim()) {
      setError('Anna pelille nimi');
      setLoading(false);
      return;
    }

    if (!winConditions.straightLine && !winConditions.corners && !winConditions.fullCard) {
      setError('Valitse vähintään yksi voittotapa');
      setLoading(false);
      return;
    }

    try {
      // Luo peli
      const gameRef = await addDoc(collection(db, 'games'), {
        name: gameName,
        hostId: currentUser.uid,
        hostName: currentUser.displayName || currentUser.email,
        centerFree,
        winConditions,
        status: 'waiting', // waiting, active, finished
        calledBalls: [],
        createdAt: new Date().toISOString(),
        maxCards: cardCount
      });

      // Generoi BINGO-kortit
      const cards = [];
      for (let i = 0; i < cardCount; i++) {
        const cardId = `${gameRef.id}-${i + 1}`;
        const card = generateBingoCard(cardId);

        await setDoc(doc(db, 'games', gameRef.id, 'cards', cardId), {
          ...card,
          assigned: false,
          assignedTo: null
        });

        cards.push(card);
      }

      console.log(`Peli luotu: ${gameRef.id}, ${cards.length} korttia`);

      if (onGameCreated) {
        onGameCreated(gameRef.id);
      }
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Pelin luominen epäonnistui: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-game">
      <h2>Luo uusi peli</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleCreateGame}>
        <div className="form-group">
          <label htmlFor="gameName">Pelin nimi</label>
          <input
            id="gameName"
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="esim. Viikonlopun BINGO"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cardCount">Ruudukoiden määrä</label>
          <input
            id="cardCount"
            type="number"
            value={cardCount}
            onChange={(e) => setCardCount(parseInt(e.target.value))}
            min="1"
            max="1000"
            required
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={centerFree}
              onChange={(e) => setCenterFree(e.target.checked)}
            />
            <span>Keskimmäinen ruutu on annettu</span>
          </label>
        </div>

        <div className="form-group">
          <label>Voittotavat</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={winConditions.straightLine}
                onChange={() => handleWinConditionChange('straightLine')}
              />
              <span>Suora linja (vaaka, pysty, diagonaali)</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={winConditions.corners}
                onChange={() => handleWinConditionChange('corners')}
              />
              <span>Kulmat</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={winConditions.fullCard}
                onChange={() => handleWinConditionChange('fullCard')}
              />
              <span>Koko ruudukko</span>
            </label>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Luodaan peliä...' : 'Luo peli'}
        </button>
      </form>
    </div>
  );
};

export default CreateGame;
