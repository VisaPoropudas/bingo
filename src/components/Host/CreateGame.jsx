import { useState } from 'react';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { generateBingoCard } from '../../utils/bingoUtils';
import './Host.css';

// Generoi lyhyt 5-merkkinen ID (esim. A1B2C, XY789)
const generateShortId = (index) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  let num = index;

  // Muunna numero 5-merkkiseksi base-36 tunnisteeksi
  for (let i = 0; i < 5; i++) {
    id = chars[num % chars.length] + id;
    num = Math.floor(num / chars.length);
  }

  return id;
};

const CreateGame = ({ onGameCreated }) => {
  const { currentUser } = useAuth();
  const [gameName, setGameName] = useState('');
  const [centerFree, setCenterFree] = useState(true);
  const [autoMark, setAutoMark] = useState(true);
  const [winConditions, setWinConditions] = useState({
    horizontal: true,
    vertical: true,
    diagonal: true,
    corners: false,
    fullCard: false
  });
  const [requiredLines, setRequiredLines] = useState(1);
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

    if (!winConditions.horizontal && !winConditions.vertical && !winConditions.diagonal &&
        !winConditions.corners && !winConditions.fullCard) {
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
        autoMark,
        winConditions,
        requiredLines,
        status: 'waiting', // waiting, active, finished
        calledBalls: [],
        createdAt: new Date().toISOString(),
        maxCards: cardCount
      });

      // Generoi BINGO-kortit
      const cards = [];
      for (let i = 0; i < cardCount; i++) {
        // Luo lyhyt 5-merkkinen tunniste (A-Z, 0-9)
        const cardId = generateShortId(i);
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

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={autoMark}
              onChange={(e) => setAutoMark(e.target.checked)}
            />
            <span>Numerot merkitään automaattisesti</span>
          </label>
          <small style={{ display: 'block', marginTop: '0.5rem', color: '#666' }}>
            Jos ei valittu, pelaajien täytyy klikata numeroita merkitäkseen ne
          </small>
        </div>

        <div className="form-group">
          <label>Voittotavat</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={winConditions.horizontal}
                onChange={() => handleWinConditionChange('horizontal')}
              />
              <span>Vaakarivit</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={winConditions.vertical}
                onChange={() => handleWinConditionChange('vertical')}
              />
              <span>Pystyrivit</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={winConditions.diagonal}
                onChange={() => handleWinConditionChange('diagonal')}
              />
              <span>Diagonaalit</span>
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

        <div className="form-group">
          <label htmlFor="requiredLines">Vaadittujen linjojen määrä</label>
          <select
            id="requiredLines"
            value={requiredLines}
            onChange={(e) => setRequiredLines(parseInt(e.target.value))}
          >
            <option value={1}>1 linja</option>
            <option value={2}>2 linjaa</option>
            <option value={3}>3 linjaa</option>
            <option value={4}>4 linjaa</option>
            <option value={5}>5 linjaa</option>
          </select>
          <small style={{ display: 'block', marginTop: '0.5rem', color: '#666' }}>
            Voit muuttaa tätä pelin aikana pitäjän näkymästä
          </small>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Luodaan peliä...' : 'Luo peli'}
        </button>
      </form>
    </div>
  );
};

export default CreateGame;
