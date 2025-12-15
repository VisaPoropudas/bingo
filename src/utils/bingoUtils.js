// BINGO-ruudukon generointi
export const generateBingoCard = (cardId) => {
  const card = {
    id: cardId,
    cells: []
  };

  // Generoi numerot jokaiseen sarakkeeseen
  const columns = {
    B: getRandomNumbers(1, 15, 5),    // 1-15
    I: getRandomNumbers(16, 30, 5),   // 16-30
    N: getRandomNumbers(31, 45, 5),   // 31-45
    G: getRandomNumbers(46, 60, 5),   // 46-60
    O: getRandomNumbers(61, 75, 5)    // 61-75
  };

  // Luo 5x5 ruudukko
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const columnName = ['B', 'I', 'N', 'G', 'O'][col];
      const number = columns[columnName][row];

      card.cells.push({
        row,
        col,
        column: columnName,
        number,
        marked: false,
        isFreeSpace: row === 2 && col === 2 // Keskimmäinen ruutu
      });
    }
  }

  return card;
};

// Apufunktio satunnaisten numeroiden generointiin
const getRandomNumbers = (min, max, count) => {
  const numbers = [];
  const available = [];

  for (let i = min; i <= max; i++) {
    available.push(i);
  }

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    numbers.push(available[randomIndex]);
    available.splice(randomIndex, 1);
  }

  return numbers;
};

// Tarkista voitto
export const checkWin = (card, calledBalls, winConditions, centerFree) => {
  // Merkitse kaikki kutsutut numerot
  const markedCard = card.cells.map(cell => ({
    ...cell,
    marked: (centerFree && cell.isFreeSpace) ||
            calledBalls.includes(`${cell.column}-${cell.number}`)
  }));

  // Muunna ruudukoksi helpomman käsittelyn vuoksi
  const grid = [];
  for (let row = 0; row < 5; row++) {
    grid[row] = markedCard.filter(cell => cell.row === row);
  }

  const results = {
    hasWin: false,
    winType: null
  };

  // Tarkista vaaka- ja pystyrivit
  if (winConditions.straightLine) {
    // Vaakarivit
    for (let row = 0; row < 5; row++) {
      if (grid[row].every(cell => cell.marked)) {
        results.hasWin = true;
        results.winType = 'horizontal';
        return results;
      }
    }

    // Pystyrivit
    for (let col = 0; col < 5; col++) {
      const column = grid.map(row => row[col]);
      if (column.every(cell => cell.marked)) {
        results.hasWin = true;
        results.winType = 'vertical';
        return results;
      }
    }

    // Diagonaalit
    const diagonal1 = [grid[0][0], grid[1][1], grid[2][2], grid[3][3], grid[4][4]];
    const diagonal2 = [grid[0][4], grid[1][3], grid[2][2], grid[3][1], grid[4][0]];

    if (diagonal1.every(cell => cell.marked)) {
      results.hasWin = true;
      results.winType = 'diagonal';
      return results;
    }

    if (diagonal2.every(cell => cell.marked)) {
      results.hasWin = true;
      results.winType = 'diagonal';
      return results;
    }
  }

  // Tarkista kulmat
  if (winConditions.corners) {
    const corners = [grid[0][0], grid[0][4], grid[4][0], grid[4][4]];
    if (corners.every(cell => cell.marked)) {
      results.hasWin = true;
      results.winType = 'corners';
      return results;
    }
  }

  // Tarkista koko ruudukko
  if (winConditions.fullCard) {
    if (markedCard.every(cell => cell.marked)) {
      results.hasWin = true;
      results.winType = 'fullCard';
      return results;
    }
  }

  return results;
};

// Arvo uusi pallo
export const drawBall = (drawnBalls) => {
  const allBalls = [];

  // Luo kaikki pallot
  for (let i = 1; i <= 15; i++) allBalls.push(`B-${i}`);
  for (let i = 16; i <= 30; i++) allBalls.push(`I-${i}`);
  for (let i = 31; i <= 45; i++) allBalls.push(`N-${i}`);
  for (let i = 46; i <= 60; i++) allBalls.push(`G-${i}`);
  for (let i = 61; i <= 75; i++) allBalls.push(`O-${i}`);

  // Poista jo arvotut pallot
  const availableBalls = allBalls.filter(ball => !drawnBalls.includes(ball));

  if (availableBalls.length === 0) {
    return null; // Kaikki pallot on arvottu
  }

  // Arvo satunnainen pallo
  const randomIndex = Math.floor(Math.random() * availableBalls.length);
  return availableBalls[randomIndex];
};

// Muotoile pallon nimi näyttöä varten
export const formatBallName = (ball) => {
  return ball; // esim. "B-7"
};
