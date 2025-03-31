import BaseElement from "./BaseElement.js";

class Pong extends BaseElement {
  constructor() {
    super();
    this.init();
  }

  init() {
    this.innerHTML = "";
    this.setupCanvas();
    this.setupUIElements();
    this.setupGameState();
  }

  setupCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1000;
    this.canvas.height = 700;
    this.ctx = this.canvas.getContext("2d");
  }

  setupUIElements() {
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

  setupGameState() {
    this.playerScore = 0;
    this.opponentScore = 0;
    this.gameOver = false;
    this.keys = {};
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

  handleKeyDown(e) {
    this.keys[e.key.toLowerCase()] = true;
  }

  handleKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
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
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  cleanup() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.gameOver = true;
    if (this.page?.app.stateManager.state.currentGame) {
      this.page?.app.stateManager.updateState("currentGame", false);
    }
  }

  connectedCallback() {
    this.addEventListeners();
  }

  disconnectedCallback() {
    this.cleanup();
  }
}

export default Pong;