class PongAi extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.canvas = document.createElement("canvas");
    this.canvas.width = 900;
    this.canvas.height = 500;
    this.canvas.style.border = "2px solid red";
    this.canvas.style.position = "relative";
    this.canvas.style.top = "50%";
    this.shadowRoot.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    // Reduce player speed for smoother movement (adjust as needed)
    this.playerPaddle = { x: 10, y: 210, width: 10, height: 80, speed: 3 };
    // You can tune the AI paddle speed per difficulty:
    this.aiPaddle = { x: 870, y: 210, width: 10, height: 80, speed: 5 };
    this.ball = { x: 450, y: 250, size: 10, vx: 3, vy: 3 };

    this.playerScore = 0;
    this.aiScore = 0;
    this.gameOver = false;
    this.difficulty = "easy";

    this.keys = {};
    // Use an object to simulate AI key presses.
    this.aiKeys = { ArrowUp: false, ArrowDown: false };

    this.aiInterval = null;
    this.animationFrameId = null;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
  }

  setApp(app) {
    this.app = app;
  }

  connectedCallback() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    const diff = this.getAttribute("difficulty");
    if (diff) {
      this.difficulty = diff;
    }
    this.startGame();
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.aiInterval) clearInterval(this.aiInterval);
    this.gameOver = true;
  }

  startGame() {
    this.resetBall();
    this.gameOver = false;

    const diff = this.difficulty ? this.difficulty.toLowerCase() : "easy";
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
    this.aiInterval = setInterval(() => this.simulateAIInput(), reactionTime);

    this.gameLoop();
  }

  simulateAIInput() {
    const diff = this.difficulty ? this.difficulty.toLowerCase() : "easy";
    console.log("simulateAIInput: difficulty =", diff);

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

    // AI movement: use simulated key flags (simulate keyboard input)
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

    // Check win conditions: update score and either reset ball or end game at 3 points.
    if (this.ball.x <= 0) {
      this.aiScore++;
      if (this.aiScore >= 3) {
        this.endGame("Loooooser!!!");
      } else {
        this.resetBall();
      }
    } else if (this.ball.x + this.ball.size >= this.canvas.width) {
      this.playerScore++;
      if (this.playerScore >= 3) {
        this.endGame("Congrats!");
      } else {
        this.resetBall();
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#f0f0f0";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw paddles
    this.ctx.fillStyle = "blue";
    this.ctx.fillRect(
      this.playerPaddle.x,
      this.playerPaddle.y,
      this.playerPaddle.width,
      this.playerPaddle.height
    );
    this.ctx.fillStyle = "red";
    this.ctx.fillRect(
      this.aiPaddle.x,
      this.aiPaddle.y,
      this.aiPaddle.width,
      this.aiPaddle.height
    );

    // Draw ball
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(this.ball.x, this.ball.y, this.ball.size, this.ball.size);

    // Draw score (optional)
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      `${this.playerScore} - ${this.aiScore}`,
      this.canvas.width / 2,
      30
    );
  }

  resetBall() {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    this.ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
    this.ball.vy = 3 * (Math.random() > 0.5 ? 1 : -1);
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
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);

    const overlay = document.createElement("div");
    overlay.style = `
      position:absolute;
      top:0;
      left:0;
      width:100%;
      height:100%;
      display:flex;
      justify-content:center;
      align-items:center;
      font-size:48px;
      color:#000;
      z-index:1000;
    `;
    overlay.textContent = message;
    this.shadowRoot.appendChild(overlay);

    setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent("gameEnd", {
          detail: message,
          bubbles: true,
          composed: true,
        })
      );
      if (this.parentElement) this.parentElement.removeChild(this);
    }, 1500);
  }
}

customElements.define("pong-ai", PongAi);
