'use strict';

// Keep these values larger than the button width and title height in style.css
const X_BUFFER_PERCENT = 20;
const Y_PADDING = 50;

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
    this.resizeCanvasToFillParent(CANVAS.FOREGROUND);
    this.resizeCanvasToFillParent(CANVAS.BACKGROUND);
    this.resizeCanvasToFillParent(CANVAS.INFO);

    this.localizeBoard();


    this.drawGrid(CANVAS.BACKGROUND);
  }

  resizeCanvasToFillParent(canvasName) {
    const canvas = this.canvas(canvasName);
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }

  // I originally build localizeBoard to center the tetris board in a `<canvas>` that filled
  // the entire window. While technically the `<canvas>` still fills the client window, there's
  // a bunch of other elements that limit the space where it makes sense to paint the game board.
  //
  // ... So in other words, the canvas should just be resized and positioned using CSS. Ah well.
  localizeBoard() {
    const canvas = this.canvas(CANVAS.FOREGROUND);

    const x_padding = canvas.parentElement.clientWidth * (X_BUFFER_PERCENT / 100);

    const squareWidth = (canvas.width - (x_padding * 2)) / this.columns;
    const squareHeight = (canvas.height - (Y_PADDING * 2)) / this.rows;

    const board = {};

    if (squareHeight < squareWidth) {
      this.squareSize = squareHeight;

      this.boardX = (canvas.width - (this.squareSize * this.columns)) / 2.0;
      this.boardY = Y_PADDING;
    } else {
      this.squareSize = squareWidth;

      this.boardX = x_padding;
      this.boardY = (canvas.height - (this.squareSize * this.rows)) / 2.0;
    }

  }

  boardToWorld(point) {
    return {
      x: this.boardX + (point.x * this.squareSize),
      y: this.boardY + (point.y * this.squareSize)
    };
  }

  infoBoardToWorld(dimensions, pixel) {
    const canvas = this.canvas(CANVAS.INFO);

    const canvasPaddingX = canvas.parentElement.clientWidth * (X_BUFFER_PERCENT / 100);
    const canvasPaddingY = canvas.parentElement.clientHeight * (X_BUFFER_PERCENT / 100);

    const maxBoardWidth = canvas.parentElement.clientWidth - (canvasPaddingX * 2);
    const maxBoardHeight = canvas.parentElement.clientHeight - (canvasPaddingY * 2);

    const maxSquareWidth = maxBoardWidth / dimensions.width;
    const maxSquareHeight = maxBoardHeight / dimensions.height;

    // Preview squares should be drawn at the smaller of two options:
    //   1. Whatever fits in the canvas
    //   2. Whatever the square size on the main game board is
    //
    // Case 1 is important for high-rank pieces that, at ordinary game size, will cause a draw
    // outside of the canvas.
    //
    // Case 2 is important for low-rank pieces that, when scaled to fit the canvas, appear large
    // and distracting.
    const squareSize = Math.min(maxSquareWidth, maxSquareHeight, this.squareSize);

    const paddingLeft = (canvas.parentElement.clientWidth - (squareSize * dimensions.width)) / 2;
    const paddingTop = (canvas.parentElement.clientHeight - (squareSize * dimensions.height)) / 2;

    return {
      x: paddingLeft + ((pixel.x - dimensions.topLeft.x) * squareSize),
      y: paddingTop + ((pixel.y - dimensions.topLeft.y) * squareSize),
      width: squareSize,
      height: squareSize,
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

  getPieceDimensions(pixels) {
    if (!pixels) {
      return;
    }

    const topLeft = { x: Infinity, y: Infinity };
    const bottomRight = { x: -1, y: -1 };

    this.forActivePixels(pixels, (pixelX, pixelY) => {
      topLeft.x = Math.min(topLeft.x, pixelX);
      topLeft.y = Math.min(topLeft.y, pixelY);
      bottomRight.x = Math.max(bottomRight.x, pixelX);
      bottomRight.y = Math.max(bottomRight.y, pixelY);
      return true;
    });

    const width = (bottomRight.x - topLeft.x) + 1;
    const height = (bottomRight.y - topLeft.y) + 1;

    return { topLeft, bottomRight, width, height };
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
    this.paintPixels(piece.pixels, piece.x, piece.y);
  }

  paintNextPiece(piece) {
    const ctx = this.context(CANVAS.INFO);

    const dimensions = this.getPieceDimensions(piece.pixels);

    this.forActivePixels(piece.pixels, (pixelX, pixelY) => {
      const pixel = { x: pixelX, y: pixelY };

      const rect = this.infoBoardToWorld(dimensions, pixel);
      ctx.fillStyle = this.getColor(piece.pixels[pixelY][pixelX]);
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      return true;
    });
  }

  eraseCanvas(canvasName) {
    const canvas = this.canvas(canvasName);
    const ctx = this.context(canvasName);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  eraseInfoCanvas() {
    this.eraseCanvas(CANVAS.INFO);
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
