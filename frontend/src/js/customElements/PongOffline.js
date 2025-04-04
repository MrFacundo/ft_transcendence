import Pong from "./Pong.js";

class PongOffline extends Pong {
  constructor() {
    super();
  }

  init() {
    super.init();

    this.addEventListeners();

    this.setGameState();
    this.updateScoreDisplay();

    this.drawGameElements();
  }

  setGameState() {
    const paddleHeight = this.canvas.height * 0.25;
    const paddleWidth = this.canvas.width * 0.02;
    const paddleInitialY = (this.canvas.height - paddleHeight) / 2;

    this.leftPaddle = {
      x: 0,
      y: paddleInitialY,
      width: paddleWidth,
      height: paddleHeight,
      speed: 6,
    };

    this.rightPaddle = {
      x: this.canvas.width - paddleWidth,
      y: paddleInitialY,
      width: paddleWidth,
      height: paddleHeight,
      speed: 6,
    };

    this.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      width: 10,
      height: 10,
      speedX: 5,
      speedY: 5,
    };

    this.playerScore = 0;
    this.opponentScore = 0;
    this.gameOver = false;

    this.moveLeftPaddleUp = false;
    this.moveLeftPaddleDown = false;
    this.moveRightPaddleUp = false;
    this.moveRightPaddleDown = false;
  }

  updateScoreDisplay() {
    if (this.gameOver) {
      this.scoreboard.textContent = "Game Over!";
    } else {
      this.scoreboard.textContent = `${this.playerScore} - ${this.opponentScore}`;
    }
  }

  addEventListeners() {
    window.addEventListener("keydown", (event) => this.handleKeydown(event));
    window.addEventListener("keyup", (event) => this.handleKeyup(event));

    this.readyButton.addEventListener("click", () => {
      this.readyButton.style.display = "none";
      this.playAgainButton.style.display = "none";
      this.setGameState();
      this.updateScoreDisplay();
      this.gameLoop();
    });

    this.playAgainButton.addEventListener("click", () => {
      this.playAgainButton.style.display = "none";
      this.readyButton.style.display = "none";
      this.setGameState();
      this.updateScoreDisplay();
      this.gameLoop();
    });
  }

  handleKeydown(event) {
    if (event.key === "w") this.moveLeftPaddleUp = true;
    if (event.key === "s") this.moveLeftPaddleDown = true;
    if (event.key === "ArrowUp") this.moveRightPaddleUp = true;
    if (event.key === "ArrowDown") this.moveRightPaddleDown = true;
  }

  handleKeyup(event) {
    if (event.key === "w") this.moveLeftPaddleUp = false;
    if (event.key === "s") this.moveLeftPaddleDown = false;
    if (event.key === "ArrowUp") this.moveRightPaddleUp = false;
    if (event.key === "ArrowDown") this.moveRightPaddleDown = false;
  }

  updatePaddles() {
    if (this.moveLeftPaddleUp) {
      this.leftPaddle.y = Math.max(
        0,
        this.leftPaddle.y - this.leftPaddle.speed,
      );
    }
    if (this.moveLeftPaddleDown) {
      this.leftPaddle.y = Math.min(
        this.canvas.height - this.leftPaddle.height,
        this.leftPaddle.y + this.leftPaddle.speed,
      );
    }

    if (this.moveRightPaddleUp) {
      this.rightPaddle.y = Math.max(
        0,
        this.rightPaddle.y - this.rightPaddle.speed,
      );
    }
    if (this.moveRightPaddleDown) {
      this.rightPaddle.y = Math.min(
        this.canvas.height - this.rightPaddle.height,
        this.rightPaddle.y + this.rightPaddle.speed,
      );
    }
  }

  updateBall() {
    this.ball.x += this.ball.speedX;
    this.ball.y += this.ball.speedY;

    if (
      this.ball.y <= 0 ||
      this.ball.y + this.ball.height >= this.canvas.height
    ) {
      this.ball.speedY *= -1;
    }

    if (
      this.ball.x <= this.leftPaddle.x + this.leftPaddle.width &&
      this.ball.y + this.ball.height >= this.leftPaddle.y &&
      this.ball.y <= this.leftPaddle.y + this.leftPaddle.height
    ) {
      this.ball.speedX *= -1;
    }

    if (
      this.ball.x + this.ball.width >= this.rightPaddle.x &&
      this.ball.y + this.ball.height >= this.rightPaddle.y &&
      this.ball.y <= this.rightPaddle.y + this.rightPaddle.height
    ) {
      this.ball.speedX *= -1;
    }

    if (
      this.ball.x <= 0 ||
      this.ball.x + this.ball.width >= this.canvas.width
    ) {
      if (this.ball.x <= 0) {
        this.opponentScore++;
      } else {
        this.playerScore++;
      }

      if (this.playerScore >= 3 || this.opponentScore >= 3) {
        this.gameOver = true;
        this.updateScoreDisplay();
        return;
      }

      this.resetBall();
      this.updateScoreDisplay();
    }
  }

resetBall() {
  this.ball.x = this.canvas.width / 2;
  this.ball.y = this.canvas.height / 2;

  const currentSpeed = Math.sqrt(this.ball.speedX ** 2 + this.ball.speedY ** 2);
  const increasedSpeed = currentSpeed + Math.log(currentSpeed + 1) * 0.1;

    // Choose from better preset angles (in radians)
    const angles = [30, 45, 60].map((deg) => (deg * Math.PI) / 180);
    let angle = angles[Math.floor(Math.random() * angles.length)];

    // Randomize vertical direction (up/down)
    if (Math.random() < 0.5) angle = -angle;

    // Randomize horizontal direction (left/right)
    const direction = Math.random() < 0.5 ? -1 : 1;

  this.ball.speedX = direction * increasedSpeed * Math.cos(angle);
  this.ball.speedY = increasedSpeed * Math.sin(angle);
}

  drawGameElements() {
    this.clearCanvas();

    this.ctx.fillStyle = "white";
    this.ctx.fillRect(
      this.leftPaddle.x,
      this.leftPaddle.y,
      this.leftPaddle.width,
      this.leftPaddle.height,
    );
    this.ctx.fillRect(
      this.rightPaddle.x,
      this.rightPaddle.y,
      this.rightPaddle.width,
      this.rightPaddle.height,
    );

    this.ctx.fillRect(
      this.ball.x,
      this.ball.y,
      this.ball.width,
      this.ball.height,
    );
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  gameLoop() {
    if (this.gameOver) {
      this.cancelAnimationIfNeeded();
      this.scoreboard.textContent = "Game Over!";
      this.playAgainButton.style.display = "block";
      return;
    }

    this.updatePaddles();
    this.updateBall();

    this.drawGameElements();

    this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  cancelAnimationIfNeeded() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

customElements.define("pong-offline", PongOffline);

export default PongOffline;
