import { useState } from 'react';
import './Player.css';

const BingoCard = ({ card, calledBalls, centerFree, onMarkCell }) => {
  const [selectedCell, setSelectedCell] = useState(null);

  const isCellMarked = (cell) => {
    if (centerFree && cell.isFreeSpace) return true;
    return calledBalls.includes(`${cell.column}-${cell.number}`);
  };

  const handleCellClick = (cell) => {
    const ballName = `${cell.column}-${cell.number}`;

    if (centerFree && cell.isFreeSpace) {
      return; // Keskiruutu on aina merkitty
    }

    if (!calledBalls.includes(ballName)) {
      alert(`Palloa ${ballName} ei ole vielä arvottu!`);
      return;
    }

    setSelectedCell(cell);
    if (onMarkCell) {
      onMarkCell(cell);
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
                    className={`grid-cell ${isMarked ? 'marked' : ''} ${isFree ? 'free' : ''}`}
                    onClick={() => handleCellClick(cell)}
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
