'use strict';

class Piece {
  constructor(x, y, pixels, rank) {
    this.x = x;
    this.y = y;
    this.rank = rank;

    // Pieces are always square matrices (width = height) of size <= rank. Originally this choice
    // was intended to make it easy to specify the center of rotation for each piece.
    //
    // In hindsight this decision is pretty goofy. For some pieces you may end up with
    // multiple empty rows and columns that only serve the purpose of speeding up an already fast
    // rotation. This is probably more cumbersome than storing the center of rotation as a point
    // would have been. Oh well, not like this is going to the moon. :)
    //
    // Colors are specified by number in the matrix and are looked up in BoardPainter. An example
    // piece is as follows:
    //
    // [[0, 4, 0],
    //  [4, 4, 4],
    //  [0, 0, 0]]
    //      ^ A tetris 't' block with the point upward. Center of rotation is [1, 1]
    this.pixels = pixels;
  }

  moveLeft() {
    this.x -= 1;
  }

  moveRight() {
    this.x += 1;
  }

  moveDown(amount = 1) {
    this.y += amount;
  }

  rotate() {
    this.pixels = this.rotatePixels(this.pixels);
  }

  cloneLeft() {
    return new Piece(this.x - 1, this.y, this.pixels, this.rank);
  }

  cloneRight() {
    return new Piece(this.x + 1, this.y, this.pixels, this.rank);
  }

  cloneDown() {
    return new Piece(this.x, this.y + 1, this.pixels, this.rank);
  }

  cloneRotated() {
    return new Piece(this.x, this.y, this.rotatePixels(this.pixels), this.rank);
  }

  // NOTE: Only works for square matrices!!
  rotatePixels(pixels) {
    const size = pixels.length;
    let newPixels = []

    for (let y = 0; y < size; y++) {
      let newRow = []

      for (let x = 0; x < size; x++) {
        newRow.push(pixels[(size - 1 - x)][y]);
      }

      newPixels.push(newRow);
    }

    return newPixels;
  }

  forActivePixels(func) {
    const size = this.pixels.length;

    for (let pixelY = 0; pixelY < this.pixels.length; pixelY++) {
      for (let pixelX = 0; pixelX < this.pixels[0].length; pixelX++) {
        if (!this.pixels[pixelY][pixelX]) {
          continue;
        }

        if (!func(pixelX, pixelY)) {
          return false;
        }
      }
    }

    return true;
  }
};

module.exports = Piece;
