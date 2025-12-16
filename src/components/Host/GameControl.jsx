import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { drawBall, checkWin } from '../../utils/bingoUtils';
import { Scanner } from '@yudiel/react-qr-scanner';
import { generateBingoCardsPDF, downloadPDF } from '../../utils/pdfGenerator';
import './Host.css';

const GameControl = ({ gameId }) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentBall, setCurrentBall] = useState(null);
  const [checkCardId, setCheckCardId] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState(2);
  const [printLoading, setPrintLoading] = useState(false);

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

  const handleUpdateRequiredLines = async (newValue) => {
    try {
      await updateDoc(doc(db, 'games', gameId), {
        requiredLines: parseInt(newValue)
      });
      await loadGame();
    } catch (error) {
      console.error('Error updating required lines:', error);
      alert('Linjojen määrän päivitys epäonnistui');
    }
  };

  const handleCheckCard = async (cardIdToCheck = null) => {
    const cardId = cardIdToCheck || checkCardId;

    if (!cardId.trim()) {
      alert('Syötä ruudukon tunniste');
      return;
    }

    try {
      // Hae ruudukko
      let cardDoc = await getDoc(doc(db, 'games', gameId, 'cards', cardId));

      // Jos ei löydy, yritä etsiä kaikista korteista ID:n perusteella
      if (!cardDoc.exists()) {
        console.log(`Card ${cardId} not found directly, searching all cards...`);
        const cardsRef = collection(db, 'games', gameId, 'cards');
        const cardsSnapshot = await getDocs(cardsRef);

        let foundCard = null;
        cardsSnapshot.forEach((doc) => {
          if (doc.id === cardId || doc.data().id === cardId) {
            foundCard = { id: doc.id, data: doc.data() };
          }
        });

        if (foundCard) {
          console.log(`Found card with ID: ${foundCard.id}`);
          const result = checkWin(
            foundCard.data,
            game.calledBalls || [],
            game.winConditions,
            game.centerFree,
            game.requiredLines || 1
          );

          setCheckResult({
            cardId: cardId,
            ...result
          });

          setShowScanner(false);
          return;
        }

        setCheckResult({ error: `Ruudukkoa '${cardId}' ei löytynyt tästä pelistä` });
        return;
      }

      const card = cardDoc.data();

      // Tarkista voitto
      const result = checkWin(
        card,
        game.calledBalls || [],
        game.winConditions,
        game.centerFree,
        game.requiredLines || 1
      );

      setCheckResult({
        cardId: cardId,
        ...result
      });

      // Sulje skanneri jos se oli auki
      setShowScanner(false);
    } catch (error) {
      console.error('Error checking card:', error);
      setCheckResult({ error: 'Tarkistus epäonnistui: ' + error.message });
    }
  };

  const handleQRScan = (result) => {
    if (result && result.length > 0) {
      const scannedText = result[0].rawValue;
      setCheckCardId(scannedText);
      handleCheckCard(scannedText);
    }
  };

  const handlePrintCards = async () => {
    setPrintLoading(true);
    try {
      // Fetch all cards for this game
      const cardsRef = collection(db, 'games', gameId, 'cards');
      const cardsSnapshot = await getDocs(cardsRef);

      if (cardsSnapshot.empty) {
        alert('Ei kortteja tulostettavaksi');
        setPrintLoading(false);
        return;
      }

      const cards = cardsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`Generating PDF for ${cards.length} cards...`);

      // Generate PDF
      const pdf = await generateBingoCardsPDF(cards, cardsPerPage, game.name);

      // Download PDF
      const filename = `${game.name.replace(/\s+/g, '-')}-kortit.pdf`;
      downloadPDF(pdf, filename);

      alert(`PDF ladattu! ${cards.length} korttia, ${cardsPerPage} korttia per sivu.`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('PDF:n luonti epäonnistui: ' + error.message);
    } finally {
      setPrintLoading(false);
      setShowPrintSettings(false);
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
        <div className="stat-card">
          <div className="stat-label">Vaaditut linjat</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={game.requiredLines || 1}
              onChange={(e) => handleUpdateRequiredLines(e.target.value)}
              style={{
                padding: '0.5rem',
                fontSize: '1rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
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

        {/* Manual Input */}
        <div className="mb-3">
          <label htmlFor="cardIdInput" className="form-label">
            Syötä ruudukon tunniste:
          </label>
          <div className="input-group">
            <input
              id="cardIdInput"
              type="text"
              value={checkCardId}
              onChange={(e) => setCheckCardId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckCard()}
              placeholder="esim. AAAAB tai PmqRpt06sbMQ241HAd9Z-3"
              className="form-control"
            />
            <button
              className="btn btn-success"
              onClick={() => handleCheckCard()}
              disabled={!checkCardId.trim()}
            >
              ✓ Tarkista
            </button>
          </div>
        </div>

        {/* QR Scanner Button */}
        <div className="mb-3">
          <button
            className={`btn ${showScanner ? 'btn-secondary' : 'btn-primary'} w-100`}
            onClick={() => setShowScanner(!showScanner)}
          >
            {showScanner ? '📷 Sulje kamera' : '📷 Skannaa QR-koodi'}
          </button>
        </div>

        {/* QR Scanner */}
        {showScanner && (
          <div style={{
            marginTop: '1rem',
            background: '#000',
            borderRadius: '8px',
            overflow: 'hidden',
            maxWidth: '500px',
            margin: '0 auto 1rem'
          }}>
            <Scanner
              onScan={handleQRScan}
              onError={(error) => console.error('QR Scanner error:', error)}
              constraints={{
                facingMode: 'environment'
              }}
              styles={{
                container: {
                  width: '100%'
                }
              }}
            />
            <div className="alert alert-info mt-2 mb-0" style={{ fontSize: '0.9rem' }}>
              Osoita kamera pelaajan QR-koodiin
            </div>
          </div>
        )}

        {checkResult && (
          <div className={`check-result ${checkResult.hasWin ? 'win' : 'no-win'}`}>
            {checkResult.error ? (
              <p className="error">{checkResult.error}</p>
            ) : checkResult.hasWin ? (
              <>
                <h4>🎉 Visan BINGO!</h4>
                <p>Ruudukko: {checkResult.cardId}</p>
                <p>Linjoja yhteensä: {checkResult.lineCount}</p>
                <p>Voittolinjat:</p>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  {checkResult.lines?.map((line, idx) => (
                    <li key={idx}>
                      {line.type === 'horizontal' ? `Vaakarivi ${line.index + 1}` :
                       line.type === 'vertical' ? `Pystyrivi ${line.index + 1}` :
                       line.type === 'diagonal' ? `Diagonaali ${line.index}` :
                       line.type}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h4>Ei voittoa</h4>
                <p>Ruudukko {checkResult.cardId} ei ole vielä voittava.</p>
                {checkResult.lineCount > 0 && (
                  <p style={{ marginTop: '0.5rem' }}>
                    Täydellisiä linjoja: {checkResult.lineCount} / {game.requiredLines || 1}
                  </p>
                )}
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
            <span className="setting-label">Merkintätapa:</span>
            <span className="setting-value">{game.autoMark !== false ? 'Automaattinen' : 'Manuaalinen'}</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">Voittotavat:</span>
            <span className="setting-value">
              {game.winConditions.horizontal && 'Vaakarivit, '}
              {game.winConditions.vertical && 'Pystyrivit, '}
              {game.winConditions.diagonal && 'Diagonaalit, '}
              {game.winConditions.corners && 'Kulmat, '}
              {game.winConditions.fullCard && 'Koko ruudukko'}
            </span>
          </div>
          <div className="setting-item">
            <span className="setting-label">Ruudukoita luotu:</span>
            <span className="setting-value">{game.maxCards}</span>
          </div>
        </div>

        {/* Print Cards Section */}
        <div className="print-cards-section" style={{ marginTop: '2rem' }}>
          <h4>📄 Tulosta paperikortit</h4>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            Luo PDF-tiedosto pelikorteista tulostusta varten. Jokainen kortti sisältää QR-koodin tarkistusta varten.
          </p>

          {!showPrintSettings ? (
            <button
              className="btn btn-primary"
              onClick={() => setShowPrintSettings(true)}
              style={{ marginBottom: '1rem' }}
            >
              🖨️ Tulosta kortit
            </button>
          ) : (
            <div className="print-settings-panel" style={{
              background: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="cardsPerPage" className="form-label">
                  Kortteja per sivu (A4):
                </label>
                <select
                  id="cardsPerPage"
                  value={cardsPerPage}
                  onChange={(e) => setCardsPerPage(parseInt(e.target.value))}
                  className="form-control"
                  style={{ maxWidth: '200px' }}
                >
                  <option value={1}>1 kortti per sivu (iso)</option>
                  <option value={2}>2 korttia per sivu (keskikokoinen)</option>
                  <option value={3}>3 korttia per sivu (pieni)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-success"
                  onClick={handlePrintCards}
                  disabled={printLoading}
                >
                  {printLoading ? '⏳ Luodaan PDF...' : '✓ Luo PDF'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowPrintSettings(false)}
                  disabled={printLoading}
                >
                  Peruuta
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '1rem', marginBottom: 0 }}>
                💡 PDF sisältää kaikki {game.maxCards} pelissä luotua korttia
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameControl;
