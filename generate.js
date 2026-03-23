const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');

// Font registrieren (Datei muss im gleichen Ordner liegen!)
registerFont('./Caveat-Regular.ttf', { family: 'Caveat' });

// ═══════════════════════════════════════════════════════════════════
// 📋 PROJEKT-KONFIGURATION - HIER EINFACH ANPASSEN
// ═══════════════════════════════════════════════════════════════════

const PROJECT_CONFIG = {
  totalDays: 77,
  startDate: '2025-11-17',  // Format: YYYY-MM-DD
  projectName: 'DOCTOR',
  
  // Events: Beliebig viele Meilensteine definieren
  // Nur Events die heute oder in der Zukunft liegen, werden angezeigt
  // Position ist optional - wird automatisch berechnet, wenn nicht angegeben
  // Mögliche Positionen: 'top', 'right', 'bottom', 'left', 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  events: [
    {
      date: '2026-01-23',  // Format: YYYY-MM-DD
      title: 'Bergfest',
      position: 'top-right',
      
      date: '2026-02-23',
      title: 'AZV-Tag',
      position: 'top-left',
    },
    // Weitere Events hier einfügen:
    // { date: '2026-02-15', title: 'Valentinstag-Dreh', position: 'top' },
    // { date: '2026-03-10', title: 'Finale Woche' },  // Automatische Platzierung
  ],
  
  // Ausnahmen: An diesen Wochenendtagen wird gearbeitet
  weekendWorkDays: [
    '2026-05-17',
    // Weitere Daten hier einfügen
  ],
  
  // Ausnahmen: An diesen Wochentagen ist frei
  weekdayOffDays: [
    '2025-12-22',
    '2025-12-23',
    '2025-12-24',
    '2025-12-25',
    '2025-12-26',
    '2025-12-27',
    '2025-12-28',
    '2025-12-29',
    '2025-12-30',
    '2025-12-31',
    '2026-01-01',
    '2026-01-02',
    '2026-01-03',
    '2026-01-04',
    '2026-01-05',
    '2026-01-06',
    '2026-01-19',
    '2026-01-30',
    '2026-02-23',
    // Weitere Daten hier einfügen
  ]
};

// ═══════════════════════════════════════════════════════════════════
// 🎨 DESIGN-KONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const DESIGN = {
  colors: {
    background: '#E8461B',      // Leuchtendes Orange
    backgroundText: '#D63D15',  // Etwas dunkler für DOCTOR im Hintergrund
    pastDays: '#ffffff',
    today: '#C8D41E',           // Grün-Gelb
    futureDays: '#B8320F',      // Dunkleres Orange
    progressBar: '#C8D41E',     // Grün-Gelb
    progressBarBg: '#B8320F',   // Dunkleres Orange
    bergfest: '#C8D41E',        // Grün-Gelb für Event-Linie und Text
    highlighter: '#FF10F0',     // Neon-Pink/Magenta für Textmarker
    text: '#ffffff',
    textSecondary: '#ffffff',
  },
  dots: {
    size: 24,
    spacing: 60,
    verticalOffset: 100,
  },
  bergfest: {
    fontSize: 48,
    lineWidth: 2.5,
    baseLineLength: 300,  // Längere Linie, damit Text außerhalb des Grids ist
    textOffsetX: 20,      // Abstand vom Linienende zum Text
    textOffsetY: 10,      // Vertikaler Abstand für top/bottom Positionen
  },
  event: {
    xColor: '#C8D41E',      // Grün-Gelb für Event-X
    dotColor: '#b8320f',    // Dunkleres Orange für Event-Punkt
  },
  grid: {
    cols: 9,
    rows: 9,
  },
  progressBar: {
    height: 6,
    marginTop: 80,
  },
  text: {
    fontSize: 40,
    marginTop: 70,
  }
};

// ═══════════════════════════════════════════════════════════════════
// 📅 DATUMS-HILFSFUNKTIONEN
// ═══════════════════════════════════════════════════════════════════

