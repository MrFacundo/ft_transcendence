import Page from "./Page";

class OffinePvpPage extends Page {
    constructor(app) {
        super({
            name: "pvp_offline",
            url: "/pvp_offline",
            pageElement: "#Offline",
            isProtected: true,
            app: app,
        });
    }

    render() {
        let Pong;
        // Global Variables
        const DIRECTION = {
            IDLE: 0,
            UP: 1,
            DOWN: 2,
            LEFT: 3,
            RIGHT: 4
        };

        const rounds = [5, 5, 3, 3, 2];
        const colors = ['#1abc9c', '#2ecc71', '#3498db', '#e74c3c', '#9b59b6'];

        // The ball object (The cube that bounces back and forth)
        const Ball = {
            new: function (incrementedSpeed) {
                return {
                    width: 18,
                    height: 18,
                    x: (this.canvas.width / 2) - 9,
                    y: (this.canvas.height / 2) - 9,
                    moveX: DIRECTION.IDLE,
                    moveY: DIRECTION.IDLE,
                    speed: incrementedSpeed || 5
                };
            }
        };

        // The paddle object (The two lines that move up and down)
        const Paddle = {
            new: function (side) {
                return {
                    width: 18,
                    height: 70,
                    x: side === 'left' ? 150 : this.canvas.width - 150,
                    y: (this.canvas.height / 2) - 35,
                    score: 0,
                    move: DIRECTION.IDLE,
                    speed: 10
                };
            }
        };

        const Game = {
            initialize: function () {
                this.canvas = document.querySelector('canvas');
                this.context = this.canvas.getContext('2d');

                this.canvas.width = 1400;
                this.canvas.height = 1000;

                this.canvas.style.width = (this.canvas.width / 2) + 'px';
                this.canvas.style.height = (this.canvas.height / 2) + 'px';

                this.player = Paddle.new.call(this, 'left');
                this.paddle = Paddle.new.call(this, 'right');
                this.ball = Ball.new.call(this);

                this.paddle.speed = 8;
                this.running = this.over = false;
                this.turn = this.paddle;
                this.timer = this.round = 0;
                this.color = '#2c3e50';

                Pong.menu();
                Pong.listen();
            },

            endGameMenu: function (text) {
                // Change the canvas font size and color
                Pong.context.font = '50px Courier New';
                Pong.context.fillStyle = this.color;

                // Draw the rectangle behind the 'Press any key to begin' text.
                Pong.context.fillRect(
                    Pong.canvas.width / 2 - 350,
                    Pong.canvas.height / 2 - 48,
                    700,
                    100
                );

                // Change the canvas color;
                Pong.context.fillStyle = '#ffffff';

                // Draw the end game menu text ('Game Over' and 'Winner')
                Pong.context.fillText(text,
                    Pong.canvas.width / 2,
                    Pong.canvas.height / 2 + 15
                );

                setTimeout(function () {
                    Pong = Object.assign({}, Game);
                    Pong.initialize();
                }, 3000);
            },

            menu: function () {
                // Draw all the Pong objects in their current state
                Pong.draw();

                // Change the canvas font size and color
                this.context.font = '50px Courier New';
                this.context.fillStyle = this.color;

                // Draw the rectangle behind the 'Press any key to begin' text.
                this.context.fillRect(
                    this.canvas.width / 2 - 350,
                    this.canvas.height / 2 - 48,
                    700,
                    100
                );

                // Change the canvas color;
                this.context.fillStyle = '#ffffff';

                // Draw the 'press any key to begin' text
                this.context.fillText('Press any key to begin',
                    this.canvas.width / 2,
                    this.canvas.height / 2 + 15
                );
            },

            // Update all objects (move the player, paddle, ball, increment the score, etc.)
            update: function () {
                if (!this.over) {
                    // Ball collisions with top/bottom boundaries
                    if (this.ball.x <= 0) Pong._resetTurn.call(this, this.paddle, this.player);
                    if (this.ball.x >= this.canvas.width - this.ball.width) Pong._resetTurn.call(this, this.player, this.paddle);
                    if (this.ball.y <= 0) this.ball.moveY = DIRECTION.DOWN;
                    if (this.ball.y >= this.canvas.height - this.ball.height) this.ball.moveY = DIRECTION.UP;

                    // Move left paddle (player) if key is pressed
                    if (this.player.move === DIRECTION.UP) this.player.y -= this.player.speed;
                    else if (this.player.move === DIRECTION.DOWN) this.player.y += this.player.speed;

                    // Move right paddle (second player) if key is pressed
                    if (this.paddle.move === DIRECTION.UP) this.paddle.y -= this.paddle.speed;
                    else if (this.paddle.move === DIRECTION.DOWN) this.paddle.y += this.paddle.speed;

                    // Start ball movement after turn delay
                    if (Pong._turnDelayIsOver.call(this) && this.turn) {
                        this.ball.moveX = this.turn === this.player ? DIRECTION.LEFT : DIRECTION.RIGHT;
                        this.ball.moveY = [DIRECTION.UP, DIRECTION.DOWN][Math.round(Math.random())];
                        this.ball.y = Math.floor(Math.random() * this.canvas.height - 200) + 200;
                        this.turn = null;
                    }

                    // Boundaries for left paddle
                    if (this.player.y <= 0) this.player.y = 0;
                    else if (this.player.y >= (this.canvas.height - this.player.height))
                        this.player.y = (this.canvas.height - this.player.height);

                    // Boundaries for right paddle
                    if (this.paddle.y <= 0) this.paddle.y = 0;
                    else if (this.paddle.y >= (this.canvas.height - this.paddle.height))
                        this.paddle.y = (this.canvas.height - this.paddle.height);

                    // Move ball
                    if (this.ball.moveY === DIRECTION.UP) this.ball.y -= (this.ball.speed / 1.5);
                    else if (this.ball.moveY === DIRECTION.DOWN) this.ball.y += (this.ball.speed / 1.5);
                    if (this.ball.moveX === DIRECTION.LEFT) this.ball.x -= this.ball.speed;
                    else if (this.ball.moveX === DIRECTION.RIGHT) this.ball.x += this.ball.speed;

                    // Collision with left paddle
                    if (this.ball.x - this.ball.width <= this.player.x && this.ball.x >= this.player.x - this.player.width) {
                        if (this.ball.y <= this.player.y + this.player.height && this.ball.y + this.ball.height >= this.player.y) {
                            this.ball.x = (this.player.x + this.ball.width);
                            this.ball.moveX = DIRECTION.RIGHT;
                        }
                    }

                    // Collision with right paddle
                    if (this.ball.x - this.ball.width <= this.paddle.x && this.ball.x >= this.paddle.x - this.paddle.width) {
                        if (this.ball.y <= this.paddle.y + this.paddle.height && this.ball.y + this.ball.height >= this.paddle.y) {
                            this.ball.x = (this.paddle.x - this.ball.width);
                            this.ball.moveX = DIRECTION.LEFT;
                        }
                    }
                }

                // End of round checks
                if (this.player.score === rounds[this.round]) {
                    if (!rounds[this.round + 1]) {
                        this.over = true;
                        setTimeout(() => {
                            Pong.endGameMenu('Winner!');
                        }, 1000);
                    } else {
                        this.color = this._generateRoundColor();
                        this.player.score = this.paddle.score = 0;
                        this.player.speed += 0.5;
                        this.paddle.speed += 1;
                        this.ball.speed += 1;
                        this.round += 1;
                    }
                } else if (this.paddle.score === rounds[this.round]) {
                    this.over = true;
                    setTimeout(() => {
                        Pong.endGameMenu('Game Over!');
                    }, 1000);
                }
            },

            draw: function () {
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.context.fillStyle = this.color;
                this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

                // Paddles & Ball
                this.context.fillStyle = '#ffffff';
                this.context.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
                this.context.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

                if (Pong._turnDelayIsOver.call(this)) {
                    this.context.fillRect(this.ball.x, this.ball.y, this.ball.width, this.ball.height);
                }

                // Net
                this.context.beginPath();
                this.context.setLineDash([7, 15]);
                this.context.moveTo((this.canvas.width / 2), this.canvas.height - 140);
                this.context.lineTo((this.canvas.width / 2), 140);
                this.context.lineWidth = 10;
                this.context.strokeStyle = '#ffffff';
                this.context.stroke();

                // Scores
                this.context.font = '100px Courier New';
                this.context.textAlign = 'center';
                this.context.fillText(this.player.score.toString(), (this.canvas.width / 2) - 300, 200);
                this.context.fillText(this.paddle.score.toString(), (this.canvas.width / 2) + 300, 200);

                // Round Info
                this.context.font = '30px Courier New';
                this.context.fillText('Round ' + (Pong.round + 1), (this.canvas.width / 2), 35);
                this.context.font = '40px Courier';
                this.context.fillText(
                    rounds[Pong.round] ? rounds[Pong.round] : rounds[Pong.round - 1],
                    (this.canvas.width / 2),
                    100
                );
            },

            loop: function () {
                Pong.update();
                Pong.draw();

                // If the game is not over, draw the next frame.
                if (!Pong.over) requestAnimationFrame(Pong.loop);
            },

            listen: function () {
                document.addEventListener('keydown', (key) => {
                    // Start the game on any key press
                    if (Pong.running === false) {
                        Pong.running = true;
                        window.requestAnimationFrame(Pong.loop);
                    }

                    /**
                     * Player 1 (left paddle):
                     * - W (keyCode 87): Move UP
                     * - S (keyCode 83): Move DOWN
                     */
                    if (key.keyCode === 87) Pong.player.move = DIRECTION.UP;
                    if (key.keyCode === 83) Pong.player.move = DIRECTION.DOWN;

                    /**
                     * Player 2 (right paddle):
                     * - Up Arrow (keyCode 38): Move UP
                     * - Down Arrow (keyCode 40): Move DOWN
                     */
                    if (key.keyCode === 38) Pong.paddle.move = DIRECTION.UP;
                    if (key.keyCode === 40) Pong.paddle.move = DIRECTION.DOWN;
                });

                // When key is released, stop moving that paddle
                document.addEventListener('keyup', (key) => {
                    // Player 1
                    if (key.keyCode === 87 || key.keyCode === 83) {
                        Pong.player.move = DIRECTION.IDLE;
                    }
                    // Player 2
                    if (key.keyCode === 38 || key.keyCode === 40) {
                        Pong.paddle.move = DIRECTION.IDLE;
                    }
                });
            },

            // Reset the ball location, the player turns and set a delay before the next round begins.
            _resetTurn: function (victor, loser) {
                this.ball = Ball.new.call(this, this.ball.speed);
                this.turn = loser;
                this.timer = (new Date()).getTime();

                victor.score++;
            },

            // Wait for a delay to have passed after each turn.
            _turnDelayIsOver: function () {
                return ((new Date()).getTime() - this.timer >= 1000);
            },

            // Select a random color as the background of each level/round.
            _generateRoundColor: function () {
                let newColor = colors[Math.floor(Math.random() * colors.length)];
                if (newColor === this.color) return Pong._generateRoundColor();
                return newColor;
            }
        };

        Pong = Object.assign({}, Game);
        Pong.initialize();
    }
}

export default OffinePvpPage;