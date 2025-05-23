import { settings } from "../settings.js";
import { showMessage } from "../utils.js";
import Pong from "./Pong.js";

class PongRemote extends Pong {
    constructor() {
        super();
    }

    init() {
        super.init();
        this.setWebSocketState();
        this.readyButton.addEventListener("click", () => this.sendPlayerReady());
    }

    setUIElements() {
        super.setUIElements();
        this.paddels = {
            left: this.createSpanElement("leftPaddle"),
            right: this.createSpanElement("rightPaddle"),
        };
        this.ball = this.createSpanElement("ball");
        this.statusMessage = this.createSpanElement("statusMessage");
        this.append(this.statusMessage, this.paddels.left, this.paddels.right, this.ball);
    }

    setWebSocketState() {
        this.ws = null;
        this.playersJoined = [false, false];
        this.playersReady = [false, false];
        this.playerSide = null;
        this.inProgress = false;
    }

    sendPlayerReady() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "player_ready" }));
            this.readyButton.disabled = true;
            this.readyButton.textContent = "Waiting for opponent...";
        }
    }

    setWebsocket(id) {
        this.playersJoined = [false, false];
        this.playersReady = [false, false];

        this.ws = new WebSocket(
            `${settings.WS_URL}/${id}/?token=${this.page.app.auth.accessToken}`
        );
        this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data));
        this.ws.onclose = () => this.cleanup();
        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.updateStatus("Connection error. Please try again.");
        };
    }

    handleMessage(data) {
        switch (data.type) {
            case "connection_established":
                this.playerSide = data.side;
                this.updateStatus(`Connected as Player ${this.playerSide + 1}. Waiting for opponent...`);
                break;
            case "player_connected":
                this.playersJoined[data.side] = true;
                if (data.side != this.playerSide) {
                    this.updateStatus("Opponent connected! Click 'Ready to Play' when you're ready.");
                    this.readyButton.style.display = "block";
                }
                if (this.playersJoined[0] && this.playersJoined[1]) {
                    this.updateStatus("Both players connected! Click 'Ready to Play' when you're ready.");
                }
                break;
            case "player_disconnected":
                this.playersJoined[data.side] = false;
                this.playersReady[data.side] = false;
                if (this.inProgress) {
                    data.side === this.playerSide ? showMessage("Disconnected from game", "error") : showMessage("Opponent disconnected", "error");
                } else if (data.side !== this.playerSide) {
                    this.updateStatus("Opponent disconnected. Waiting for them to reconnect...");
                }
                break;
            case "player_ready":
                if (!this.inProgress) this.inProgress = true;
                this.playersReady[data.side] = true;
                if (data.side === this.playerSide) {
                    this.updateStatus("You are ready. Waiting for opponent...");
                    this.readyButton.style.display = "none";
                } else {
                    this.updateStatus("Opponent is ready. Click 'Ready to Play' when you're ready.");
                }
                if (this.playersReady[0] && this.playersReady[1]) {
                    this.updateStatus("");
                }
                break;
            case "gameState":
                this.toggleBallDisplay("gameState");
                this.setPositions({
                    leftPaddle: { top: `calc(${data.paddles[0].y * 100}%)` },
                    rightPaddle: { top: `calc(${data.paddles[1].y * 100}%)` },
                    ball: {
                        top: `calc(${data.ball.y * 100}%)`,
                        left: `calc(${data.ball.x * 100}%)`,
                    },
                });
                break;
            case "score":
                this.toggleBallDisplay("score");
                this.player1Score = data.score[0];
                this.player2Score = data.score[1];
                this.updateScoreDisplay();
                break;
            case "endGame":
                this.inProgress = false;
                this.ws?.close();
                break;
            case "error":
                this.updateStatus(`Error: ${data.message}`);
                console.error("Game error:", data.message);
                break;
        }
    }
    toggleBallDisplay(message) {
        if (message === "score") {
            this.ball.style.display = "none";
        } else if (message === "gameState" && this.ball.style.display === "none") {
            setTimeout(() => {
                if (!this.gameOver) this.ball.style.display = "block";
            }, 500);
        }
    }
    updateStatus(message) {
        this.statusMessage.textContent = message;
    }

    setPositions({ leftPaddle, rightPaddle, ball }) {
        Object.assign(this.paddels.left.style, leftPaddle);
        Object.assign(this.paddels.right.style, rightPaddle);
        Object.assign(this.ball.style, ball);
    }

    handleKey(event, type) {
        if (this.ws?.readyState === WebSocket.OPEN && ["w", "s", "W", "S"].includes(event.key)) {
            const key = event.key.toLowerCase();
            this.ws.send(JSON.stringify({ type, key }));
        }
    }

    async startGame(game) {
        super.startGame(game.id, game.player1, game.player2);
        this.setWebsocket(game.id);
        this.updateStatus("Connecting to game...");
        this.readyButton.style.display = "none";

        let connectionAttempts = 0;
        while (this.ws?.readyState !== WebSocket.OPEN) {
            await new Promise((res) => setTimeout(res, 1000));
            connectionAttempts++;
            if (connectionAttempts > 5) {
                this.updateStatus("Connection timed out. Please try again.");
                break;
            }
        }
    }

    displayPlayAgainButton() {
        this.readyButton.textContent = "Play Again";
        this.readyButton.style.display = "block";
        this.readyButton.disabled = false;
        this.readyButton.addEventListener("click", async () => {
            try {
                await this.page.app.api.gameRequest(this.opponentId);
                this.readyButton.classList.add("d-none");
            } catch (error) {
                console.error("Error requesting new game:", error);
            }
        });
    }

    cleanup() {
        if (this.inProgress) showMessage("Disconnected from game", "error");
        this.removeEventListeners();
        this.ws = null;
        this.dispatchEvent(new CustomEvent("gameOver"));
        super.cleanup();
    }

    addEventListeners() {
        this.keyDownHandler = (e) => this.handleKey(e, "keydown");
        this.keyUpHandler = (e) => this.handleKey(e, "keyup");
        this.beforeUnloadHandler = () => this.ws?.close();

        document.addEventListener("keydown", this.keyDownHandler);
        document.addEventListener("keyup", this.keyUpHandler);
        window.addEventListener("beforeunload", this.beforeUnloadHandler);
    }

    removeEventListeners() {
        document.removeEventListener("keydown", this.keyDownHandler);
        document.removeEventListener("keyup", this.keyUpHandler);
        window.removeEventListener("beforeunload", this.beforeUnloadHandler);
    }

    disconnectedCallback() {
        this.ws?.close();
        super.disconnectedCallback();
    }
}

customElements.define("pong-remote", PongRemote);
export default PongRemote;