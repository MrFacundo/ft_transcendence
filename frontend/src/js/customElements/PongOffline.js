import Pong from "./Pong.js";

class PongOffline extends Pong {
  constructor() {
    super();
  }
    
  init(retried = false) {
    const app = this.page?.app;
  
    if (!app) {
      if (retried) {
        console.warn("PongOffline: page is still not ready after retry.");
        return;
      }
  
      return setTimeout(() => this.init(true), 0);
    }
    super.init();
    this.setGameState();
  
    this.player1 = app.auth?.user ?? { username: "Player 1", id: null };
    this.player2 = { username: "Player 2", id: null };
    this.updateInfoUI(null, this.player1, this.player2);
  
    this.boundStartGame = () => {
      this.setGameState();
      this.startGame(null, this.player1, this.player2);
      this.gameLoop();
    };
  
    this.readyButton.addEventListener("click", this.boundStartGame);
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

    this.baseBallSpeed = 5;

    this.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      width: 10,
      height: 10,
      speedX: this.baseBallSpeed,
      speedY: this.baseBallSpeed,
    };

    this.player1Score = 0;
    this.player2Score = 0;
    this.gameOver = false;

    this.moveLeftPaddleUp = false;
    this.moveLeftPaddleDown = false;
    this.moveRightPaddleUp = false;
    this.moveRightPaddleDown = false;
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
        this.player2Score++;
      } else {
        this.player1Score++;
      }

      if (this.player1Score >= 3 || this.player2Score >= 3) {
        this.gameOver = true;
        this.resetBall();
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

    const currentSpeed = this.baseBallSpeed;
    const increasedSpeed = currentSpeed + Math.log(currentSpeed + 1) * 0.1;
    const angles = [30, 45, 60].map((deg) => (deg * Math.PI) / 180);
    let angle = angles[Math.floor(Math.random() * angles.length)];

    if (Math.random() < 0.5) angle = -angle;

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
    if (this.gameOver) return this.endGame();

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

  endGame() {
    this.cancelAnimationIfNeeded();
    const winner =
    this.player1Score >= 3 
      ? this.player1?.username || "Player 1"
      : this.player2?.username || "Player 2";
  
    this.clearCanvas();
    this.displayResult(this.player1Score, this.player2Score, winner);
    this.readyButton.textContent = "Play Again";
    this.readyButton.style.display = "block";
  }

  addEventListeners() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundHandleKeyup = this.handleKeyup.bind(this);
    window.addEventListener("keydown", this.boundHandleKeydown);
    window.addEventListener("keyup", this.boundHandleKeyup);
  }
  
  cleanup() {
    window.removeEventListener("keydown", this.boundHandleKeydown);
    window.removeEventListener("keyup", this.boundHandleKeyup);
    this.readyButton.removeEventListener("click", this.boundStartGame);
    super.cleanup();
  }
}

customElements.define("pong-offline", PongOffline);

export default PongOffline;
