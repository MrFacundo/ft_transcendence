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
      "../static/images/mk3-desert-stage.gif",
      "../static/images/mk3-scorpions-lair-stage.gif",
      "../static/images/mk3-the-bank-stage.gif",
      "../static/images/mk3-tree-stage.gif",
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
    const createAvatar = num => {
      const avatar = document.createElement("div");
      avatar.className = "col-avatar";
      avatar.innerHTML = `<img id="avatar-${num}" src="${settings.EMPTY_AVATAR_URL}" alt="Avatar" width="70" height="70">`;
      return avatar;
    };

    const createHealthBar = side => {
      const bar = document.createElement("div");
      bar.id = `${side}HealthBar`;
      const health = document.createElement("div");
      health.className = "health";
      const username = this.createSpanElement(`${side}Username`);
      bar.append(health, username);
      this[`${side}HealthBar`] = bar;
      this[`${side}Health`] = health;
      this[`${side}Username`] = username;
      return bar;
    };

    this.userContainer = document.createElement("div");
    this.userContainer.className = "user-container";
    this.userContainer.append(
      createAvatar(1),
      createHealthBar("side1"),
      createHealthBar("side2"),
      createAvatar(2)
    );

    this.scoreboard = this.createSpanElement("scoreboard");
    this.readyButton = document.createElement("button");
    this.readyButton.id = "readyButton";
    this.readyButton.textContent = "Ready to Play";
    this.winnerDisplay = this.createSpanElement("game-winner");
    this.flawlessVictory = this.createSpanElement("flawless-victory");

    this.append(
      this.canvas,
      this.scoreboard,
      this.userContainer,
      this.readyButton,
      this.winnerDisplay,
      this.flawlessVictory
    );
  }

  setGameState() {
    this.player1Score = 0;
    this.player2Score = 0;
    this.gameOver = false;
  }

  createSpanElement(id) {
    const el = document.createElement("span");
    el.id = id;
    return el;
  }

  updateScoreDisplay() {
    this.scoreboard.textContent = `${this.player1Score} - ${this.player2Score}`;
    this.updateHealthBar();
    if (this.player1Score === 0 && this.player2Score === 0) return;
    this.triggerScreenShake();
  }

  updateHealthBar() {
    const maxScore = 3;
    const side1Health = Math.max(0, (maxScore - this.player2Score) / maxScore * 100);
    const side2Health = Math.max(0, (maxScore - this.player1Score) / maxScore * 100);

    this.side1Health.style.width = `${side1Health}%`;
    this.side2Health.style.width = `${side2Health}%`;
  }

  triggerScreenShake() {
    this.style.animation = "shake 0.3s";
    this.style.animationIterationCount = "1";
    this.addEventListener("animationend", () => {
      this.style.animation = "";
    }, { once: true });
  }


  setSideUsernames(side1Username, side2Username) {
    this.side1Username.textContent = side1Username;
    this.side2Username.textContent = side2Username;
  }

  setAvatars = async (player1, player2) => {
    if (!this.page) return;
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

  startGame(gameId = null, player1 = null, player2 = null) {
    this.player1Score = 0;
    this.player2Score = 0;
    this.updateScoreDisplay();
    this.updateInfoUI(gameId, player1, player2);
    this.winnerDisplay.textContent = "";
    this.flawlessVictory.textContent = "";
    this.gameOver = false;
    this.opponentId = this.page?.app.auth.user.id === player1.id ? player2.id : player1.id;
    this.page?.app.stateManager.updateState("currentGame", true);
    this.readyButton.style.display = "none";
    this.addEventListeners();
  }

  updateInfoUI(gameId = null, player1 = null, player2 = null) {
    this.setRandomBackground(gameId);
    if (player1 && player2) {
      this.setSideUsernames(player1.username, player2.username);
      this.setAvatars(player1, player2);
    }
  }

  displayResult(scorePlayer1, scorePlayer2, winnerUsername, status = null) {
    this.player1Score = scorePlayer1;
    this.player2Score = scorePlayer2;
    this.updateScoreDisplay();

    this.winnerDisplay.textContent = status === "interrupted" ? "Pong interrupted" : `${winnerUsername} wins`;

    if ((this.player1Score === 0 || this.player2Score === 0) && status !== "interrupted") {
      setTimeout(() => this.flawlessVictory.textContent = "Flawless victory", 1000);
    }

    [this.readyButton, this.ball, this.paddels?.left, this.paddels?.right]
      .forEach(el => el?.style && (el.style.display = "none"));
  }

  cleanup() {
    this.gameOver = true;
    this.page?.app.stateManager.updateState("currentGame", false);
  }

  connectedCallback() {
  }

  disconnectedCallback() {
    this.cleanup();
  }
}

export default Pong;