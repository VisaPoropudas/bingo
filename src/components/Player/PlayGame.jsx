import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import BingoCard from './BingoCard';
import './Player.css';

const PlayGame = ({ gameId, onLeaveGame }) => {
  const { currentUser } = useAuth();
  const [game, setGame] = useState(null);
  const [playerCards, setPlayerCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requestedCards, setRequestedCards] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    loadGame();
    const interval = setInterval(loadGame, 3000);
    return () => clearInterval(interval);
  }, [gameId]);

  const loadGame = async () => {
    try {
      const gameDoc = await getDoc(doc(db, 'games', gameId));
      if (gameDoc.exists()) {
        setGame({ id: gameDoc.id, ...gameDoc.data() });
      }

      // Lataa pelaajan kortit
      await loadPlayerCards();

      setLoading(false);
    } catch (error) {
      console.error('Error loading game:', error);
      setLoading(false);
    }
  };

  const loadPlayerCards = async () => {
    try {
      const q = query(
        collection(db, 'games', gameId, 'cards'),
        where('assignedTo', '==', currentUser.uid)
      );
      const cardsSnapshot = await getDocs(q);
      const cards = cardsSnapshot.docs.map(doc => ({
        ...doc.data()
      }));
      setPlayerCards(cards);
    } catch (error) {
      console.error('Error loading player cards:', error);
    }
  };

  const requestCards = async (count) => {
    try {
      // Hae vapaita kortteja
      const q = query(
        collection(db, 'games', gameId, 'cards'),
        where('assigned', '==', false)
      );
      const availableCardsSnapshot = await getDocs(q);

      if (availableCardsSnapshot.empty) {
        alert('Ei vapaita kortteja saatavilla');
        return;
      }

      const cardsToAssign = availableCardsSnapshot.docs.slice(0, count);

      // Merkitse kortit pelaajalle
      for (const cardDoc of cardsToAssign) {
        await addDoc(collection(db, 'games', gameId, 'assignments'), {
          cardId: cardDoc.id,
          playerId: currentUser.uid,
          playerName: currentUser.displayName || currentUser.email,
          assignedAt: new Date().toISOString()
        });

        // Päivitä kortin tila (yksinkertaistettu - oikeasti pitäisi käyttää transaction)
        const cardRef = doc(db, 'games', gameId, 'cards', cardDoc.id);
        await getDoc(cardRef).then(async (card) => {
          if (card.exists() && !card.data().assigned) {
            // Tässä pitäisi käyttää Firestore transactionia oikean sovelluksen tapauksessa
            const cardData = card.data();
            cardData.assigned = true;
            cardData.assignedTo = currentUser.uid;
          }
        });
      }

      setRequestedCards(true);
      await loadPlayerCards();
    } catch (error) {
      console.error('Error requesting cards:', error);
      alert('Korttien pyytäminen epäonnistui');
    }
  };

  // Swipe-toiminnallisuus
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      // Swipe vasemmalle
      nextCard();
    }

    if (touchEndX.current - touchStartX.current > 50) {
      // Swipe oikealle
      previousCard();
    }
  };

  const nextCard = () => {
    if (currentCardIndex < playerCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  if (loading) {
    return <div className="loading">Ladataan peliä...</div>;
  }

  if (!game) {
    return <div className="error">Peliä ei löytynyt</div>;
  }

  if (playerCards.length === 0 && !requestedCards) {
    return (
      <div className="request-cards">
        <h2>{game.name}</h2>
        <p>Valitse, kuinka monta ruudukkoa haluat peliin:</p>
        <div className="card-count-buttons">
          {[1, 2, 3, 4, 5].map(count => (
            <button
              key={count}
              className="btn btn-primary"
              onClick={() => requestCards(count)}
            >
              {count} ruudukkoa
            </button>
          ))}
        </div>
        <button className="btn btn-secondary" onClick={onLeaveGame}>
          Takaisin
        </button>
      </div>
    );
  }

  if (playerCards.length === 0) {
    return (
      <div className="loading">
        <p>Haetaan kortteja...</p>
        <button className="btn btn-secondary" onClick={onLeaveGame}>
          Takaisin
        </button>
      </div>
    );
  }

  const currentCard = playerCards[currentCardIndex];
  const latestBall = game.calledBalls && game.calledBalls.length > 0
    ? game.calledBalls[game.calledBalls.length - 1]
    : null;

  return (
    <div className="play-game">
      <div className="game-info">
        <button className="leave-btn" onClick={onLeaveGame}>
          ← Poistu
        </button>
        <h2>{game.name}</h2>
        <div className="game-status">
          <span className={`status-badge status-${game.status}`}>
            {game.status === 'waiting' ? 'Odottaa aloitusta' :
             game.status === 'active' ? 'Käynnissä' :
             'Päättynyt'}
          </span>
        </div>
      </div>

      <div className="latest-ball">
        <div className="latest-ball-label">Viimeisin pallo</div>
        <div className="latest-ball-value">
          {latestBall || '-'}
        </div>
        <div className="balls-count">
          {game.calledBalls?.length || 0} / 75 palloa arvottu
        </div>
      </div>

      <div
        className="cards-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <BingoCard
          card={currentCard}
          calledBalls={game.calledBalls || []}
          centerFree={game.centerFree}
        />
      </div>

      {playerCards.length > 1 && (
        <div className="card-navigation">
          <button
            className="nav-btn"
            onClick={previousCard}
            disabled={currentCardIndex === 0}
          >
            ← Edellinen
          </button>
          <div className="card-indicator">
            {currentCardIndex + 1} / {playerCards.length}
          </div>
          <button
            className="nav-btn"
            onClick={nextCard}
            disabled={currentCardIndex === playerCards.length - 1}
          >
            Seuraava →
          </button>
        </div>
      )}

      <div className="bingo-claim">
        <div className="card-id-display">
          <strong>Ruudukon tunniste:</strong> {currentCard.id}
        </div>
        <p className="bingo-hint">
          Jos sinulla on BINGO, kerro tunniste pelin pitäjälle!
        </p>
      </div>
    </div>
  );
};

export default PlayGame;
