// pong-game.js
// This custom element renders a Pong game on a canvas.
// In AI mode the left paddle is controlled by the player and the right paddle is static.
class PongAi extends HTMLElement {
  constructor() {
    super();
    // Use Shadow DOM to encapsulate styling and the canvas.
    this.attachShadow({ mode: "open" });
    // Create and configure a canvas.
    this.canvas = document.createElement("canvas");
    this.canvas.width = 800;
    this.canvas.height = 400;
    this.shadowRoot.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    // Game state variables:
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
      // For now the AI paddle does not move.
    };
    this.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      size: 10,
      vx: 3,
      vy: 3,
    };

    // Bindings for event handlers and the game loop.
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.gameLoop = this.gameLoop.bind(this);

    // Object to track key presses.
    this.keys = {};

    // For cleanup of the animation frame.
    this.animationFrameId = null;
  }

  connectedCallback() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // Start the game loop.
  startGame() {
    // (For AI games we ignore any game-id or WS setup.)
    this.resetBall();
    this.gameLoop();
  }

  // Game loop: update state, check collisions, redraw.
  gameLoop() {
    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  // Update game state.
  update() {
    // --- Player paddle movement (controlled by "w" and "s") ---
    if (this.keys["w"] || this.keys["W"]) {
      this.playerPaddle.y -= this.playerPaddle.speed;
    }
    if (this.keys["s"] || this.keys["S"]) {
      this.playerPaddle.y += this.playerPaddle.speed;
    }
    // Constrain player paddle to canvas
    if (this.playerPaddle.y < 0) this.playerPaddle.y = 0;
    if (this.playerPaddle.y + this.playerPaddle.height > this.canvas.height)
      this.playerPaddle.y = this.canvas.height - this.playerPaddle.height;

    // --- Update ball position ---
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // --- Ball collision with top/bottom walls ---
    if (this.ball.y < 0 || this.ball.y + this.ball.size > this.canvas.height) {
      this.ball.vy *= -1;
    }

    // --- Ball collision with the player paddle ---
    if (
      this.ball.x <= this.playerPaddle.x + this.playerPaddle.width &&
      this.ball.y + this.ball.size >= this.playerPaddle.y &&
      this.ball.y <= this.playerPaddle.y + this.playerPaddle.height
    ) {
      this.ball.vx = Math.abs(this.ball.vx); // ensure positive vx
      this.ball.x = this.playerPaddle.x + this.playerPaddle.width;
    }

    // --- Ball collision with the AI paddle (which is static) ---
    if (
      this.ball.x + this.ball.size >= this.aiPaddle.x &&
      this.ball.y + this.ball.size >= this.aiPaddle.y &&
      this.ball.y <= this.aiPaddle.y + this.aiPaddle.height
    ) {
      this.ball.vx = -Math.abs(this.ball.vx); // ensure negative vx
      this.ball.x = this.aiPaddle.x - this.ball.size;
    }

    // --- Reset ball if it goes off the left or right edge ---
    if (this.ball.x < 0 || this.ball.x + this.ball.size > this.canvas.width) {
      this.resetBall();
    }
  }

  // Draw the current game state.
  draw() {
    // Clear the canvas.
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw the background.
    this.ctx.fillStyle = "#f0f0f0";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw the player paddle.
    this.ctx.fillStyle = "blue";
    this.ctx.fillRect(
      this.playerPaddle.x,
      this.playerPaddle.y,
      this.playerPaddle.width,
      this.playerPaddle.height
    );

    // Draw the AI paddle.
    this.ctx.fillStyle = "red";
    this.ctx.fillRect(
      this.aiPaddle.x,
      this.aiPaddle.y,
      this.aiPaddle.width,
      this.aiPaddle.height
    );

    // Draw the ball.
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(this.ball.x, this.ball.y, this.ball.size, this.ball.size);
  }

  // Reset ball to the center with a randomized direction.
  resetBall() {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    // Randomize initial direction.
    this.ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
    this.ball.vy = 3 * (Math.random() > 0.5 ? 1 : -1);
  }

  // --- Keyboard event handlers ---
  handleKeyDown(e) {
    this.keys[e.key] = true;
  }

  handleKeyUp(e) {
    this.keys[e.key] = false;
  }
}

// Register the custom element.
customElements.define("pong-ai", PongAi);