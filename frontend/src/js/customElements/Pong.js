import BaseElement from "./BaseElement.js";
import { settings } from "../settings.js";
import { getAvatarSrc } from "../utils.js";

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

  setRandomBackground(seed = null) {
    const images = [
      "../static/images/mk3-subway-stage.gif",
      "../static/images/mk3-waterfront-stage.gif",
      "../static/images/mk3-the-streets-stage.gif",
    ];
    let randomIndex;
    if (seed !== null) {
      randomIndex = seed % images.length;
    } else {
      randomIndex = Math.floor(Math.random() * images.length);
    }
    const randomImage = images[randomIndex];
    this.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${randomImage}')`;
  }

  setUIElements() {
    const avatar1 = document.createElement("div");
    avatar1.className = "col-avatar";
    avatar1.innerHTML = `<img id="avatar-1" src="${settings.EMPTY_AVATAR_URL}" alt="Avatar" width="70" height="70">`;

    const avatar2 = document.createElement("div");
    avatar2.className = "col-avatar";
    avatar2.innerHTML = `<img id="avatar-2" src="${settings.EMPTY_AVATAR_URL}" alt="Avatar" width="70" height="70">`;

    this.side1Username = this.createElement("side1Username");
    this.side2Username = this.createElement("side2Username");

    this.userContainer = document.createElement("div");
    this.userContainer.className = "user-container";
    this.userContainer.append(avatar1, this.side1Username, this.side2Username, avatar2);

    this.scoreboard = this.createElement("scoreboard");

    this.readyButton = document.createElement("button");
    this.readyButton.id = "readyButton";
    this.readyButton.textContent = "Ready to Play";

    this.winnerDisplay = this.createElement("game-winner");

    this.append(
      this.canvas,
      this.scoreboard,
      this.userContainer,
      this.readyButton,
      this.winnerDisplay
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

  setAvatars = async (player1, player2) => {
    const { api } = this.page.app;

    const setAvatar = async (id, user) => {
      try {
        const avatarSrc = await getAvatarSrc(user, api.fetchAvatarObjectUrl);
        const avatarElement = this.querySelector(`#${id}`);
        if (avatarElement) {
          avatarElement.src = avatarSrc;
        }
      } catch (error) {
        console.error(`Failed to set avatar for ${id}:`, error);
      }
    };

    await Promise.all([
      setAvatar("avatar-1", player1),
      setAvatar("avatar-2", player2),
    ]);
  };

  startGame() {
    this.playerScore = this.opponentScore = 0;
    this.winnerDisplay.textContent = "";
    this.updateScoreDisplay();
    this.gameOver = false;
    this.page?.app.stateManager.updateState("currentGame", true);
  }

  displayResult(scorePlayer1, scorePlayer2, winnerUsername, status = null) {
    this.playerScore = scorePlayer1;
    this.opponentScore = scorePlayer2;
    this.updateScoreDisplay();

    this.winnerDisplay.textContent = status === "interrupted" ? "Pong interrupted" : `${winnerUsername} wins!`;

    [this.readyButton, this.ball, this.paddels?.left, this.paddels?.right]
      .forEach(el => el?.style && (el.style.display = "none"));
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