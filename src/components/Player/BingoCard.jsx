import { useState } from 'react';
import './Player.css';

const BingoCard = ({ card, calledBalls, centerFree, autoMark, onMarkCell }) => {
  const [manualMarks, setManualMarks] = useState(new Set());

  const isCellMarked = (cell) => {
    if (centerFree && cell.isFreeSpace) return true;

    const ballName = `${cell.column}-${cell.number}`;

    // Automaattinen merkintä
    if (autoMark) {
      return calledBalls.includes(ballName);
    }

    // Manuaalinen merkintä
    return manualMarks.has(ballName);
  };

  const handleCellClick = (cell) => {
    const ballName = `${cell.column}-${cell.number}`;

    if (centerFree && cell.isFreeSpace) {
      return; // Keskiruutu on aina merkitty
    }

    // Jos automaattinen merkintä, näytä vain info
    if (autoMark) {
      if (calledBalls.includes(ballName)) {
        return; // Jo merkitty automaattisesti
      }
      return;
    }

    // Manuaalinen merkintä - pelaaja voi klikata numeroita
    const newMarks = new Set(manualMarks);
    if (newMarks.has(ballName)) {
      // Poista merkintä
      newMarks.delete(ballName);
    } else {
      // Lisää merkintä
      newMarks.add(ballName);
    }
    setManualMarks(newMarks);

    if (onMarkCell) {
      onMarkCell(cell, !manualMarks.has(ballName));
    }
  };

  // Järjestä solut ruudukoksi
  const grid = [];
  for (let row = 0; row < 5; row++) {
    grid[row] = card.cells.filter(cell => cell.row === row);
  }

  return (
    <div className="bingo-card">
      <div className="card-header">
        <h3>Ruudukko #{card.id}</h3>
        {!autoMark && (
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
            Klikkaa numeroita merkitäksesi ne
          </div>
        )}
      </div>

      <div className="bingo-grid">
        {/* Otsikkorivi B-I-N-G-O */}
        <div className="grid-header">
          {['B', 'I', 'N', 'G', 'O'].map(letter => (
            <div key={letter} className="header-cell">
              {letter}
            </div>
          ))}
        </div>

        {/* Numeroruudukko */}
        <div className="grid-body">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="grid-row">
              {row.map((cell, colIndex) => {
                const isMarked = isCellMarked(cell);
                const isFree = centerFree && cell.isFreeSpace;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`grid-cell ${isMarked ? 'marked' : ''} ${isFree ? 'free' : ''} ${!autoMark ? 'clickable' : ''}`}
                    onClick={() => handleCellClick(cell)}
                    style={{
                      cursor: !autoMark && !isFree ? 'pointer' : 'default'
                    }}
                  >
                    {isFree ? '★' : cell.number}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BingoCard;
