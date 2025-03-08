class PongAi extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.canvas = document.createElement("canvas");
    this.canvas.width = 900;
    this.canvas.height = 500;
    this.canvas.style.border = "2px solid red";
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
      speed: 5,
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
    this.difficulty = "easy";
    this.aiInterval = null;

    this.keys = {};
    this.aiKeys = { ArrowUp: false, ArrowDown: false };

    this.aiTarget = this.aiPaddle.y + this.aiPaddle.height / 2;

    this.animationFrameId = null;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
  }

  connectedCallback() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    const diff = this.getAttribute("difficulty");
    if (diff) {
      this.difficulty = diff;
    }
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.aiInterval) clearInterval(this.aiInterval);
  }

  startGame() {
    this.resetBall();
    this.gameOver = false;
    const reactionTime = 1000;
    if (this.difficulty === "easy") {
      this.aiPaddle.speed = 5;
    } else if (this.difficulty === "medium") {
      this.aiPaddle.speed = 7;
    } else if (this.difficulty === "hard") {
      this.aiPaddle.speed = 9;
    }
    this.aiInterval = setInterval(() => this.simulateAIInput(), reactionTime);
    this.gameLoop();
  }

  simulateAIInput() {
    let targetY;
    if (this.ball.vx > 0) {
      const timeToPaddle = (this.aiPaddle.x - this.ball.x) / this.ball.vx;
      targetY = this.ball.y + this.ball.vy * timeToPaddle;
      targetY = Math.max(0, Math.min(this.canvas.height, targetY));
      if (this.difficulty === "easy") {
        targetY += (Math.random() - 0.5) * 100;
      } else if (this.difficulty === "medium") {
        targetY += (Math.random() - 0.5) * 40;
      } else if (this.difficulty === "hard") {
        targetY += (Math.random() - 0.5) * 10;
      }
    } else {
      targetY = this.canvas.height / 2;
    }
    this.aiTarget = targetY;
    const paddleCenter = this.aiPaddle.y + this.aiPaddle.height / 2;
    const threshold = 5;
    if (Math.abs(targetY - paddleCenter) < threshold) {
      this.aiKeys.ArrowUp = false;
      this.aiKeys.ArrowDown = false;
    } else if (targetY < paddleCenter) {
      this.aiKeys.ArrowUp = true;
      this.aiKeys.ArrowDown = false;
    } else {
      this.aiKeys.ArrowDown = true;
      this.aiKeys.ArrowUp = false;
    }
  }

  gameLoop() {
    if (this.gameOver) {
      return;
    }
    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  update() {
    if (this.keys["w"] || this.keys["W"]) {
      this.playerPaddle.y -= this.playerPaddle.speed;
    }
    if (this.keys["s"] || this.keys["S"]) {
      this.playerPaddle.y += this.playerPaddle.speed;
    }
    if (this.playerPaddle.y < 0) {
      this.playerPaddle.y = 0;
    }
    if (this.playerPaddle.y + this.playerPaddle.height > this.canvas.height) {
      this.playerPaddle.y = this.canvas.height - this.playerPaddle.height;
    }
    if (this.aiKeys.ArrowUp) {
      this.aiPaddle.y -= this.aiPaddle.speed;
    }
    if (this.aiKeys.ArrowDown) {
      this.aiPaddle.y += this.aiPaddle.speed;
    }
    if (this.aiPaddle.y < 0) {
      this.aiPaddle.y = 0;
    }
    if (this.aiPaddle.y + this.aiPaddle.height > this.canvas.height) {
      this.aiPaddle.y = this.canvas.height - this.aiPaddle.height;
    }
    const aiPaddleCenter = this.aiPaddle.y + this.aiPaddle.height / 2;
    if (this.aiKeys.ArrowUp && aiPaddleCenter <= this.aiTarget) {
      this.aiKeys.ArrowUp = false;
    }
    if (this.aiKeys.ArrowDown && aiPaddleCenter >= this.aiTarget) {
      this.aiKeys.ArrowDown = false;
    }
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;
    if (this.ball.y < 0 || this.ball.y + this.ball.size > this.canvas.height) {
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
    }
    if (this.ball.x < 0) {
      this.aiScore++;
      if (this.aiScore >= 11) {
        this.endGame("Loooooser!!!");
        return;
      } else {
        this.resetBall();
      }
    } else if (this.ball.x + this.ball.size > this.canvas.width) {
      this.playerScore++;
      if (this.playerScore >= 11) {
        this.endGame("Congrats");
        return;
      } else {
        this.resetBall();
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#f0f0f0";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.gameOver) {
      this.ctx.fillStyle = "black";
      this.ctx.font = "24px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        `${this.playerScore} - ${this.aiScore}`,
        this.canvas.width / 2,
        30
      );
    }
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
    if (this.aiInterval) clearInterval(this.aiInterval);
    cancelAnimationFrame(this.animationFrameId);

    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "white";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.fontSize = "48px";
    overlay.style.color = "black";
    overlay.style.zIndex = "1000";

    this.shadowRoot.appendChild(overlay);

    setTimeout(() => {
      window.location.href = "/ai";
    }, 1500);
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
