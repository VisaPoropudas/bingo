import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

// Generate a star image as base64
const generateStarImage = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');

  // Draw a filled star
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  const centerX = 50;
  const centerY = 50;
  const outerRadius = 40;
  const innerRadius = 18;
  const points = 5;

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fill();

  return canvas.toDataURL('image/png');
};

const A4_WIDTH_LANDSCAPE = 297; // mm (landscape)
const A4_HEIGHT_LANDSCAPE = 210; // mm (landscape)

export const generateBingoCardsPDF = async (cards, cardsPerPage = 2, gameName = 'BINGO') => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  let cardCount = 0;

  for (let i = 0; i < cards.length; i += cardsPerPage) {
    if (i > 0) {
      doc.addPage();
    }

    const pageCards = cards.slice(i, i + cardsPerPage);

    for (let j = 0; j < pageCards.length; j++) {
      await drawBingoCard(doc, pageCards[j], j, cardsPerPage, gameName);
    }
  }

  return doc;
};

const drawBingoCard = async (doc, card, position, cardsPerPage, gameName) => {
  const margin = 8;
  const cardWidth = (A4_WIDTH_LANDSCAPE - (margin * (cardsPerPage + 1))) / cardsPerPage;
  const cardHeight = A4_HEIGHT_LANDSCAPE - (2 * margin);

  const x = margin + (position * (cardWidth + margin));
  const y = margin;

  // Draw border
  doc.setDrawColor(100);
  doc.setLineWidth(0.5);
  doc.rect(x, y, cardWidth, cardHeight);

  // Game Name
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(gameName, x + cardWidth / 2, y + 7, { align: 'center' });

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('BINGO', x + cardWidth / 2, y + 13, { align: 'center' });

  // Card ID
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Kortti: ${card.id}`, x + cardWidth / 2, y + 19, { align: 'center' });

  // Calculate grid dimensions
  const gridStartY = y + 22;
  const availableHeight = cardHeight - 30; // Leave space for title and footer
  const cellSize = Math.min(
    (cardWidth - 20) / 5,
    (availableHeight - 25) / 5  // 25mm for QR code at bottom
  );
  const gridWidth = cellSize * 5;
  const gridHeight = cellSize * 5;
  const gridStartX = x + (cardWidth - gridWidth) / 2;

  // Draw BINGO header
  const headerHeight = 7;
  const letters = ['B', 'I', 'N', 'G', 'O'];

  doc.setFillColor(30, 58, 95); // Navy blue #1e3a5f
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');

  for (let i = 0; i < letters.length; i++) {
    const cellX = gridStartX + (i * cellSize);
    doc.setFillColor(30, 58, 95); // Consistent navy blue
    doc.rect(cellX, gridStartY, cellSize, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(letters[i], cellX + cellSize / 2, gridStartY + 6, { align: 'center' });
  }

  // Organize cells by row
  const gridCells = [];
  for (let row = 0; row < 5; row++) {
    gridCells[row] = card.cells.filter(cell => cell.row === row);
  }

  // Draw grid cells
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const numberFontSize = Math.max(14, Math.min(26, cellSize / 4));
  doc.setFontSize(numberFontSize);

  for (let rowIndex = 0; rowIndex < gridCells.length; rowIndex++) {
    const row = gridCells[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cell = row[colIndex];
      const cellX = gridStartX + (colIndex * cellSize);
      const cellY = gridStartY + headerHeight + (rowIndex * cellSize);

      // Draw cell border
      doc.setDrawColor(150);
      doc.setLineWidth(0.2);
      doc.rect(cellX, cellY, cellSize, cellSize);

      // Fill and draw free space
      if (cell.isFreeSpace) {
        doc.setFillColor(218, 165, 32); // Gold #DAA520
        doc.rect(cellX, cellY, cellSize, cellSize, 'F');

        // Draw star image
        const starImage = generateStarImage();
        const starSize = cellSize * 0.6;
        doc.addImage(starImage, 'PNG', cellX + (cellSize - starSize) / 2, cellY + (cellSize - starSize) / 2, starSize, starSize);
      } else {
        // Draw number
        doc.text(
          cell.number.toString(),
          cellX + cellSize / 2,
          cellY + cellSize / 2 + 1.5,
          { align: 'center' }
        );
      }
    }
  }

  // Generate and add QR code below the grid
  const qrSize = Math.min(30, cardWidth - 20);
  const qrX = x + (cardWidth - qrSize) / 2;
  const qrY = gridStartY + headerHeight + gridHeight + 5;

  try {
    const qrDataUrl = await QRCode.toDataURL(card.id, {
      width: 256,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    // QR code label
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('Skannaa tarkistukseen', x + cardWidth / 2, qrY + qrSize + 4, { align: 'center' });
  } catch (error) {
    console.error('Error generating QR code:', error);
  }
};

export const downloadPDF = (doc, filename = 'bingo-cards.pdf') => {
  doc.save(filename);
};
