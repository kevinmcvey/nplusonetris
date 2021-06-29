'use strict';

const RETRIGGER_DELAY_MS = 250;
const RETRIGGER_INTERVAL_MS = 100;

class DivButton {
  constructor(htmlElement, pressCallback, releaseCallback) {
    this.htmlElement = htmlElement;
    this.isMobile = false;
    this.holdProcess = undefined;

    this.registerButtonEvents(pressCallback, releaseCallback);
  }

  createHoldProcess(callback) {
    if (this.holdProcess) {
      this.clearHoldProcess();
    }

    this.holdProcess = setTimeout(() => {
      this.holdProcess = setInterval(() => {
        callback();
      }, RETRIGGER_INTERVAL_MS);
    }, RETRIGGER_DELAY_MS);
  }

  clearHoldProcess() {
    if (!this.holdProcess) {
      return;
    }

    clearInterval(this.holdProcess);
    clearTimeout(this.holdProcess);
    this.holdProcess = undefined;
  }

  registerButtonEvents(pressCallback, releaseCallback) {
    this.htmlElement.addEventListener('touchstart', (event) => {
      event.preventDefault();

      if (!this.isMobile) {
        this.isMobile = true;
      }

      pressCallback(event, this);
      this.createHoldProcess(() => { pressCallback(event, this); });
    });

    this.htmlElement.addEventListener('touchend', (event) => {
      event.preventDefault();

      if (!this.isMobile) {
        this.isMobile = true;
      }

      this.clearHoldProcess();
      releaseCallback(event, this);
    });

    this.htmlElement.addEventListener('mousedown', (event) => {
      event.preventDefault();

      if (this.isMobile) {
        return;
      }

      pressCallback(event, this);
      this.createHoldProcess(() => { pressCallback(event, this); });
    });

    this.htmlElement.addEventListener('mouseup', (event) => {
      event.preventDefault();

      if (this.isMobile) {
        return;
      }

      this.clearHoldProcess();
      releaseCallback(event, this);
    });
  }
};

module.exports = DivButton;
