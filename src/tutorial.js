'use strict';

const TUTORIAL_MESSAGE_HOLD_MS = [2000, 3000, 4000, 5000, 3000];

const DivButton = require('./divbutton');

class Tutorial {
  constructor(htmlElements, callback) {
    this.hasPlayed = false;

    this.wrapper = htmlElements.tutorialWrapper;
    this.textElements = htmlElements.tutorialText;

    this.skipButton = this.registerSkipButton(htmlElements.tutorialSkipButton);
    this.processIds = [];

    this.callback = callback;
  }

  registerSkipButton(htmlElement) {
    return new DivButton(
      htmlElement,
      (event, divButton) => {
        divButton.htmlElement.classList.add('pressed');
      },
      (event, divButton) => {
        divButton.htmlElement.classList.remove('pressed');
        this.skipTutorial();
      }
    );
  }

  play() {
    this.wrapper.classList.remove('hidden');

    let totalTimeMs = 0;

    for (let childId = 0; childId < this.textElements.children.length; childId++) {
      const processId = setTimeout(() => {
        this.textElements.children[childId].classList.remove('hidden');
      }, totalTimeMs);

      totalTimeMs += TUTORIAL_MESSAGE_HOLD_MS[childId];

      this.processIds.push(processId);
    }

    this.processIds.push(setTimeout(() => { this.complete(); }, totalTimeMs));
  }

  skipTutorial() {
    for (const processId of this.processIds) {
      clearTimeout(processId);
    }

    this.complete();
  }

  complete() {
    this.wrapper.classList.add('hidden');
    this.hasPlayed = true;
    this.callback();
  }
};

module.exports = Tutorial;
