'use strict';

// Keep these values larger than the button width and title height in style.css
const X_BUFFER_PERCENT = 20;
const Y_BUFFER_PX = 50;

const CANVAS = {
  FOREGROUND: 'FOREGROUND',
  BACKGROUND: 'BACKGROUND',
  INFO: 'INFO',
};

// Colors extracted from the Crayola Color list at:
// https://www.w3schools.com/colors/colors_crayola.asp
const COLORS = {
  1: '#D9D6CF', // Timberwolf
  2: '#FFCBA4', // Peach
  3: '#FF9980', // Vivid Tangerine
  4: '#D92121', // Maximum Red
  5: '#FF681F', // Red-Orange
  6: '#FFD12A', // Banana
  7: '#5E8C31', // Maximum Green
  8: '#2243B6', // Denim Blue
  9: '#7070CC', // Celestial Blue
  10: '#733380', // Maximum Purple
};

const DEFAULT_COLOR = '#C39953'; // Aztec Gold

// Procedurally generated Tetris board.
//
// Will draw the largest possible tetris board with the provided number of columns and rows
// (of perfect squares) that fits within the provided canvases.
//
// Canvases are separated into `background` and `foreground`. Generally speaking, only game
// pieces should be drawn to the foreground canvas. The background should, more or less, be
// static from start to finish.
class BoardPainter {
  constructor(columns, rows, backgroundCanvas, foregroundCanvas, infoCanvas) {
    this.columns = columns;
    this.rows = rows;

    this.backgroundCanvas = backgroundCanvas;
    this.foregroundCanvas = foregroundCanvas;
    this.infoCanvas = infoCanvas;

    this.bgctx = this.backgroundCanvas.getContext('2d');
    this.fgctx = this.foregroundCanvas.getContext('2d');
    this.infoctx = this.infoCanvas.getContext('2d');

    this.initialize();
  }

  initialize() {
    this.resizeCanvasToFillWindow(CANVAS.FOREGROUND);
    this.resizeCanvasToFillWindow(CANVAS.BACKGROUND);
    this.resizeCanvasToFillWindow(CANVAS.INFO);

    this.localizeBoard(CANVAS.FOREGROUND);

    this.drawGrid(CANVAS.BACKGROUND);
  }

  resizeCanvasToFillWindow(canvasName) {
    const canvas = this.canvas(canvasName);
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }

  // I originally build localizeBoard to center the tetris board in a `<canvas>` that filled
  // the entire window. While technically the `<canvas>` still fills the client window, there's
  // a bunch of other elements that limit the space where it makes sense to paint the game board.
  //
  // ... So in other words, the canvas should just be resized and positioned using CSS. Ah well.
  localizeBoard(canvasName) {
    const canvas = this.canvas(canvasName);

    const x_buffer_px = canvas.parentElement.clientWidth * (X_BUFFER_PERCENT / 100);

    const maxWidth = (canvas.width - (x_buffer_px * 2)) / this.columns;
    const maxHeight = (canvas.height - (Y_BUFFER_PX * 2)) / this.rows;

    if (maxHeight < maxWidth) {
      this.squareSize = maxHeight;

      this.boardX = (canvas.width - (this.squareSize * this.columns)) / 2.0;
      this.boardY = Y_BUFFER_PX;
    } else {
      this.squareSize = maxWidth;

      this.boardX = x_buffer_px;
      this.boardY = (canvas.height - (this.squareSize * this.rows)) / 2.0;
    }
  }

  boardToWorld(point) {
    return {
      x: this.boardX + (point.x * this.squareSize),
      y: this.boardY + (point.y * this.squareSize)
    };
  }

  pixelToWorldRect(pixel) {
    let rect = this.boardToWorld(pixel);

    rect.width = this.squareSize;
    rect.height = this.squareSize;

    return rect;
  }

  drawGrid() {
    for (let row = 0; row <= this.rows; row++) {
      const start = this.boardToWorld({ x: 0, y: row });
      const end = this.boardToWorld({ x: this.columns, y: row });

      this.line(start, end, CANVAS.BACKGROUND);
    }

    for (let column = 0; column <= this.columns; column++) {
      const start = this.boardToWorld({ x: column, y: 0 });
      const end = this.boardToWorld({ x: column, y: this.rows });

      this.line(start, end, CANVAS.BACKGROUND);
    }
  }

  line(start, end, canvasName = CANVAS.FOREGROUND) {
    const ctx = this.context(canvasName);

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  getColor(value) {
    return COLORS[value] || DEFAULT_COLOR;
  }

  forActivePixels(grid, func) {
    const height = grid.length;
    const width = grid[0].length;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!grid[y][x]) {
          continue;
        }

        if(!func(x, y)) {
          return;
        }
      }
    }
  }

  erasePixels(grid, startX, startY, canvasName = CANVAS.FOREGROUND) {
    const ctx = this.context(canvasName);

    this.forActivePixels(grid, (pixelX, pixelY) => {
      const rect = this.pixelToWorldRect({ x: startX + pixelX, y: startY + pixelY });
      ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
      return true;
    });
  }

  eraseAllPixels(canvasName = CANVAS.FOREGROUND) {
    const ctx = this.context(canvasName);

    for (let pixelY = 0; pixelY < this.rows; pixelY++) {
      for (let pixelX = 0; pixelX < this.columns; pixelX++) {
        const rect = this.pixelToWorldRect({ x: pixelX, y: pixelY });
        ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
      }
    }
  }

  paintPixels(grid, startX, startY, canvasName = CANVAS.FOREGROUND) {
    const ctx = this.context(canvasName);

    this.forActivePixels(grid, (pixelX, pixelY) => {
      const rect = this.pixelToWorldRect({ x: startX + pixelX, y: startY + pixelY });
      ctx.fillStyle = this.getColor(grid[pixelY][pixelX]);
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      return true;
    });
  }

  erasePiece(piece) {
    this.erasePixels(piece.pixels, piece.x, piece.y, CANVAS.FOREGROUND);
  }

  paintPiece(piece) {
    this.paintPixels(piece.pixels, piece.x, piece.y, CANVAS.FOREGROUND);
  }

  eraseBoard(board) {
    this.erasePixels(board, 0, 0, CANVAS.FOREGROUND);
  }

  paintBoard(board) {
    this.paintPixels(board, 0, 0, CANVAS.FOREGROUND);
  }

  canvas(name) {
    if (name === CANVAS.FOREGROUND) {
      return this.foregroundCanvas;
    } else if (name === CANVAS.BACKGROUND) {
      return this.backgroundCanvas;
    } else if (name === CANVAS.INFO) {
      return this.infoCanvas;
    }

    throw Error(`No canvas named ${name}`);
  }

  context(name) {
    if (name === CANVAS.FOREGROUND) {
      return this.fgctx;
    } else if (name === CANVAS.BACKGROUND) {
      return this.bgctx;
    } else if (name === CANVAS.INFO) {
      return this.infoctx;
    }

    throw Error(`No context for canvas named ${name}`);
  }
};

module.exports = BoardPainter;
