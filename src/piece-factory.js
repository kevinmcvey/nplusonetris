'use strict';

const Piece = require('./piece');

const ONES = [[[1]]];

const TWOS = [[[2, 0], [2, 0]]];

const THREES = [[[0, 3, 0], [0, 3, 0], [0, 3, 0]],
                [[3, 3], [3, 0]]];

const FOURS = [[[0, 4, 0, 0], [0, 4, 0, 0], [0, 4, 0, 0], [0, 4, 0, 0]],
               [[0, 4, 4], [0, 4, 0], [0, 4, 0]],
               [[4, 4, 0], [0, 4, 0], [0, 4, 0]],
               [[0, 4, 0], [4, 4, 4], [0, 0, 0]],
               [[0, 0, 0], [0, 4, 4], [4, 4, 0]],
               [[0, 0, 0], [4, 4, 0], [0, 4, 4]],
               [[4, 4], [4, 4]]];

const KNOWN_PIECES = {
  1: ONES,
  2: TWOS,
  3: THREES,
  4: FOURS,
};

// A factory class that generates polyominos of arbitrary rank (number of blocks).
//
// I've experimented with two ways to do this: breadth-first and depth-first. Breadth-first tends
// to generate polyominos that are clumped together. More like the box-tetromino than the
// stick-tetromino. Depth-first tends to generate just the opposite: long meandering polyominos.
//
// At higher ranks, the DFS polyominos are generally more interesting to look at. This makes them
// more fun, in my opinion. Used alone, however, they tend to make the game unwinnable. You a
// board full of empty space between interlocking long pieces. PieceFactory therefore randomly
// switches between DFS and BFS polyominos in an attempt to balance fun and inscrutability. :)
//
// See OEIS Sequence A000988: https://oeis.org/A000988
class PieceFactory {
  constructor(rank, columns) {
    this.startingRank = rank;
    this.rank = rank;
    this.columns = columns;
  }

  reset() {
    this.rank = this.startingRank;
  }

  increaseRank() {
    this.rank++;
  }

  createPiece() {
    let pixels = [];

    if (KNOWN_PIECES[this.rank]) {
      pixels = this.getKnownPiece();
    } else {
      pixels = this.generateUnknownPiece();
    }

    const x = Math.floor((this.columns - pixels.length) / 2);
    const y = 0;

    return new Piece(x, y, pixels, this.rank);
  }

  getKnownPiece() {
    const id = Math.floor(Math.random() * KNOWN_PIECES[this.rank].length);
    return KNOWN_PIECES[this.rank][id];
  }

  generateUnknownPiece() {
    const method = Math.floor(Math.random() * 2);

    if (method === 0) {
      return this.generateUnknownPieceBfs();
    } else {
      return this.generateUnknownPieceDfs();
    }
  }

  generateUnknownPieceBfs() {
    let pixels = [];
    
    // We will grow a polyonimo from the center of a workspace of size (rank * 2) - 1 so that the
    // maximally sized polyomino (a straight line in any cardinal direction of length = rank) will
    // exactly end on the edge of said workspace.
    const workspaceSize = (this.rank * 2) - 1;

    for (let i = 0; i < workspaceSize; i++) {
      pixels.push([]);

      for (let j = 0; j < workspaceSize; j++) {
        pixels[i].push(0);
      }
    }

    let x = this.rank - 1;
    let y = this.rank - 1;

    const options = [[x, y]];

    for (let i = 0; i < this.rank; i++) {
      const nextIndex = Math.floor(Math.random() * options.length);
      const next = options[nextIndex];
      const nextX = next[0];
      const nextY = next[1];

      options.splice(nextIndex, 1); // Delete the option we used

      pixels[nextY][nextX] = this.rank;

      const adjacent = [[nextX - 1, nextY], [nextX, nextY - 1], [nextX + 1, nextY],
                        [nextX, nextY + 1]];

      const available = adjacent.filter((point) => {
        return pixels[point[1]][point[0]] === 0;
      });

      available.forEach((point) => {
        let alreadyPresent = false;

        for (let i = 0; i < options.length; i++) {
          if (point[0] === options[i][0] && point[1] === options[i][1]) {
            alreadyPresent = true;
            break;
          }
        }

        if (!alreadyPresent) {
          options.push(point)
        }
      });
    }

    return this.trim(pixels);
  }

  generateUnknownPieceDfs() {
    let pixels = [];
    const workspaceSize = (this.rank * 2) - 1;
    let success = false;

    while (!success) {
      pixels = [];

      for (let i = 0; i < workspaceSize; i++) {
        pixels.push([]);

        for (let j = 0; j < workspaceSize; j++) {
          pixels[i].push(0);
        }
      }

      let x = this.rank - 1;
      let y = this.rank - 1;

      pixels[y][x] = this.rank;
      let length = 1;

      for (let i = 1; i < this.rank; i++) {
        const options = [[x - 1, y], [x, y - 1], [x + 1, y], [x, y + 1]];
        const available = options.filter((option) => {
          return pixels[option[1]][option[0]] === 0;
        });

        if (available.length === 0) {
          break;
        }

        const choice = available[Math.floor(Math.random() * available.length)];
        pixels[choice[1]][choice[0]] = this.rank;
        x = choice[0];
        y = choice[1];
        length++;
      }

      if (length === this.rank) {
        success = true;
      }
    }

    return this.trim(pixels);
  }

  trim(draft) {
    const pixels = [];

    const xSums = [];
    const ySums = [];

    for (let y = 0; y < draft.length; y++) {
      for (let x = 0; x < draft[0].length; x++) {
        if (xSums[x] === undefined) {
          xSums.push(0);
        }

        if (ySums[y] === undefined) {
          ySums.push(0);
        }

        xSums[x] += draft[y][x];
        ySums[y] += draft[y][x];
      }
    }

    let minX = Infinity;
    let maxX = -1;
    let minY = Infinity;
    let maxY = -1;

    for (let x = 0; x < xSums.length; x++) {
      if (xSums[x] > 0) {
        minX = Math.min(x, minX);
        maxX = Math.max(x, maxX);
      }
    }

    for (let y = 0; y < ySums.length; y++) {
      if (ySums[y] > 0) {
        minY = Math.min(y, minY);
        maxY = Math.max(y, maxY);
      }
    }

    const width = (maxX - minX) + 1;
    const height = (maxY - minY) + 1;
    const size = Math.max(width, height);

    const cX = Math.floor((size - width) / 2);
    const cY = Math.floor((size - height) / 2);

    for (let y = 0; y < size; y++) {
      pixels.push([]);
      for (let x = 0; x < size; x++) {
        pixels[y].push(draft[minY - cY + y][minX - cX + x]);
      }
    }

    return pixels;
  }
};

module.exports = PieceFactory;
