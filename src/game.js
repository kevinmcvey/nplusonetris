'use strict';

const BoardPainter = require('./board-painter');
const DivButton = require('./divbutton');
const Feedback = require('./feedback');
const Piece = require('./piece');
const PieceFactory = require('./piece-factory');
const Tutorial = require('./tutorial');

const GAME_STATE = {
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  TUTORIAL: 'TUTORIAL',
  MENU: 'MENU',
};

const REFRESH_RATE_MS = 1.0 * 1000;

// N+1TRIS
class Game {
  constructor(columns, rows, startingRank, canvases, feedback, controls, tutorial) {
    this.columns = columns;
    this.rows = rows;
    this.state = GAME_STATE.MENU;

    this.isMobile = false;

    this.painter = new BoardPainter(
      columns,
      rows,
      canvases.backgroundCanvas,
      canvases.foregroundCanvas,
      canvases.infoCanvas
    );

    this.piece = undefined;
    this.pieceFactory = new PieceFactory(startingRank, this.columns);

    this.registerControls(controls);
    this.registerResize();

    this.feedback = new Feedback(feedback.title, feedback.score);

    this.tutorial = new Tutorial(tutorial, () => { this.resetAndStartGame(); });

    this.setupFirstGame();
  }

  setupFirstGame() {
    this.reset(/*setupFirstGame*/ true);
  }

  // All of the cleanup we need to do between games. Ugly flag turns off stuff it's redundant
  // to do for the first game setup.
  reset(setupFirstGame = false) {
    // If a previous game occurred, we'll want to clean the canvas
    this.painter.eraseAllPixels();
    this.board = this.createEmptyBoard();

    // Let the first game cycle create the first piece
    this.piece = undefined;
    this.nextPiece = undefined;

    // Return to the starting game rank
    this.pieceFactory.reset();

    // Reset text
    this.score = 0;

    if (setupFirstGame) {
      return;
    }

    this.updateTitle();
    this.updateScoreDisplay();
  }

  createEmptyBoard() {
    let board = [];

    for (let row = 0; row < this.rows; row++) {
      let emptyRow = [];

      for (let column = 0; column < this.columns; column++) {
        emptyRow.push(0);
      }

      board.push(emptyRow);
    }

    return board;
  }

  createButton(htmlElement, pressCallback = undefined, releaseCallback = undefined) {
    return new DivButton(
      htmlElement,
      (event, divButton) => {
        divButton.htmlElement.classList.add('pressed');

        if (!pressCallback) {
          return;
        }

        pressCallback(event, divButton);
      },
      (event, divButton) => {
        divButton.htmlElement.classList.remove('pressed');

        if (!releaseCallback) {
          return;
        }

        releaseCallback(event, divButton);
      }
    );
  }

  registerControls(controls) {
    this.leftButton = this.createButton(controls.leftButton, () => { this.tryToMoveLeft(); });
    this.rightButton = this.createButton(controls.rightButton, () => { this.tryToMoveRight(); });
    this.downButton = this.createButton(controls.downButton, () => { this.tryToMoveDown(); });
    this.rotateButton = this.createButton(controls.rotateButton, () => { this.tryToRotate(); });
    this.dropButton = this.createButton(controls.dropButton, () => { this.tryToDrop(); });

    // Start game on *release* of startButton to avoid button-held events
    this.startButton = this.createButton(controls.startButton, null, () => { this.tryToStart(); });

    document.addEventListener('keydown', (event) => {
      this.handleKeypress(event);
    });
  }

  // Resize erases the canvas. Redraw everything.
  registerResize() {
    window.addEventListener('resize', () => {
      this.painter.initialize();
      this.paintBoard();
      this.paintPiece();
      this.paintNextPiece();
    });
  }

  canControlPiece() {
    return this.state === GAME_STATE.RUNNING && !!this.piece;
  }

