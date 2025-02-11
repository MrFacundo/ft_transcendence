class PongAi extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.canvas = document.createElement("canvas");
    this.canvas.width = 900;
    this.canvas.height = 500;
    this.shadowRoot.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    this.playerPaddle = {
      x: 10,
      y: this.canvas.height / 2 - 40,
      width: 10,
      height: 80,
      speed: 5,
    };
    this.aiPaddle = {
      x: this.canvas.width - 20,
      y: this.canvas.height / 2 - 40,
      width: 10,
      height: 80,
    };
    this.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      size: 10,
      vx: 3,
      vy: 3,
    };

    this.playerScore = 0;
    this.aiScore = 0;
    this.gameOver = false;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.keys = {};
    this.animationFrameId = null;
  }

  connectedCallback() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  startGame() {
    this.resetBall();
    this.gameLoop();
  }

  gameLoop() {
    if (!this.gameOver) {
      this.update();
      this.draw();
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  }

  update() {
    if (this.keys["w"] || this.keys["W"])
      this.playerPaddle.y -= this.playerPaddle.speed;
    if (this.keys["s"] || this.keys["S"])
      this.playerPaddle.y += this.playerPaddle.speed;
    if (this.playerPaddle.y < 0) this.playerPaddle.y = 0;
    if (this.playerPaddle.y + this.playerPaddle.height > this.canvas.height)
      this.playerPaddle.y = this.canvas.height - this.playerPaddle.height;

    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    if (this.ball.y < 0 || this.ball.y + this.ball.size > this.canvas.height)
      this.ball.vy *= -1;

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
    }

    if (this.ball.x < 0) {
      this.aiScore++;
      if (this.aiScore >= 1) {
        this.endGame("Loooooser");
        return;
      } else {
        this.resetBall();
      }
    } else if (this.ball.x + this.ball.size > this.canvas.width) {
      this.playerScore++;
      if (this.playerScore >= 1) {
        this.endGame("Congrats");
        return;
      } else {
        this.resetBall();
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Draw background
    this.ctx.fillStyle = "#f0f0f0";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // Draw score
    this.ctx.fillStyle = "black";
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "center";
    if (!this.gameOver) {
      this.ctx.fillText(
        `${this.playerScore} - ${this.aiScore}`,
        this.canvas.width / 2,
        30
      );
    }
    // Draw paddles and ball
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
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(this.ball.x, this.ball.y, this.ball.size, this.ball.size);
  }

  endGame(message) {
    this.gameOver = true;
    cancelAnimationFrame(this.animationFrameId);
    // Clear the canvas and print the message as plain text (like a score)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "black";
    this.ctx.font = "48px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
    setTimeout(() => {
      window.location.href = "/ai";
    }, 3000);
  }

  resetBall() {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    this.ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
    this.ball.vy = 3 * (Math.random() > 0.5 ? 1 : -1);
  }

  handleKeyDown(e) {
    this.keys[e.key] = true;
  }

  handleKeyUp(e) {
    this.keys[e.key] = false;
  }
}

customElements.define("pong-ai", PongAi);
