'use strict';

const Game = require('./game');

const GAME_WIDTH = 12;
const GAME_HEIGHT = 24;
const GAME_RANK = 4;

window.onload = () => {
  const backgroundCanvas = document.getElementById('background-canvas');
  const foregroundCanvas = document.getElementById('foreground-canvas');

  const title = document.getElementById('title');
  const score = document.getElementById('score');

  const leftButton = document.getElementById('button-left');
  const rightButton = document.getElementById('button-right');
  const downButton = document.getElementById('button-down');
  const rotateButton = document.getElementById('button-rotate');
  const dropButton = document.getElementById('button-drop');
  const startButton = document.getElementById('button-start');

  const tutorialWrapper = document.getElementById('tutorial-wrapper');
  const tutorialSkipButton = document.getElementById('tutorial');
  const tutorialText = document.getElementById('tutorial-text');

  // If URL contains board parameters, use those instead of the defaults.
  const userParams = new URLSearchParams(window.location.search);
  const width = parseInt(userParams.get('width'), 10) || GAME_WIDTH;
  const height = parseInt(userParams.get('height'), 10) || GAME_HEIGHT;
  const rank = parseInt(userParams.get('rank'), 10) || GAME_RANK;

  const canvases = { backgroundCanvas, foregroundCanvas };
  const feedback = { title, score };
  const controls = { leftButton, rightButton, downButton, rotateButton, dropButton, startButton };
  const tutorial = { tutorialWrapper, tutorialSkipButton, tutorialText };

  const game = new Game(width, height, rank, canvases, feedback, controls, tutorial);
  window.game = game;
};