  handleKeypress(event) {

    if (this.state === GAME_STATE.RUNNING) {
      if (event.code === 'ArrowLeft') {
        this.tryToMoveLeft();
      }

      if (event.code === 'ArrowRight') {
        this.tryToMoveRight();
      }

      if (event.code === 'ArrowDown') {
        this.tryToMoveDown();
      }

      if (event.code === 'ArrowUp') {
        this.tryToRotate();
      }

      if (event.code === 'Space') {
        this.tryToDrop();
      }
    }

    if (this.state === GAME_STATE.MENU) {
      if (event.code === 'Space') {
        this.tryToStart();
      }
    }

    if (event.code === 'KeyP') {
      if (this.state === GAME_STATE.PAUSED) {
        this.runGame();
      } else if (this.state === GAME_STATE.RUNNING) {
        this.pauseGame();
      }
    }
  }

  tryToMoveLeft() {
    if (!this.pieceCanMoveLeft()) {
      return;
    }

    this.erasePiece();
    this.piece.moveLeft();
    this.paintPiece();
  }

  tryToMoveRight() {
    if (!this.pieceCanMoveRight()) {
      return;
    }

    this.erasePiece();
    this.piece.moveRight();
    this.paintPiece();
  }

  tryToMoveDown() {
    if (!this.pieceCanMoveDown()) {
      return;
    }

    this.erasePiece();
    this.piece.moveDown(/*dropDistance*/ 1);
    this.paintPiece();
  }

  tryToDrop() {
    if (!this.pieceCanMoveDown()) {
      return
    }

    this.erasePiece();
    const dropDistance = this.findDropDistance();
    this.piece.moveDown(dropDistance);
    this.paintPiece();
  }

  tryToRotate() {
    if (!this.pieceCanRotate()) {
      return;
    }

    this.erasePiece();
    this.piece.rotate();
    this.paintPiece();
  }

  updatePiece(guardFunc, updateFunc) {
    if (!guardFunc()) {
      return;
    }

    updateFunc();
  }

  tryToStart() {
    this.hideStartButton();

    if (this.tutorial.hasPlayed) {
      this.resetAndStartGame();
    } else {
      this.playTutorial();
    }
  }

  resetAndStartGame() {
    this.reset();
    this.startGame();
  }


  gameLoop(tFrame) {
    this.stopGameLoop = window.requestAnimationFrame(this.gameLoop.bind(this));


    const nextStepTime = this.lastStepTime + REFRESH_RATE_MS;
    let numTicks = 0;

    if (tFrame > nextStepTime) {
      this.step();
      this.lastStepTime = tFrame;
    }
  }

  startGame() {
    // always spawn a new piece when starting game
    this.spawnPiece();
    this.runGame();
  }

  pauseGame() {
    window.cancelAnimationFrame(this.stopGameLoop)
    document.querySelector('body').classList.add('paused');
    this.state = GAME_STATE.PAUSED;
  }

  stopGame() {
    window.cancelAnimationFrame(this.stopGameLoop)
    this.state = GAME_STATE.MENU;
  }

  runGame() {
    this.state = GAME_STATE.RUNNING;

    document.querySelector('body').classList.remove('paused');

    this.lastStepTime = performance.now();  
    // begin gameLoop - it calls itself using requestAnimationFrame which uses the time from
    // performance.now() - so pass that here to start things off
    this.gameLoop(performance.now());
  }

  // Do we need a new piece?
  //   yes: Can we spawn a new piece?
  //     yes: spawn piece
  //     no: game over.
  //
  // Can piece move down?
  //   yes: Move down
  //   no: Claim ownership. Is a row complete?
  //     yes: Clear row, shift all rows atop it down
  step() {
    if (!this.piece) {
      this.spawnPiece();

      if (!this.isValidPiece(this.piece)) {
        this.gameOver();
      }

      return;
    }

    if (this.pieceCanMoveDown()) {
      this.erasePiece();
      this.piece.moveDown();
      this.paintPiece();
      return;
    }

    this.takeOwnershipOfPiece();

    const filledRows = this.checkForFilledRows();
    if (filledRows.length > 0) {
      this.eraseBoard();
      this.deleteFilledRows(filledRows);
      this.increaseComplexity();
      this.updateTitle();
      this.updateScoreDisplay();
      this.paintBoard();
    }
  }

  spawnPiece() {
    this.piece = Boolean(this.nextPiece) ? this.nextPiece : this.pieceFactory.createPiece();
    this.nextPiece = this.pieceFactory.createPiece();
    this.paintPiece();
    this.paintNextPiece();
  }
  
