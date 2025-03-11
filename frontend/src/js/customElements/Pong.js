import { settings } from "../settings.js";

class Pong extends HTMLElement {
    constructor() {
        super();
        this.init();
    }

    init() {
        this.ws = null;
        this.innerHTML = "";
        this.paddels = {
            left: this.createElement("leftPaddle"),
            right: this.createElement("rightPaddle"),
        };
        this.ball = this.createElement("ball");
        this.scoreboard = this.createElement("scoreboard");
        this.statusMessage = this.createElement("statusMessage");
        this.readyButton = document.createElement("button");
        this.readyButton.id = "readyButton";
        this.readyButton.textContent = "Ready to Play";
        this.readyButton.classList.add("ready-button");
        this.readyButton.addEventListener("click", () => this.sendPlayerReady());

        this.append(this.paddels.left, this.paddels.right, this.ball, this.scoreboard, this.statusMessage, this.readyButton);
        this.score = [0, 0];
        this.updateScore();
        this.pressedKeys = [];
        this.playersJoined = [false, false];
        this.playersReady = [false, false];
        this.mySide = null;
    }

    createElement(id) {
        const el = document.createElement("span");
        el.id = id;
        return el;
    }

    setWebsocket(id) {
        this.addEventListeners();
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
        console.log("Received message:", data);

        switch (data.type) {
            case "connection_established":
                this.mySide = data.side;
                this.updateStatus(`Connected as Player ${this.mySide + 1}. Waiting for opponent...`);
                break;
            case "player_connected":
                this.playersJoined[data.side] = true;
                if (data.side === this.mySide) {
                    this.updateStatus("You've connected. Waiting for opponent...");
                } else {
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
                if (data.side !== this.mySide) {
                    this.updateStatus("Opponent disconnected. Waiting for them to reconnect...");
                }
                break;
            case "player_ready":
                this.playersReady[data.side] = true;
                if (data.side === this.mySide) {
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
                this.score = data.score;
                this.updateScore();
                break;
            case "endGame":
                this.updateStatus(`Game over! Final score: ${this.score[0]} - ${this.score[1]}`);
                this.ws.close();
                break;
            case "error":
                this.updateStatus(`Error: ${data.message}`);
                console.error("Game error:", data.message);
                break;
        }
    }

    sendPlayerReady() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "player_ready" }));
            this.readyButton.disabled = true;
            this.readyButton.textContent = "Waiting for opponent...";
        }
    }

    updateStatus(message) {
        this.statusMessage.textContent = message;
    }

    updateScore() {
        this.scoreboard.textContent = `${this.score[0]} - ${this.score[1]}`;
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

    addEventListeners() {
        this.keyDownHandler = (e) => this.handleKey(e, "keydown");
        this.keyUpHandler = (e) => this.handleKey(e, "keyup");
        this.beforeUnloadHandler = () => this.ws?.close();

        document.addEventListener("keydown", this.keyDownHandler);
        document.addEventListener("keyup", this.keyUpHandler);
        window.addEventListener("beforeunload", this.beforeUnloadHandler);
    }

    handleKey(event, type) {
        if (this.ws?.readyState === WebSocket.OPEN && ["w", "s", "W", "S"].includes(event.key)) {
            const key = event.key.toLowerCase();
            console.log("Sending key event:", key);
            this.ws.send(JSON.stringify({ type, key }));
        }
    }

    async startGame(gameId) {
        this.page.app.stateManager.updateState("currentGame", true);
        this.setWebsocket(gameId);
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

    cleanup() {
        this.removeEventListeners();
        this.ws = null;
        this.dispatchEvent(new CustomEvent("gameOver"));
        this.page.app.stateManager.updateState("currentGame", false);
    }

    removeEventListeners() {
        document.removeEventListener("keydown", this.keyDownHandler);
        document.removeEventListener("keyup", this.keyUpHandler);
        window.removeEventListener("beforeunload", this.beforeUnloadHandler);
    }

    disconnectedCallback() {
        this.ws?.close();
        this.removeEventListeners();
    }
}

customElements.define("pong-game", Pong);