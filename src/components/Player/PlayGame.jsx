import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import BingoCard from './BingoCard';
import { QRCodeSVG } from 'qrcode.react';
import { useSwipeable } from 'react-swipeable';
import { Container, Card, Button, Badge, Alert } from 'react-bootstrap';
import { QrCodeScan } from 'react-bootstrap-icons';
import './Player.css';

const PlayGame = ({ gameId, onLeaveGame }) => {
  const { currentUser } = useAuth();
  const [game, setGame] = useState(null);
  const [playerCards, setPlayerCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requestedCards, setRequestedCards] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
      setRequestedCards(true);
      setLoading(true);

      // Hae vapaita kortteja
      const q = query(
        collection(db, 'games', gameId, 'cards'),
        where('assigned', '==', false)
      );
      const availableCardsSnapshot = await getDocs(q);

      if (availableCardsSnapshot.empty) {
        alert('Ei vapaita kortteja saatavilla');
        setRequestedCards(false);
        setLoading(false);
        return;
      }

      if (availableCardsSnapshot.docs.length < count) {
        alert(`Vain ${availableCardsSnapshot.docs.length} korttia saatavilla`);
      }

      const cardsToAssign = availableCardsSnapshot.docs.slice(0, count);

      // Merkitse kortit pelaajalle
      for (const cardDoc of cardsToAssign) {
        const cardRef = doc(db, 'games', gameId, 'cards', cardDoc.id);

        // Päivitä kortin tila
        await updateDoc(cardRef, {
          assigned: true,
          assignedTo: currentUser.uid,
          assignedAt: new Date().toISOString()
        });

        // Luo myös assignment-dokumentti historiaa varten
        await addDoc(collection(db, 'games', gameId, 'assignments'), {
          cardId: cardDoc.id,
          playerId: currentUser.uid,
          playerName: currentUser.displayName || currentUser.email,
          assignedAt: new Date().toISOString()
        });
      }

      await loadPlayerCards();
      setLoading(false);
    } catch (error) {
      console.error('Error requesting cards:', error);
      alert('Korttien pyytäminen epäonnistui: ' + error.message);
      setRequestedCards(false);
      setLoading(false);
    }
  };

  // Swipe-toiminnallisuus react-swipeable:lla
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      // Swipe vasemmalle -> seuraava kortti
      if (currentCardIndex < playerCards.length - 1 && !isTransitioning) {
        setIsTransitioning(true);
        setCurrentCardIndex(currentCardIndex + 1);
        setTimeout(() => setIsTransitioning(false), 300);
      }
    },
    onSwipedRight: () => {
      // Swipe oikealle -> edellinen kortti
      if (currentCardIndex > 0 && !isTransitioning) {
        setIsTransitioning(true);
        setCurrentCardIndex(currentCardIndex - 1);
        setTimeout(() => setIsTransitioning(false), 300);
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 50
  });

  const nextCard = () => {
    if (currentCardIndex < playerCards.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentCardIndex(currentCardIndex + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentCardIndex(currentCardIndex - 1);
      setTimeout(() => setIsTransitioning(false), 300);
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
      <Container className="py-4">
        <Card className="shadow-sm">
          <Card.Body className="text-center">
            <Card.Title className="mb-4">{game.name}</Card.Title>
            <Card.Text className="mb-4">
              Valitse, kuinka monta ruudukkoa haluat peliin:
            </Card.Text>
            <div className="d-flex flex-wrap justify-content-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map(count => (
                <Button
                  key={count}
                  variant="primary"
                  size="lg"
                  onClick={() => requestCards(count)}
                  className="px-4"
                >
                  {count} {count === 1 ? 'ruudukko' : 'ruudukkoa'}
                </Button>
              ))}
            </div>
            <Button variant="outline-secondary" onClick={onLeaveGame}>
              ← Takaisin
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (playerCards.length === 0) {
    return (
      <Container className="py-4 text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Ladataan...</span>
        </div>
        <p>Haetaan kortteja...</p>
        <Button variant="outline-secondary" onClick={onLeaveGame}>
          ← Takaisin
        </Button>
      </Container>
    );
  }

  const currentCard = playerCards[currentCardIndex];
  const latestBall = game.calledBalls && game.calledBalls.length > 0
    ? game.calledBalls[game.calledBalls.length - 1]
    : null;

  return (
    <div style={{
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      <Container
        fluid
        className="py-3"
        style={{
          maxWidth: '800px',
          overflow: 'hidden',
          width: '100%',
          margin: '0 auto',
          padding: '1rem 0.75rem',
          boxSizing: 'border-box'
        }}
      >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button variant="outline-secondary" size="sm" onClick={onLeaveGame}>
          ← Poistu
        </Button>
        <h4 className="mb-0">{game.name}</h4>
        <Badge bg={game.status === 'active' ? 'success' : 'warning'}>
          {game.status === 'waiting' ? 'Odottaa' :
           game.status === 'active' ? 'Käynnissä' :
           'Päättynyt'}
        </Badge>
      </div>

      {/* Latest Ball Card */}
      <Card className="mb-3 shadow-sm">
        <Card.Body className="text-center py-3">
          <small className="text-muted d-block mb-2">Viimeisin pallo</small>
          <h2 className="mb-2 text-primary fw-bold">
            {latestBall || '-'}
          </h2>
          <small className="text-muted">
            {game.calledBalls?.length || 0} / 75 palloa arvottu
          </small>
        </Card.Body>
      </Card>

      {/* Swipeable Bingo Card */}
      <div
        {...swipeHandlers}
        className="mb-3"
        style={{
          overflow: 'hidden',
          width: '100%',
          position: 'relative'
        }}
      >
        <div
          className={`card-transition ${isTransitioning ? 'transitioning' : ''}`}
          style={{
            width: '100%'
          }}
          key={currentCard.id}
        >
          <BingoCard
            card={currentCard}
            calledBalls={game.calledBalls || []}
            centerFree={game.centerFree}
            autoMark={game.autoMark !== false}
          />
        </div>
      </div>

      {/* Card Navigation */}
      {playerCards.length > 1 && (
        <>
          <Alert variant="light" className="text-center py-2 mb-3">
            <small>👈 Pyyhkäise vaihtaaksesi korttia 👉</small>
          </Alert>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Button
              variant="outline-primary"
              onClick={previousCard}
              disabled={currentCardIndex === 0}
            >
              ← Edellinen
            </Button>
            <Badge bg="secondary" className="px-3 py-2">
              {currentCardIndex + 1} / {playerCards.length}
            </Badge>
            <Button
              variant="outline-primary"
              onClick={nextCard}
              disabled={currentCardIndex === playerCards.length - 1}
            >
              Seuraava →
            </Button>
          </div>
        </>
      )}

      {/* QR Code and Card ID */}
      <Card className="shadow-sm">
        <Card.Body className="text-center">
          <Card.Title className="h5 mb-3">
            Ruudukon tunniste: <Badge bg="dark">{currentCard.id}</Badge>
          </Card.Title>

          <div className="bg-white p-3 rounded d-inline-block mb-3">
            <QRCodeSVG
              value={currentCard.id}
              size={180}
              level="M"
              includeMargin={true}
            />
          </div>

          <Alert variant="success" className="mb-0">
            <strong><QrCodeScan size={20} /> BINGO?</strong><br />
            Näytä QR-koodi tai kerro tunniste pitäjälle!
          </Alert>
        </Card.Body>
      </Card>
    </Container>
    </div>
  );
};

export default PlayGame;