function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isWorkDay(date, config) {
  const dateStr = formatDate(date);
  
  if (isWeekend(date)) {
    return config.weekendWorkDays.includes(dateStr);
  } else {
    return !config.weekdayOffDays.includes(dateStr);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🗓️ DREHTAGE BERECHNEN
// ═══════════════════════════════════════════════════════════════════

function calculateShootingDays(config) {
  const startDate = parseDate(config.startDate);
  const shootingDays = [];
  let currentDate = new Date(startDate);
  
  while (shootingDays.length < config.totalDays) {
    if (isWorkDay(currentDate, config)) {
      shootingDays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return shootingDays;
}

function getCurrentDayIndex(shootingDays) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < shootingDays.length; i++) {
    const shootDay = new Date(shootingDays[i]);
    shootDay.setHours(0, 0, 0, 0);
    
    if (shootDay.getTime() === today.getTime()) {
      return i;
    }
    
    if (shootDay > today) {
      return i - 1;
    }
  }
  
  // Projekt ist abgeschlossen - prüfe ob heute NACH dem letzten Drehtag ist
  const lastShootDay = new Date(shootingDays[shootingDays.length - 1]);
  lastShootDay.setHours(0, 0, 0, 0);
  
  if (today > lastShootDay) {
    // Heute ist nach dem letzten Drehtag
    return shootingDays.length; // Index größer als letzter Tag = WRAP
  }
  
  return shootingDays.length - 1;
}

function isTodayAWorkDay(shootingDays) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return shootingDays.some(shootDay => {
    const day = new Date(shootDay);
    day.setHours(0, 0, 0, 0);
    return day.getTime() === today.getTime();
  });
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 EVENT-LOGIK
// ═══════════════════════════════════════════════════════════════════

function findEventIndices(shootingDays, events, coords, gridCols, gridRows, projectConfig) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const eventIndices = [];
  
  events.forEach(event => {
    const eventDate = parseDate(event.date);
    eventDate.setHours(0, 0, 0, 0);
    
    const isToday = eventDate.getTime() === today.getTime();
    
    // Nur Events anzeigen, die heute oder in der Zukunft liegen
    if (eventDate >= today) {
      // Finde den Index des Events in den Shooting Days
      const index = shootingDays.findIndex(shootDay => {
        const day = new Date(shootDay);
        day.setHours(0, 0, 0, 0);
        return day.getTime() === eventDate.getTime();
      });
      
      if (index !== -1) {
        // Event fällt auf einen Arbeitstag
        const position = event.position || calculateAutoPosition(index, coords, gridCols, gridRows);
        
        eventIndices.push({
          index: index,
          title: event.title,
          date: event.date,
          position: position,
          isWorkDay: true,
          isToday: isToday
        });
      } else {
        // Event fällt NICHT auf einen Arbeitstag - prüfe ob es ein freier Tag ist
        if (!isWorkDay(eventDate, projectConfig)) {
          // Finde die benachbarten Arbeitstage
          const neighbors = findNeighboringWorkDays(eventDate, shootingDays);
          
          if (neighbors) {
            const position = event.position || calculateAutoPositionBetween(
              neighbors.beforeIndex, 
              neighbors.afterIndex, 
              coords, 
              gridCols, 
              gridRows
            );
            
            eventIndices.push({
              beforeIndex: neighbors.beforeIndex,
              afterIndex: neighbors.afterIndex,
              title: event.title,
              date: event.date,
              position: position,
              isWorkDay: false,
              isToday: isToday
            });
          }
        }
      }
    }
  });
  
  return eventIndices;
}

function findNeighboringWorkDays(freeDate, shootingDays) {
  let beforeIndex = -1;
  let afterIndex = -1;
  
  // Finde den letzten Arbeitstag VOR dem freien Tag
  for (let i = shootingDays.length - 1; i >= 0; i--) {
    const shootDay = new Date(shootingDays[i]);
    shootDay.setHours(0, 0, 0, 0);
    
    if (shootDay < freeDate) {
      beforeIndex = i;
      break;
    }
  }
  
  // Finde den ersten Arbeitstag NACH dem freien Tag
  for (let i = 0; i < shootingDays.length; i++) {
    const shootDay = new Date(shootingDays[i]);
    shootDay.setHours(0, 0, 0, 0);
    
    if (shootDay > freeDate) {
      afterIndex = i;
      break;
    }
  }
  
  if (beforeIndex !== -1 && afterIndex !== -1) {
    return { beforeIndex, afterIndex };
  }
  
  return null;
}

function calculateAutoPositionBetween(beforeIndex, afterIndex, coords, gridCols, gridRows) {
  // Berechne Position basierend auf dem Mittelpunkt zwischen den beiden Punkten
  const beforeCoord = coords[beforeIndex];
  const afterCoord = coords[afterIndex];
  
  const midX = (beforeCoord.x + afterCoord.x) / 2;
  const midY = (beforeCoord.y + afterCoord.y) / 2;
  
  // Berechne relative Position
  const minX = Math.min(...coords.map(c => c.x));
  const maxX = Math.max(...coords.map(c => c.x));
  const minY = Math.min(...coords.map(c => c.y));
  const maxY = Math.max(...coords.map(c => c.y));
  
  const relX = (midX - minX) / (maxX - minX);
  const relY = (midY - minY) / (maxY - minY);
  
  // Gleiche Logik wie bei normalen Events
  if (relX < 0.25) {
    if (relY < 0.33) return 'top-right';
    if (relY > 0.67) return 'bottom-right';
    return 'right';
  }
  
  if (relX > 0.75) {
    if (relY < 0.33) return 'top-left';
    if (relY > 0.67) return 'bottom-left';
    return 'left';
  }
  
  if (relY < 0.25) {
    return 'bottom';
  }
  
  if (relY > 0.75) {
    return 'top';
  }
  
  return relX < 0.5 ? 'right' : 'left';
}

function calculateAutoPosition(index, coords, gridCols, gridRows) {
  // Finde die Grid-Position des Punktes
  const coord = coords[index];
  
  // Berechne relative Position im Grid (0-1 für x und y)
  const minX = Math.min(...coords.map(c => c.x));
  const maxX = Math.max(...coords.map(c => c.x));
  const minY = Math.min(...coords.map(c => c.y));
  const maxY = Math.max(...coords.map(c => c.y));
  
  const relX = (coord.x - minX) / (maxX - minX);
  const relY = (coord.y - minY) / (maxY - minY);
  
  // Intelligente Positionswahl basierend auf Grid-Position
  // Priorität: Außen > Diagonal
  
  // Linke Kante
  if (relX < 0.25) {
    if (relY < 0.33) return 'top-right';
    if (relY > 0.67) return 'bottom-right';
    return 'right';
  }
  
  // Rechte Kante
  if (relX > 0.75) {
    if (relY < 0.33) return 'top-left';
    if (relY > 0.67) return 'bottom-left';
    return 'left';
  }
  
  // Obere Kante (Mitte)
  if (relY < 0.25) {
    return 'bottom';
  }
  
  // Untere Kante (Mitte)
  if (relY > 0.75) {
    return 'top';
  }
  
  // Zentral - bevorzuge rechts oder links
  return relX < 0.5 ? 'right' : 'left';
}

// ═══════════════════════════════════════════════════════════════════
// 🌀 RECHTECK-SPIRAL-KOORDINATEN (AUSSEN NACH INNEN)
// ═══════════════════════════════════════════════════════════════════

function generateRectangleSpiralCoordinates(totalDots, cols, rows, dotSpacing) {
  const coords = [];
  
  const grid = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      grid.push({
        x: col * dotSpacing,
        y: row * dotSpacing,
        col: col,
        row: row
      });
    }
  }
  
  let left = 0, right = cols - 1;
  let top = 0, bottom = rows - 1;
  
  while (coords.length < totalDots && left <= right && top <= bottom) {
    for (let col = left; col <= right && coords.length < totalDots; col++) {
      const pos = grid.find(p => p.row === top && p.col === col);
      if (pos) coords.push({ x: pos.x, y: pos.y });
    }
    top++;
    
    for (let row = top; row <= bottom && coords.length < totalDots; row++) {
      const pos = grid.find(p => p.row === row && p.col === right);
      if (pos) coords.push({ x: pos.x, y: pos.y });
    }
    right--;
    
    if (top <= bottom) {
      for (let col = right; col >= left && coords.length < totalDots; col--) {
        const pos = grid.find(p => p.row === bottom && p.col === col);
        if (pos) coords.push({ x: pos.x, y: pos.y });
      }
      bottom--;
    }
    
    if (left <= right) {
      for (let row = bottom; row >= top && coords.length < totalDots; row--) {
        const pos = grid.find(p => p.row === row && p.col === left);
        if (pos) coords.push({ x: pos.x, y: pos.y });
      }
      left++;
    }
  }
  
  return coords;
}

