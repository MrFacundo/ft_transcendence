import BaseElement from "./BaseElement.js";

class PongAi extends BaseElement {
  constructor() {
    super();
    this.init();
    this.animationFrameId = null;
    this.lastTime = performance.now();
  }

  init() {
    this.innerHTML = "";
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1000;
    this.canvas.height = 700;
    this.statusMessage = this.createElement("statusMessage");
    this.scoreboard = this.createElement("scoreboard");
    this.side1Username = this.createElement("side1Username");
    this.side2Username = this.createElement("side2Username");

    this.startButton = document.createElement("button");
    this.startButton.textContent = "Start Game";
    this.startButton.className = "btn btn-primary position-absolute";
    this.startButton.style.left = "50%";
    this.startButton.style.top = "50%";
    this.startButton.style.transform = "translate(-50%, -50%)";
    this.startButton.style.zIndex = "1000";
    this.startButton.style.display = "block";
    this.side2Username.textContent = "AI";
    this.scoreboard.textContent = "0 - 0";

    this.append(
      this.canvas,
      this.statusMessage,
      this.scoreboard,
      this.side1Username,
      this.side2Username,
      this.startButton
    );

    this.page?.app.stateManager.updateState("currentGame", false);
    this.startButton.addEventListener("click", () => {
      this.startButton.style.display = "none";
      this.lastTime = performance.now();
      this.gameLoop(this.lastTime);
    });

    this.ctx = this.canvas.getContext("2d");

    // Game state
    const paddleHeight = this.canvas.height * 0.25;
    const paddleWidth = this.canvas.width * 0.02;
    const paddleInitialY = (this.canvas.height - paddleHeight) / 2;
    const playerPaddleX = 0;
    const aiPaddleX = this.canvas.width - paddleWidth;
    this.playerPaddle = {
      x: playerPaddleX,
      y: paddleInitialY,
      width: paddleWidth,
      height: paddleHeight,
      speed: 5,
    };
    this.aiPaddle = {
      x: aiPaddleX,
      y: paddleInitialY,
      width: paddleWidth,
      height: paddleHeight,
      speed: 7,
    };
    this.ball = { x: 450, y: 250, size: 10, vx: 3, vy: 3 };

    this.playerScore = 0;
    this.aiScore = 0;
    this.gameOver = false;

    this.keys = {};
    this.aiKeys = { ArrowUp: false, ArrowDown: false };

    this.aiInterval = null;
    this.animationFrameId = null;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
  }

  createElement(id) {
    const el = document.createElement("span");
    el.id = id;
    return el;
  }

