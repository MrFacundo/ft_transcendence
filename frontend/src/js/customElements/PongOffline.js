import Pong from "./Pong.js";

class PongOffline extends Pong {
  constructor() {
    super();
    this.ballSpeedMultiplier = 1;
  }

  init() {
    super.init();
    this.setGameState();
    this.addEventListeners();
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
      speed: 6
    };

    this.rightPaddle = {
      x: this.canvas.width - paddleWidth,
      y: paddleInitialY,
      width: paddleWidth,
      height: paddleHeight,
      speed: 6
    };

    this.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      width: 10,
      height: 10,
      speedX: 2,
      speedY: 2,
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
    this.scoreboard.textContent = `${this.playerScore} - ${this.opponentScore}`;
  }

  addEventListeners() {
    window.addEventListener("keydown", this.handleKeydown.bind(this));
    window.addEventListener("keyup", this.handleKeyup.bind(this));

    this.readyButton.addEventListener("click", () => {
      this.startGame();
    });
  }

  handleKeydown(event) {
    if (event.key === "w") {
      this.moveLeftPaddleUp = true;
    }
    if (event.key === "s") {
      this.moveLeftPaddleDown = true;
    }
    if (event.key === "ArrowUp") {
      this.moveRightPaddleUp = true;
    }
    if (event.key === "ArrowDown") {
      this.moveRightPaddleDown = true;
    }
  }

  handleKeyup(event) {
    if (event.key === "w") {
      this.moveLeftPaddleUp = false;
    }
    if (event.key === "s") {
      this.moveLeftPaddleDown = false;
    }
    if (event.key === "ArrowUp") {
      this.moveRightPaddleUp = false;
    }
    if (event.key === "ArrowDown") {
      this.moveRightPaddleDown = false;
    }
  }

  updatePaddles() {
    if (this.moveLeftPaddleUp) {
      this.leftPaddle.y -= this.leftPaddle.speed;
    }
    if (this.moveLeftPaddleDown) {
      this.leftPaddle.y += this.leftPaddle.speed;
    }

    if (this.moveRightPaddleUp) {
      this.rightPaddle.y -= this.rightPaddle.speed;
    }
    if (this.moveRightPaddleDown) {
      this.rightPaddle.y += this.rightPaddle.speed;
    }

    this.leftPaddle.y = Math.max(0, Math.min(this.canvas.height - this.leftPaddle.height, this.leftPaddle.y));
    this.rightPaddle.y = Math.max(0, Math.min(this.canvas.height - this.rightPaddle.height, this.rightPaddle.y));
  }

  updateBall() {
    this.ball.x += this.ball.speedX;
    this.ball.y += this.ball.speedY;

    if (this.ball.y <= 0 || this.ball.y + this.ball.height >= this.canvas.height) {
      this.ball.speedY *= -1;
    }

    if (this.ball.x <= this.leftPaddle.x + this.leftPaddle.width &&
      this.ball.y + this.ball.height >= this.leftPaddle.y &&
      this.ball.y <= this.leftPaddle.y + this.leftPaddle.height) {
      this.ball.speedX *= -1;
    }

    if (this.ball.x + this.ball.width >= this.rightPaddle.x &&
      this.ball.y + this.ball.height >= this.rightPaddle.y &&
      this.ball.y <= this.rightPaddle.y + this.rightPaddle.height) {
      this.ball.speedX *= -1;
    }

    if (this.ball.x <= 0 || this.ball.x + this.ball.width >= this.canvas.width) {
      if (this.ball.x <= 0) {
        this.opponentScore++;
      } else {
        this.playerScore++;
      }
      this.resetBall();
      this.updateScoreDisplay();
    }
  }

  resetBall() {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;

    this.ball.speedX *= -1;

    const speedIncrease = 0.1;
    const maxSpeed = 10;

    if (Math.abs(this.ball.speedX) < maxSpeed && Math.abs(this.ball.speedY) < maxSpeed) {
      this.ball.speedX += speedIncrease;
      this.ball.speedY += speedIncrease;
    }

    if (Math.abs(this.ball.speedX) > maxSpeed) {
      this.ball.speedX = maxSpeed * Math.sign(this.ball.speedX);
    }
    if (Math.abs(this.ball.speedY) > maxSpeed) {
      this.ball.speedY = maxSpeed * Math.sign(this.ball.speedY);
    }
  }

  drawGameElements() {
    this.clearCanvas();
    this.drawPaddles();
    this.drawBall();
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPaddles() {
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(this.leftPaddle.x, this.leftPaddle.y, this.leftPaddle.width, this.leftPaddle.height);
    this.ctx.fillRect(this.rightPaddle.x, this.rightPaddle.y, this.rightPaddle.width, this.rightPaddle.height);
  }

  drawBall() {
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(this.ball.x, this.ball.y, this.ball.width, this.ball.height);
  }

  gameLoop() {
    this.updatePaddles();
    this.updateBall();
    this.drawGameElements();

    if (!this.gameOver) {
      requestAnimationFrame(this.gameLoop.bind(this));
    }
  }

  startGame() {
    this.gameOver = false;
    this.playerScore = 0;
    this.opponentScore = 0;
    this.ballSpeedMultiplier = 1;
    this.updateScoreDisplay();
    this.gameLoop();
    this.readyButton.remove();
    this.readyButton.style.display = 'none';
  }

  removeEventListeners() {
    window.removeEventListener("keydown", this.handleKeydown.bind(this));
    window.removeEventListener("keyup", this.handleKeyup.bind(this));
  }

  cleanup() {
    this.gameOver = true;
    this.removeEventListeners();
  }
}

customElements.define("pong-offline", PongOffline);

export default PongOffline;