  /**
   * A valid piece is one where all pixels within the piece
   * can be spawned in bounds and not overlapping another piece
   */
  isValidPiece(piece) {
    let valid = true;

    return piece.forActivePixels((pixelX, pixelY) => {
      const x = piece.x + pixelX;
      const y = piece.y + pixelY;

      if (x < 0 || x >= this.columns) {
        return false;
      }

      if (y < 0 || y >= this.rows) {
        return false;
      }

      if (this.board[y][x]) {
        return false;
      }

      return true;
    });
  }

  // TODO: Cloning isn't ideal. Would be good to avoid deep-copy of pixels every move.
  pieceCanMoveLeft() {
    return this.canControlPiece() && this.isValidPiece(this.piece.cloneLeft());
  }

  pieceCanMoveRight() {
    return this.canControlPiece() && this.isValidPiece(this.piece.cloneRight());
  }

  pieceCanMoveDown() {
    return this.canControlPiece() && this.isValidPiece(this.piece.cloneDown());
  }

  findDropDistance() {
    let dropDistance = 0;
    let piece = this.piece.cloneDown();

    while (this.isValidPiece(piece)) {
      dropDistance++;
      piece = piece.cloneDown();
    }

    return dropDistance;
  }

  pieceCanRotate() {
    return this.canControlPiece() && this.isValidPiece(this.piece.cloneRotated());
  }

  erasePiece() {
    this.painter.erasePiece(this.piece);
  }

  paintPiece() {
    if (!this.piece) {
      return;
    }

    this.painter.paintPiece(this.piece);
  }

  paintNextPiece() {
    if (!this.nextPiece) {
      return;
    }
    this.painter.eraseInfoCanvas();
    this.painter.paintNextPiece(this.nextPiece)
  }

  takeOwnershipOfPiece() {
    this.piece.forActivePixels((pixelX, pixelY) => {
      const x = this.piece.x + pixelX;
      const y = this.piece.y + pixelY;
      this.board[y][x] = this.piece.pixels[pixelY][pixelX];

      return true;
    });

    this.piece = undefined;
  }

  checkForFilledRows() {
    const filledRows = [];

    for (let y = 0; y < this.rows; y++) {
      const numActive = this.board[y].reduce((sum, pixel) => {
        const present = (pixel === 0) ? 0 : 1;
        return sum + present;
      }, 0);

      if (numActive === this.columns) {
        filledRows.push(y);
      }
    }

    return filledRows;
  }

  deleteFilledRows(filledRows) {
    filledRows.forEach((row) => {
      this.deleteRow(row);
      this.score += 1;
    });
  }

  deleteRow(rowId) {
    for (let y = rowId; y > 0; y -= 1) {
      for (let x = 0; x < this.columns; x++) {
        this.board[y][x] = this.board[y - 1][x];
      }
    }

    for (let x = 0; x < this.columns; x++) {
      this.board[0][x] = 0;
    }
  }

  increaseComplexity() {
    this.pieceFactory.increaseRank();

    // The next piece is now of the wrong rank. Clear it so that PieceFactory is forced to
    // generate a new nextPiece on the next game step.
    this.nextPiece = undefined;
  }

  updateScoreDisplay() {
    this.feedback.setScore(this.score);
  }

  updateTitle() {
    this.feedback.setTitle(this.pieceFactory.rank);
  }

  eraseBoard() {
    this.painter.eraseBoard(this.board);
  }

  paintBoard() {
    this.painter.paintBoard(this.board);
  }

  hideStartButton() {
    this.startButton.htmlElement.classList.add('hidden');
    this.startButton.htmlElement.parentElement.classList.add('hidden');
  }

  revealStartButton() {
    this.startButton.htmlElement.parentElement.classList.remove('hidden');
    this.startButton.htmlElement.classList.remove('hidden');
  }

  playTutorial() {
    this.state = GAME_STATE.TUTORIAL;
    this.tutorial.play();
  }

  gameOver() {
    this.stopGame();
    this.feedback.gameOver();
    this.revealStartButton();
  }
};

module.exports = Game;
