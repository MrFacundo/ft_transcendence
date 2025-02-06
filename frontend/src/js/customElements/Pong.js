import { WS_URL } from "../constants.js";

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
        this.append(this.paddels.left, this.paddels.right, this.ball, this.scoreboard);
        this.score = [0, 0];
        this.updateScore();
        this.pressedKeys = [];
        this.playersJoined = [];
    }

    createElement(id) {
        const el = document.createElement("span");
        el.id = id;
        return el;
    }

    setWebsocket(id) {
        this.addEventListeners();
        this.ws = new WebSocket(
            `${WS_URL}/${id}/?token=${this.page.app.auth.accessToken}`
        );

        this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data));
        this.ws.onclose = () => this.cleanup();
    }

    handleMessage(data) {
        switch (data.type) {
            case "join":
                this.playersJoined.push(data.player);
                if (this.playersJoined.length === 2) {
                    this.ws.send(JSON.stringify({ type: "start_game" }));
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
                this.ws.close();
                break;
        }
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
        document.addEventListener("keydown", (e) => this.handleKey(e, "keydown"));
        document.addEventListener("keyup", (e) => this.handleKey(e, "keyup"));
        window.addEventListener("beforeunload", () => this.ws?.close());
    }

    handleKey(event, type) {
        if (this.ws?.readyState === WebSocket.OPEN && ["w", "s", "W", "S"].includes(event.key)) {
            const key = event.key.toLowerCase();
            console.log("Sending key event:", key);
            this.ws.send(JSON.stringify({ type, key }));
        }
    }

    async startGame(gameId) {
        this.setWebsocket(gameId);
        while (this.ws?.readyState !== WebSocket.OPEN) {
            await new Promise((res) => setTimeout(res, 1000));
        }
    }

    cleanup() {
        this.removeEventListeners();
        this.ws = null;
        this.dispatchEvent(new CustomEvent("gameOver"));
    }

    removeEventListeners() {
        document.removeEventListener("keydown", this.handleKey);
        document.removeEventListener("keyup", this.handleKey);
        window.removeEventListener("beforeunload", () => this.ws?.close());
    }

    disconnectedCallback() {
        this.ws?.close();
        this.removeEventListeners();
    }
}

customElements.define("pong-game", Pong);
