import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { drawBall, checkWin } from '../../utils/bingoUtils';
import './Host.css';

const GameControl = ({ gameId }) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentBall, setCurrentBall] = useState(null);
  const [checkCardId, setCheckCardId] = useState('');
  const [checkResult, setCheckResult] = useState(null);

  useEffect(() => {
    loadGame();
    // Realtime-kuuntelu voisi olla parempi, mutta tässä yksinkertaistettu versio
    const interval = setInterval(loadGame, 3000);
    return () => clearInterval(interval);
  }, [gameId]);

  const loadGame = async () => {
    try {
      const gameDoc = await getDoc(doc(db, 'games', gameId));
      if (gameDoc.exists()) {
        setGame({ id: gameDoc.id, ...gameDoc.data() });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading game:', error);
      setLoading(false);
    }
  };

  const handleDrawBall = async () => {
    if (!game) return;

    const newBall = drawBall(game.calledBalls || []);

    if (!newBall) {
      alert('Kaikki pallot on jo arvottu!');
      return;
    }

    try {
      await updateDoc(doc(db, 'games', gameId), {
        calledBalls: arrayUnion(newBall),
        status: 'active'
      });

      setCurrentBall(newBall);
      await loadGame();
    } catch (error) {
      console.error('Error drawing ball:', error);
      alert('Pallon arvonta epäonnistui');
    }
  };

  const handleStartGame = async () => {
    try {
      await updateDoc(doc(db, 'games', gameId), {
        status: 'active'
      });
      await loadGame();
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleEndGame = async () => {
    if (window.confirm('Haluatko varmasti lopettaa pelin?')) {
      try {
        await updateDoc(doc(db, 'games', gameId), {
          status: 'finished'
        });
        await loadGame();
      } catch (error) {
        console.error('Error ending game:', error);
      }
    }
  };

  const handleCheckCard = async () => {
    if (!checkCardId.trim()) {
      alert('Syötä ruudukon tunniste');
      return;
    }

    try {
      // Hae ruudukko
      const cardDoc = await getDoc(doc(db, 'games', gameId, 'cards', checkCardId));

      if (!cardDoc.exists()) {
        setCheckResult({ error: 'Ruudukkoa ei löytynyt' });
        return;
      }

      const card = cardDoc.data();

      // Tarkista voitto
      const result = checkWin(
        card,
        game.calledBalls || [],
        game.winConditions,
        game.centerFree
      );

      setCheckResult({
        cardId: checkCardId,
        ...result
      });
    } catch (error) {
      console.error('Error checking card:', error);
      setCheckResult({ error: 'Tarkistus epäonnistui' });
    }
  };

  if (loading) {
    return <div className="loading">Ladataan peliä...</div>;
  }

  if (!game) {
    return <div className="error">Peliä ei löytynyt</div>;
  }

  const calledBalls = game.calledBalls || [];
  const ballsRemaining = 75 - calledBalls.length;

  return (
    <div className="game-control">
      <div className="game-header">
        <h2>{game.name}</h2>
        <span className={`status-badge status-${game.status}`}>
          {game.status === 'waiting' ? 'Odottaa' : game.status === 'active' ? 'Käynnissä' : 'Päättynyt'}
        </span>
      </div>

      <div className="game-stats">
        <div className="stat-card">
          <div className="stat-label">Arvottuja palloja</div>
          <div className="stat-value">{calledBalls.length} / 75</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Jäljellä</div>
          <div className="stat-value">{ballsRemaining}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Viimeisin pallo</div>
          <div className="stat-value current-ball">
            {currentBall || (calledBalls.length > 0 ? calledBalls[calledBalls.length - 1] : '-')}
          </div>
        </div>
      </div>

      <div className="game-controls">
        {game.status === 'waiting' && (
          <button className="btn btn-primary" onClick={handleStartGame}>
            Aloita peli
          </button>
        )}

        {game.status === 'active' && (
          <>
            <button
              className="btn btn-draw"
              onClick={handleDrawBall}
              disabled={ballsRemaining === 0}
            >
              🎱 Arvo pallo
            </button>
            <button className="btn btn-danger" onClick={handleEndGame}>
              Lopeta peli
            </button>
          </>
        )}
      </div>

      <div className="called-balls-section">
        <h3>Arvotut pallot ({calledBalls.length})</h3>
        <div className="called-balls">
          {calledBalls.map((ball, index) => (
            <div key={index} className="ball-item">
              <span className="ball-number">{index + 1}.</span>
              <span className="ball-name">{ball}</span>
            </div>
          ))}
          {calledBalls.length === 0 && (
            <div className="no-balls">Ei vielä arvottuja palloja</div>
          )}
        </div>
      </div>

      <div className="check-card-section">
        <h3>Tarkista ruudukko</h3>
        <div className="check-card-form">
          <input
            type="text"
            value={checkCardId}
            onChange={(e) => setCheckCardId(e.target.value)}
            placeholder="Syötä ruudukon tunniste"
            className="card-id-input"
          />
          <button className="btn btn-check" onClick={handleCheckCard}>
            Tarkista
          </button>
        </div>

        {checkResult && (
          <div className={`check-result ${checkResult.hasWin ? 'win' : 'no-win'}`}>
            {checkResult.error ? (
              <p className="error">{checkResult.error}</p>
            ) : checkResult.hasWin ? (
              <>
                <h4>🎉 BINGO!</h4>
                <p>Ruudukko: {checkResult.cardId}</p>
                <p>Voittotyyppi: {
                  checkResult.winType === 'horizontal' ? 'Vaakarivi' :
                  checkResult.winType === 'vertical' ? 'Pystyrivi' :
                  checkResult.winType === 'diagonal' ? 'Diagonaali' :
                  checkResult.winType === 'corners' ? 'Kulmat' :
                  checkResult.winType === 'fullCard' ? 'Koko ruudukko' :
                  checkResult.winType
                }</p>
              </>
            ) : (
              <>
                <h4>Ei voittoa</h4>
                <p>Ruudukko {checkResult.cardId} ei ole vielä voittava.</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="game-settings">
        <h3>Pelin asetukset</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <span className="setting-label">Keskiruutu annettu:</span>
            <span className="setting-value">{game.centerFree ? 'Kyllä' : 'Ei'}</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">Voittotavat:</span>
            <span className="setting-value">
              {game.winConditions.straightLine && 'Suora linja, '}
              {game.winConditions.corners && 'Kulmat, '}
              {game.winConditions.fullCard && 'Koko ruudukko'}
            </span>
          </div>
          <div className="setting-item">
            <span className="setting-label">Ruudukoita luotu:</span>
            <span className="setting-value">{game.maxCards}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameControl;
