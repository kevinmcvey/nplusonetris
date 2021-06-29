'use strict';

const TITLES = {
  1: 'Monotris',
  2: 'Ditris',
  3: 'Tritris',
  4: 'Tetris',
  5: 'Pentris',
  6: 'Hextris',
  7: 'Heptris',
  8: 'Octris',
  9: 'Enneatris',
  10: 'Dectris',
  11: 'Undectris',
  12: 'Dodectris',
  13: 'Tridectris',
  14: 'Tetradectris',
  15: 'Pentadectris',
  16: 'Hexadectris',
  17: 'Heptadectris',
  18: 'Octadectris',
  19: 'Enneadectris',
};

class Feedback {
  constructor(titleElement, scoreElement) {
    this.titleElement = titleElement;
    this.scoreElement = scoreElement;
  }

  setScore(score) {
    this.scoreElement.innerHTML = `Score: ${score}`;
  }

  setTitle(rank) {
    const title = TITLES[rank] || `${rank}-tris`;
    this.titleElement.innerHTML = title;
  }

  gameOver() {
    this.scoreElement.innerHTML += ' GAME OVER';
  }
};

module.exports = Feedback;