// ═══════════════════════════════════════════════════════════════════
// ✖️ EVENT X ZEICHNEN
// ═══════════════════════════════════════════════════════════════════

function drawDDayX(ctx, centerX, centerY, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  
  const offset = size * 0.5;
  
  // Diagonal von links-oben nach rechts-unten
  ctx.beginPath();
  ctx.moveTo(centerX - offset, centerY - offset);
  ctx.lineTo(centerX + offset, centerY + offset);
  ctx.stroke();
  
  // Diagonal von rechts-oben nach links-unten
  ctx.beginPath();
  ctx.moveTo(centerX + offset, centerY - offset);
  ctx.lineTo(centerX - offset, centerY + offset);
  ctx.stroke();
}

// ═══════════════════════════════════════════════════════════════════
// 🏔️ EVENT-LINIE UND TEXT ZEICHNEN
// ═══════════════════════════════════════════════════════════════════

function drawEventAnnotation(ctx, eventX, eventY, title, position, isToday, design) {
  const baseLength = design.bergfest.baseLineLength;
  const textOffsetX = design.bergfest.textOffsetX;
  const textOffsetY = design.bergfest.textOffsetY;
  
  // Farbe für Linie bleibt immer Grün-Gelb
  const lineColor = design.colors.bergfest;
  const textColor = design.colors.bergfest;
  
  // Titel mit Ausrufezeichen wenn heute
  const displayTitle = isToday ? `${title}!!` : title;
  
  let startX, startY, endX, endY, controlX, controlY;
  let textX, textY, textAlign, textBaseline;
  
  // Positionsabhängige Berechnung
  switch(position) {
    case 'right':
      startX = eventX + design.dots.size / 2 + 8;
      startY = eventY;
      endX = startX + baseLength;
      endY = startY;
      controlX = startX + baseLength * 0.5;
      controlY = startY - 8;
      textX = endX + textOffsetX;
      textY = endY;
      textAlign = 'left';
      textBaseline = 'middle';
      break;
      
    case 'left':
      startX = eventX - design.dots.size / 2 - 8;
      startY = eventY;
      endX = startX - baseLength;
      endY = startY;
      controlX = startX - baseLength * 0.5;
      controlY = startY - 8;
      textX = endX - textOffsetX;
      textY = endY;
      textAlign = 'right';
      textBaseline = 'middle';
      break;
      
    case 'top':
      startX = eventX;
      startY = eventY - design.dots.size / 2 - 8;
      endX = startX;
      endY = startY - baseLength;
      controlX = startX + 8;
      controlY = startY - baseLength * 0.5;
      textX = endX;
      textY = endY - textOffsetY;
      textAlign = 'center';
      textBaseline = 'bottom';
      break;
      
    case 'bottom':
      startX = eventX;
      startY = eventY + design.dots.size / 2 + 8;
      endX = startX;
      endY = startY + baseLength;
      controlX = startX + 8;
      controlY = startY + baseLength * 0.5;
      textX = endX;
      textY = endY + textOffsetY;
      textAlign = 'center';
      textBaseline = 'top';
      break;
      
    case 'top-right':
      startX = eventX + design.dots.size / 2 * 0.7;
      startY = eventY - design.dots.size / 2 * 0.7;
      endX = startX + baseLength * 0.7;
      endY = startY - baseLength * 0.7;
      controlX = startX + baseLength * 0.4;
      controlY = startY - baseLength * 0.3;
      textX = endX + textOffsetX * 0.7;
      textY = endY;
      textAlign = 'left';
      textBaseline = 'middle';
      break;
      
    case 'top-left':
      startX = eventX - design.dots.size / 2 * 0.7;
      startY = eventY - design.dots.size / 2 * 0.7;
      endX = startX - baseLength * 0.7;
      endY = startY - baseLength * 0.7;
      controlX = startX - baseLength * 0.4;
      controlY = startY - baseLength * 0.3;
      textX = endX - textOffsetX * 0.7;
      textY = endY;
      textAlign = 'right';
      textBaseline = 'middle';
      break;
      
    case 'bottom-right':
      startX = eventX + design.dots.size / 2 * 0.7;
      startY = eventY + design.dots.size / 2 * 0.7;
      endX = startX + baseLength * 0.7;
      endY = startY + baseLength * 0.7;
      controlX = startX + baseLength * 0.4;
      controlY = startY + baseLength * 0.3;
      textX = endX + textOffsetX * 0.7;
      textY = endY;
      textAlign = 'left';
      textBaseline = 'middle';
      break;
      
    case 'bottom-left':
      startX = eventX - design.dots.size / 2 * 0.7;
      startY = eventY + design.dots.size / 2 * 0.7;
      endX = startX - baseLength * 0.7;
      endY = startY + baseLength * 0.7;
      controlX = startX - baseLength * 0.4;
      controlY = startY + baseLength * 0.3;
      textX = endX - textOffsetX * 0.7;
      textY = endY;
      textAlign = 'right';
      textBaseline = 'middle';
      break;
      
    default: // Fallback auf 'right'
      startX = eventX + design.dots.size / 2 + 8;
      startY = eventY;
      endX = startX + baseLength;
      endY = startY;
      controlX = startX + baseLength * 0.5;
      controlY = startY - 8;
      textX = endX + textOffsetX;
      textY = endY;
      textAlign = 'left';
      textBaseline = 'middle';
  }
  
  // Handgezeichnete, leicht geschwungene Linie
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = design.bergfest.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(controlX, controlY, endX, endY);
  ctx.stroke();
  
  // Handgeschriebener Event-Text ZUERST
  ctx.fillStyle = textColor;
  ctx.font = `${design.bergfest.fontSize}px Caveat`;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;
  
  // Leichter Schatten für bessere Lesbarkeit
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  
  ctx.fillText(displayTitle, textX, textY);
  
  // Schatten zurücksetzen
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  
  // Textmarker-Effekt wenn Event heute ist (ÜBER dem Text!)
  if (isToday) {
    const metrics = ctx.measureText(displayTitle);
    const textWidth = metrics.width;
    const textHeight = design.bergfest.fontSize;
    
    // Textmarker etwas breiter und höher als Text
    let highlightX, highlightWidth;
    
    if (textAlign === 'left') {
      highlightX = textX - 8;
      highlightWidth = textWidth + 16;
    } else if (textAlign === 'right') {
      highlightX = textX - textWidth - 8;
      highlightWidth = textWidth + 16;
    } else { // center
      highlightX = textX - textWidth / 2 - 8;
      highlightWidth = textWidth + 16;
    }
    
    const highlightY = textY - textHeight * 0.5;
    const highlightHeight = textHeight * 0.9;
    
    // Händischer Textmarker mit unebenen Kanten (Bezier-Kurven)
    ctx.fillStyle = design.colors.highlighter;
    ctx.globalAlpha = 0.4; // Etwas transparenter für "über Text"-Look
    
    ctx.beginPath();
    // Oben (leicht wackelig)
    ctx.moveTo(highlightX, highlightY + 2);
    ctx.quadraticCurveTo(
      highlightX + highlightWidth * 0.25, highlightY - 1,
      highlightX + highlightWidth * 0.5, highlightY + 1
    );
    ctx.quadraticCurveTo(
      highlightX + highlightWidth * 0.75, highlightY - 0.5,
      highlightX + highlightWidth, highlightY + 2
    );
    // Rechts
    ctx.lineTo(highlightX + highlightWidth, highlightY + highlightHeight - 2);
    // Unten (leicht wackelig)
    ctx.quadraticCurveTo(
      highlightX + highlightWidth * 0.75, highlightY + highlightHeight + 1,
      highlightX + highlightWidth * 0.5, highlightY + highlightHeight - 1
    );
    ctx.quadraticCurveTo(
      highlightX + highlightWidth * 0.25, highlightY + highlightHeight + 0.5,
      highlightX, highlightY + highlightHeight - 2
    );
    // Links
    ctx.closePath();
    ctx.fill();
    
    ctx.globalAlpha = 1.0; // Zurücksetzen
  }
  
  // Handgezeichnete Unterstreichungen wenn Event heute ist (tiefer!)
  if (isToday) {
    const metrics = ctx.measureText(displayTitle);
    const textWidth = metrics.width;
    
    // Unterstreichungen TIEFER (weiter unten vom Text)
    const underlineY1 = textY + design.bergfest.fontSize * 0.55;
    const underlineY2 = textY + design.bergfest.fontSize * 0.65;
    
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    // Erste Unterstreichung (leicht wackelig)
    ctx.beginPath();
    if (textAlign === 'left') {
      ctx.moveTo(textX - 2, underlineY1);
      ctx.quadraticCurveTo(textX + textWidth * 0.3, underlineY1 + 1, textX + textWidth * 0.6, underlineY1 - 0.5);
      ctx.quadraticCurveTo(textX + textWidth * 0.8, underlineY1, textX + textWidth + 2, underlineY1 + 1);
    } else if (textAlign === 'right') {
      ctx.moveTo(textX - textWidth - 2, underlineY1);
      ctx.quadraticCurveTo(textX - textWidth * 0.7, underlineY1 + 1, textX - textWidth * 0.4, underlineY1 - 0.5);
      ctx.quadraticCurveTo(textX - textWidth * 0.2, underlineY1, textX + 2, underlineY1 + 1);
    } else { // center
      ctx.moveTo(textX - textWidth / 2 - 2, underlineY1);
      ctx.quadraticCurveTo(textX - textWidth * 0.2, underlineY1 + 1, textX, underlineY1 - 0.5);
      ctx.quadraticCurveTo(textX + textWidth * 0.2, underlineY1, textX + textWidth / 2 + 2, underlineY1 + 1);
    }
    ctx.stroke();
    
    // Zweite Unterstreichung (leicht wackelig, etwas anders)
    ctx.beginPath();
    if (textAlign === 'left') {
      ctx.moveTo(textX - 2, underlineY2);
      ctx.quadraticCurveTo(textX + textWidth * 0.25, underlineY2 - 1, textX + textWidth * 0.55, underlineY2 + 0.5);
      ctx.quadraticCurveTo(textX + textWidth * 0.85, underlineY2 - 0.5, textX + textWidth + 2, underlineY2);
    } else if (textAlign === 'right') {
      ctx.moveTo(textX - textWidth - 2, underlineY2);
      ctx.quadraticCurveTo(textX - textWidth * 0.75, underlineY2 - 1, textX - textWidth * 0.45, underlineY2 + 0.5);
      ctx.quadraticCurveTo(textX - textWidth * 0.15, underlineY2 - 0.5, textX + 2, underlineY2);
    } else { // center
      ctx.moveTo(textX - textWidth / 2 - 2, underlineY2);
      ctx.quadraticCurveTo(textX - textWidth * 0.25, underlineY2 - 1, textX, underlineY2 + 0.5);
      ctx.quadraticCurveTo(textX + textWidth * 0.25, underlineY2 - 0.5, textX + textWidth / 2 + 2, underlineY2);
    }
    ctx.stroke();
  }
  
  // Schatten zurücksetzen
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

// ═══════════════════════════════════════════════════════════════════
// 🎨 WALLPAPER GENERIEREN
// ═══════════════════════════════════════════════════════════════════

function generateWallpaper(projectConfig, design) {
  console.log(`📅 Berechne Drehtage...`);
  const shootingDays = calculateShootingDays(projectConfig);
  const currentDayIndex = getCurrentDayIndex(shootingDays);
  const todayIsWorkDay = isTodayAWorkDay(shootingDays);
  
  // Letzter Drehtag erreicht wenn currentDayIndex == totalDays - 1
  const lastShootingDay = currentDayIndex >= projectConfig.totalDays - 1;
  // Projekt wrapped (Tag danach) wenn currentDayIndex größer als alle Drehtage
  const projectWrapped = currentDayIndex >= projectConfig.totalDays;
  const completedDays = Math.min(currentDayIndex + 1, projectConfig.totalDays);
  const percentage = Math.round((completedDays / projectConfig.totalDays) * 100);
  
  // Rechteck-Spiral-Koordinaten generieren
  const coords = generateRectangleSpiralCoordinates(
    projectConfig.totalDays,
    design.grid.cols,
    design.grid.rows,
    design.dots.spacing
  );
  
  // Events finden (nur heute oder in der Zukunft) - NACH coords generieren
  const activeEvents = findEventIndices(
    shootingDays, 
    projectConfig.events, 
    coords, 
    design.grid.cols, 
    design.grid.rows,
    projectConfig
  );
  
  console.log(`   Start: ${formatDate(shootingDays[0])}`);
  console.log(`   Ende: ${formatDate(shootingDays[shootingDays.length - 1])}`);
  console.log(`   Fortschritt: ${completedDays}/${projectConfig.totalDays} (${percentage}%)`);
  console.log(`   Heute ist ${todayIsWorkDay ? 'ein' : 'kein'} Arbeitstag`);
  
  if (activeEvents.length > 0) {
    console.log(`   Aktive Events:`);
    activeEvents.forEach(event => {
      if (event.isWorkDay) {
        console.log(`     - ${event.title} am ${event.date} (Tag ${event.index + 1}, Position: ${event.position})`);
      } else {
        console.log(`     - ${event.title} am ${event.date} (Freier Tag zwischen Tag ${event.beforeIndex + 1} und ${event.afterIndex + 1}, Position: ${event.position})`);
      }
    });
  } else {
    console.log(`   Keine aktiven Events`);
  }
  
  const canvas = createCanvas(1170, 2532);
  const ctx = canvas.getContext('2d');
  
  // Hintergrund
  ctx.fillStyle = design.colors.background;
  ctx.fillRect(0, 0, 1170, 2532);
  
  // DOCTOR im Hintergrund
  ctx.save();
  ctx.fillStyle = design.colors.backgroundText;
  ctx.font = 'bold 650px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.globalAlpha = 0.30;
  
  const startY = 350;
  const lineHeight = 550;
  
  ctx.fillText('DOCTOR', 50, startY);
  ctx.fillText('TOR DOC', 100, startY + lineHeight);
  ctx.fillText('CTOR D', 20, startY + lineHeight * 2);
  
  ctx.restore();
  
  // Bounding Box berechnen
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  coords.forEach(({ x, y }) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  
  const gridWidth = maxX - minX;
  const gridHeight = maxY - minY;
  
  // Zentrierung mit verticalOffset
  const offsetX = (1170 - gridWidth) / 2 - minX;
  const offsetY = (2532 - gridHeight) / 2 - minY + design.dots.verticalOffset;
  
  // Alle Punkte komplett wenn am letzten Tag oder danach
  const allDotsComplete = lastShootingDay || projectWrapped;
  
  // Punkte zeichnen
  const eventCoords = []; // Speichern für Event-Linien
  
  coords.forEach(({ x, y }, i) => {
    const centerX = x + offsetX;
    const centerY = y + offsetY;
    const isEvent = activeEvents.some(e => e.isWorkDay && e.index === i);
    const dotSize = design.dots.size;
    
    // Event-Koordinaten speichern (nur für Arbeitstag-Events)
    if (isEvent) {
      const event = activeEvents.find(e => e.isWorkDay && e.index === i);
      eventCoords.push({
        x: centerX,
        y: centerY,
        title: event.title,
        position: event.position,
        isWorkDay: true,
        isToday: event.isToday
      });
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, dotSize / 2, 0, Math.PI * 2);
    
    if (allDotsComplete) {
      // 🎉 LETZTER DREHTAG ODER DANACH - Alle Punkte in Projektfarbe (Grün-Gelb)
      ctx.fillStyle = design.colors.today;
    } else if (i < completedDays - 1) {
      ctx.fillStyle = design.colors.pastDays;
    } else if (i === completedDays - 1 && todayIsWorkDay) {
      // Heute - immer Grün-Gelb, auch wenn Event
      ctx.fillStyle = design.colors.today;
    } else if (i === completedDays - 1 && !todayIsWorkDay) {
      ctx.fillStyle = design.colors.pastDays;
    } else if (isEvent) {
      // Event-Punkt (nur zukünftige Events)
      ctx.fillStyle = design.event.dotColor;
    } else {
      ctx.fillStyle = design.colors.futureDays;
    }
    
    ctx.fill();
    
    // X auf Event-Punkten zeichnen (nur wenn nicht am letzten Tag oder danach)
    if (isEvent && !allDotsComplete) {
      const event = activeEvents.find(e => e.isWorkDay && e.index === i);
      // X immer in Grün-Gelb, auch wenn heute
      drawDDayX(ctx, centerX, centerY, dotSize, design.event.xColor);
    }
  });
  
  // Freie-Tag-Events: Position zwischen zwei Punkten berechnen
  activeEvents.forEach(event => {
    if (!event.isWorkDay) {
      const beforeCoord = coords[event.beforeIndex];
      const afterCoord = coords[event.afterIndex];
      
      const midX = (beforeCoord.x + afterCoord.x) / 2 + offsetX;
      const midY = (beforeCoord.y + afterCoord.y) / 2 + offsetY;
      
      eventCoords.push({
        x: midX,
        y: midY,
        title: event.title,
        position: event.position,
        isWorkDay: false,
        isToday: event.isToday
      });
    }
  });
  
  // Event-Linien und Texte zeichnen (NACH allen Punkten, aber nur wenn nicht am letzten Tag oder danach)
  if (!allDotsComplete) {
    eventCoords.forEach(event => {
      drawEventAnnotation(ctx, event.x, event.y, event.title, event.position, event.isToday, design);
    });
  }
  
  // Fortschrittsbalken
  const barY = offsetY + gridHeight + design.progressBar.marginTop;
  const barWidth = 700;
  const barX = (1170 - barWidth) / 2;
  
  ctx.fillStyle = design.colors.progressBarBg;
  ctx.fillRect(barX, barY, barWidth, design.progressBar.height);
  
  ctx.fillStyle = design.colors.progressBar;
  ctx.fillRect(barX, barY, (barWidth * percentage) / 100, design.progressBar.height);
  
  // Text
  const textY = barY + design.text.marginTop;
  ctx.fillStyle = design.colors.text;
  ctx.font = `bold ${design.text.fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  
  // Text ändert sich einen Tag nach Projektende
  const displayText = projectWrapped 
    ? `${projectConfig.projectName} - IT'S A WRAP!`
    : `${projectConfig.projectName} DT ${completedDays}/${projectConfig.totalDays}`;
  
  ctx.fillText(displayText, 585, textY);
  
  // Als PNG speichern
  const buffer = canvas.toBuffer('image/png');
  const filename = 'shooting-days-wallpaper.png';
  fs.writeFileSync(filename, buffer);
  
  console.log(`\n✅ Wallpaper erstellt: ${filename}`);
  console.log(`   ${percentage}% abgeschlossen`);
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 AUSFÜHREN
// ═══════════════════════════════════════════════════════════════════

generateWallpaper(PROJECT_CONFIG, DESIGN);