  connectedCallback() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.aiInterval) clearInterval(this.aiInterval);
    this.gameOver = true;
    this.page?.app.stateManager.updateState("currentGame", false);
  }

  setPositions({
    leftPaddle = { top: "calc(50% - 50px)" },
    rightPaddle = { top: "calc(50% - 50px)" },
    ball = { top: "calc(50% - 5px)", left: "calc(50% - 5px)" },
  }) {
    Object.assign(this.paddels.left.style, leftPaddle);
    Object.assign(this.paddels.right.style, rightPaddle);
    Object.assign(this.ball.style, ball);
  }

  startGame(difficulty) {
    this.page.app.stateManager.updateState("currentGame", true);
    this.resetBall();
    this.playerScore = this.aiScore = 0;
    this.updateScoreDisplay();
    this.gameOver = false;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.statusMessage.textContent = "";

    const diff = difficulty ? difficulty.toLowerCase() : "easy";
    this.statusMessage.textContent = `Difficulty: ${diff}`;

    if (diff === "hard") {
      this.aiPaddle.speed = 7;
      this.aiReactionDelay = 200;
      this.aiErrorMargin = 10;
    } else if (diff === "medium") {
      this.aiPaddle.speed = 5;
      this.aiReactionDelay = 500;
      this.aiErrorMargin = 40;
    } else {
      this.aiPaddle.speed = 3;
      this.aiReactionDelay = 800;
      this.aiErrorMargin = 100;
    }

    if (this.aiInterval) clearInterval(this.aiInterval);
    this.aiInterval = setInterval(
      () => this.simulateAIInput(diff),
      this.aiReactionDelay
    );

    this.selectedDifficulty = diff;
    this.startButton.style.display = "block";
  }

  simulateAIInput(difficulty) {
    const diff = difficulty ? difficulty.toLowerCase() : "easy";

    if (this.ball.vx > 0) {
      // Ball moving toward AI
      if (!this.firstPrediction && this.ball.x < this.canvas.width * 0.3) {
        this.aiKeys["ArrowUp"] = false;
        this.aiKeys["ArrowDown"] = false;
        return;
      } else {
        this.firstPrediction = true;
      }

      const timeToReach = (this.aiPaddle.x - this.ball.x) / this.ball.vx;
      let predictedY = this.ball.y + this.ball.vy * timeToReach;

      while (predictedY < 0 || predictedY > this.canvas.height) {
        if (predictedY < 0) predictedY = -predictedY;
        else if (predictedY > this.canvas.height)
          predictedY = 2 * this.canvas.height - predictedY;
      }

      if (diff === "easy") {
        predictedY += (Math.random() - 0.5) * 200;
      } else if (diff === "medium") {
        predictedY += (Math.random() - 0.5) * 80;
      } else if (diff === "hard") {
        predictedY += (Math.random() - 0.5) * 30;
      }

      const paddleCenter = this.aiPaddle.y + this.aiPaddle.height / 2;
      const threshold = 15;

      if (Math.abs(predictedY - paddleCenter) < threshold) {
        this.aiKeys["ArrowUp"] = false;
        this.aiKeys["ArrowDown"] = false;
      } else if (predictedY < paddleCenter) {
        this.aiKeys["ArrowUp"] = true;
        this.aiKeys["ArrowDown"] = false;
      } else {
        this.aiKeys["ArrowDown"] = true;
        this.aiKeys["ArrowUp"] = false;
      }
    } else {
      if (this.aiLastHitTime && Date.now() - this.aiLastHitTime > 1000) {
        const targetY = this.canvas.height / 2;
        const paddleCenter = this.aiPaddle.y + this.aiPaddle.height / 2;
        const threshold = 10;

        if (Math.abs(targetY - paddleCenter) < threshold) {
          this.aiKeys["ArrowUp"] = false;
          this.aiKeys["ArrowDown"] = false;
        } else if (targetY < paddleCenter) {
          this.aiKeys["ArrowUp"] = true;
          this.aiKeys["ArrowDown"] = false;
        } else {
          this.aiKeys["ArrowDown"] = true;
          this.aiKeys["ArrowUp"] = false;
        }
      }
    }
  }

  gameLoop(timestamp) {
    if (this.gameOver) return;
    const deltaTime = (timestamp - this.lastTime) / 1000; // in seconds
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  update(deltaTime) {
    if (this.gameOver) return;
    const playerSpeed = this.playerPaddle.speed * deltaTime * 60;
    const aiSpeed = this.aiPaddle.speed * deltaTime * 60;
    const ballVX = this.ball.vx * deltaTime * 60;
    const ballVY = this.ball.vy * deltaTime * 60;

    if (this.keys["w"]) this.playerPaddle.y -= playerSpeed;
    if (this.keys["s"]) this.playerPaddle.y += playerSpeed;
    this.playerPaddle.y = Math.min(
      Math.max(0, this.playerPaddle.y),
      this.canvas.height - this.playerPaddle.height
    );

    if (Date.now() - this.lastAIUpdate >= 1000) {
      this.lastAIUpdate = Date.now();

      if (this.aiResetMode) {
        if (Date.now() - this.aiLastHitTime > 800) {
          const targetY = (this.canvas.height - this.aiPaddle.height) / 2;
          const threshold = 10;

          if (Math.abs(this.aiPaddle.y - targetY) > threshold) {
            this.aiPaddle.y += this.aiPaddle.y < targetY ? aiSpeed : -aiSpeed;
          } else {
            this.aiResetMode = false;
          }
        }
      } else {
        this.simulateAIInput(this.difficulty);
      }
    }

    if (this.aiKeys["ArrowUp"]) this.aiPaddle.y -= aiSpeed;
    if (this.aiKeys["ArrowDown"]) this.aiPaddle.y += aiSpeed;

    this.aiPaddle.y = Math.min(
      Math.max(0, this.aiPaddle.y),
      this.canvas.height - this.aiPaddle.height
    );

    this.ball.x += ballVX;
    this.ball.y += ballVY;

    if (this.ball.y <= 0) {
      this.ball.y = 0;
      this.ball.vy *= -1;
    } else if (this.ball.y + this.ball.size >= this.canvas.height) {
      this.ball.y = this.canvas.height - this.ball.size;
      this.ball.vy *= -1;
    }

    if (
      this.ball.x <= this.playerPaddle.x + this.playerPaddle.width &&
      this.ball.y + this.ball.size >= this.playerPaddle.y &&
      this.ball.y <= this.playerPaddle.y + this.playerPaddle.height
    ) {
      this.ball.vx = Math.abs(this.ball.vx);
      this.ball.x = this.playerPaddle.x + this.playerPaddle.width;
    }

    if (
      this.ball.x + this.ball.size >= this.aiPaddle.x &&
      this.ball.y + this.ball.size >= this.aiPaddle.y &&
      this.ball.y <= this.aiPaddle.y + this.aiPaddle.height
    ) {
      this.ball.vx = -Math.abs(this.ball.vx);
      this.ball.x = this.aiPaddle.x - this.ball.size;
      this.aiResetMode = true;
      this.aiLastHitTime = Date.now();
    }

    if (this.ball.vx > 0) {
      this.aiResetMode = false;
    }

    if (this.ball.x <= 0) {
      this.aiScore++;
      this.updateScoreDisplay();
      if (this.aiScore >= 3) {
        this.endGame();
      } else {
        this.resetBall();
      }
    } else if (this.ball.x + this.ball.size >= this.canvas.width) {
      this.playerScore++;
      this.updateScoreDisplay();
      if (this.playerScore >= 3) {
        this.endGame();
      } else {
        this.resetBall();
      }
    }
  }

  updateScoreDisplay() {
    this.scoreboard.textContent = `${this.playerScore} - ${this.aiScore}`;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#202428";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "#f1f1f1";
    this.ctx.fillRect(
      this.playerPaddle.x,
      this.playerPaddle.y,
      this.playerPaddle.width,
      this.playerPaddle.height
    );
    this.ctx.fillRect(
      this.aiPaddle.x,
      this.aiPaddle.y,
      this.aiPaddle.width,
      this.aiPaddle.height
    );

    this.ctx.fillStyle = "#f1f1f1";
    this.ctx.fillRect(this.ball.x, this.ball.y, this.ball.size, this.ball.size);
  }

  resetBall() {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    this.ball.vx = 5 * (Math.random() > 0.5 ? 1 : -1);
    this.ball.vy = 5 * (Math.random() > 0.5 ? 1 : -1);
    this.firstPrediction = false;
  }

  handleKeyDown(e) {
    this.keys[e.key.toLowerCase()] = true;
  }

  handleKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
  }

  endGame(message) {
    this.gameOver = true;
    if (this.aiInterval) clearInterval(this.aiInterval);
    cancelAnimationFrame(this.animationFrameId);

    const gameScore = {
      playerScore: this.playerScore,
      aiScore: this.aiScore,
    };

    this.dispatchEvent(
      new CustomEvent("gameEnd", {
        detail: gameScore,
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("pong-ai", PongAi);
