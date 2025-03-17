import BaseElement from "./BaseElement.js";

class PongAi extends BaseElement {
  constructor() {
    super();
    this.init();
  }

  init() {
    this.innerHTML = "";
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1000;
    this.canvas.height = 700;

    // Create UI elements to match the Pong component
    this.statusMessage = this.createElement("statusMessage");
    this.scoreboard = this.createElement("scoreboard");
    this.side1Username = this.createElement("side1Username");
    this.side2Username = this.createElement("side2Username");

    this.side1Username.textContent = "Player";
    this.side2Username.textContent = "AI";
    this.scoreboard.textContent = "0 - 0";

    this.append(this.canvas, this.statusMessage, this.scoreboard, this.side1Username, this.side2Username);

    this.ctx = this.canvas.getContext("2d");

    // Game state
    const paddleHeight = this.canvas.height * 0.25;
    const paddleWidth = this.canvas.width * 0.02;
    const paddleInitialY = (this.canvas.height - paddleHeight) / 2;
    const playerPaddleX = 0;
    const aiPaddleX = this.canvas.width - paddleWidth;
    this.playerPaddle = { x: playerPaddleX, y: paddleInitialY, width: paddleWidth, height: paddleHeight, speed: 5 };
    this.aiPaddle = { x: aiPaddleX, y: paddleInitialY, width: paddleWidth, height: paddleHeight, speed: 7 };
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

    // Set initial status message
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.aiInterval) clearInterval(this.aiInterval);
    this.gameOver = true;
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
    this.resetBall();
    this.playerScore = this.aiScore = 0;
    this.updateScoreDisplay();
    this.gameOver = false;
    
    const diff = difficulty ? difficulty.toLowerCase() : "easy";
    this.statusMessage.textContent = `Difficulty: ${diff}`;
    
    let reactionTime;
    if (diff === "hard") {
      reactionTime = 600;
      this.aiPaddle.speed = this.playerPaddle.speed + 2;
    } else if (diff === "medium") {
      reactionTime = 800;
      this.aiPaddle.speed = this.playerPaddle.speed + 1;
    } else {
      reactionTime = 1000;
      this.aiPaddle.speed = this.playerPaddle.speed;
    }

    if (this.aiInterval) clearInterval(this.aiInterval);
    this.aiInterval = setInterval(() => this.simulateAIInput(diff), reactionTime);

    this.gameLoop();
  }

  simulateAIInput(difficulty) {
    const diff = difficulty ? difficulty.toLowerCase() : "easy";

    if (this.ball.vx > 0) {
      // Wait for the ball to pass 30% of canvas for first prediction.
      if (!this.firstPrediction && this.ball.x < this.canvas.width * 0.3) {
        this.aiKeys["ArrowUp"] = false;
        this.aiKeys["ArrowDown"] = false;
        return;
      } else {
        this.firstPrediction = true;
      }

      // Predict where the ball will be when it reaches the AI paddle.
      const timeToReach = (this.aiPaddle.x - this.ball.x) / this.ball.vx;
      let predictedY = this.ball.y + this.ball.vy * timeToReach;
      predictedY = Math.max(0, Math.min(this.canvas.height, predictedY));

      // Add noise based on difficulty.
      if (diff === "easy") {
        predictedY += (Math.random() - 0.5) * 150;
      } else if (diff === "medium") {
        predictedY += (Math.random() - 0.5) * 60;
      } else if (diff === "hard") {
        predictedY += 0; // Perfect prediction for hard.
      }

      const paddleCenter = this.aiPaddle.y + this.aiPaddle.height / 2;
      const threshold = 20;

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
      // When the ball is moving away:
      if (diff === "medium" || diff === "hard") {
        // For medium and hard, return the paddle to center.
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
      } else {
        // For easy, do nothing when ball is moving away.
        this.aiKeys["ArrowUp"] = false;
        this.aiKeys["ArrowDown"] = false;
      }
    }
  }

  gameLoop() {
    if (this.gameOver) return;
    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  update() {
    // Player movement (using keys from keyboard)
    if (this.keys["w"]) this.playerPaddle.y -= this.playerPaddle.speed;
    if (this.keys["s"]) this.playerPaddle.y += this.playerPaddle.speed;
    this.playerPaddle.y = Math.min(
      Math.max(0, this.playerPaddle.y),
      this.canvas.height - this.playerPaddle.height
    );

    // AI movement: use simulated key flags
    if (this.aiKeys["ArrowUp"]) this.aiPaddle.y -= this.aiPaddle.speed;
    if (this.aiKeys["ArrowDown"]) this.aiPaddle.y += this.aiPaddle.speed;
    this.aiPaddle.y = Math.min(
      Math.max(0, this.aiPaddle.y),
      this.canvas.height - this.aiPaddle.height
    );

    // Ball movement
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Bounce off top and bottom boundaries
    if (
      this.ball.y <= 0 ||
      this.ball.y + this.ball.size >= this.canvas.height
    ) {
      this.ball.vy *= -1;
    }

    // Collision with player paddle
    if (
      this.ball.x <= this.playerPaddle.x + this.playerPaddle.width &&
      this.ball.y + this.ball.size >= this.playerPaddle.y &&
      this.ball.y <= this.playerPaddle.y + this.playerPaddle.height
    ) {
      this.ball.vx = Math.abs(this.ball.vx);
      this.ball.x = this.playerPaddle.x + this.playerPaddle.width;
    }

    // Collision with AI paddle
    if (
      this.ball.x + this.ball.size >= this.aiPaddle.x &&
      this.ball.y + this.ball.size >= this.aiPaddle.y &&
      this.ball.y <= this.aiPaddle.y + this.aiPaddle.height
    ) {
      this.ball.vx = -Math.abs(this.ball.vx);
      this.ball.x = this.aiPaddle.x - this.ball.size;
    }

    // Check win conditions
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
    this.ctx.fillStyle = "#202428"; // Match the background color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw paddles
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

    // Draw ball
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

    // Dispatch game end event
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