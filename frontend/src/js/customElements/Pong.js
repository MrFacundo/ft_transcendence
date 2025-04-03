import BaseElement from "./BaseElement.js";

class Pong extends BaseElement {
  constructor() {
    super();
    this.init();
  }

  init() {
    this.innerHTML = "";
    this.setCanvas();
    this.setRandomBackground();
    this.setUIElements();
    this.setGameState();
  }

  setCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1000;
    this.canvas.height = 700;
    this.ctx = this.canvas.getContext("2d");
  }

  setRandomBackground() {
    const images = [
      "../static/images/mk3-subway-stage.gif",
      "../static/images/mk3-waterfront-stage.gif",
      "../static/images/mk3-the-streets-stage.gif",
    ];
    const randomImage = images[Math.floor(Math.random() * images.length)];
    this.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${randomImage}')`;
  }

  setUIElements() {
    this.scoreboard = this.createElement("scoreboard");
    this.side1Username = this.createElement("side1Username");
    this.side2Username = this.createElement("side2Username");
    this.readyButton = document.createElement("button");
    this.readyButton.id = "readyButton";
    this.readyButton.textContent = "Ready to Play";
    
    this.append(
      this.canvas,
      this.scoreboard,
      this.side1Username,
      this.side2Username,
      this.readyButton
    );
  }

  setGameState() {
    this.playerScore = 0;
    this.opponentScore = 0;
    this.gameOver = false;
  }

  createElement(id) {
    const el = document.createElement("span");
    el.id = id;
    return el;
  }

  updateScoreDisplay() {
    this.scoreboard.textContent = `${this.playerScore} - ${this.opponentScore}`;
  }

  setSideUsernames(side1Username, side2Username) {
    this.side1Username.textContent = side1Username;
    this.side2Username.textContent = side2Username;
  }

  startGame() {
    this.playerScore = this.opponentScore = 0;
    this.updateScoreDisplay();
    this.gameOver = false;
    this.page?.app.stateManager.updateState("currentGame", true);
  }

  endGame() {
    this.cleanup();
    const gameScore = {
      playerScore: this.playerScore,
      opponentScore: this.opponentScore,
    };

    this.dispatchEvent(
      new CustomEvent("gameEnd", {
        detail: gameScore,
        bubbles: true,
        composed: true,
      })
    );
  }

  addEventListeners() {
  }

  cleanup() {
    this.gameOver = true;
    this.page?.app.stateManager.updateState("currentGame", false);
  }

  connectedCallback() {
    this.addEventListeners();
  }

  disconnectedCallback() {
    this.cleanup();
  }
}

export default Pong;