import Page from "./Page.js";
import "../customElements/ScoreBoard.js";
import "../customElements/Pong.js";

export default class GamePage extends Page {
    constructor(app) {
        super({
            name: "game",
            url: "/game/:id",
            pageElement: "#Game",
            isProtected: true,
            app: app,
        });
    }

    async render(app) {
        const { mainElement, params } = this;
        const gameId = params["id"];
        const gameEl = mainElement.querySelector("pong-game");

        gameEl.page = this;

        try {
            const gameInstance = await app.api.getGame(gameId);

            if (gameInstance.status === "not_started") {
                gameEl.startGame(gameId);
                gameEl.addEventListener("gameOver", async () => {
                    this.app.stateManager.currentGame = null;
                    this.showScoreBoard();
                });
            } else if (gameInstance.status === "completed" || gameInstance.status === "interrupted") {
                this.showScoreBoard();
            } else {
                gameEl.remove();
            }
        } catch (error) {
            console.error("Error fetching game instance:", error);
            gameEl.remove();
        }
    }

    showScoreBoard() {
        const { mainElement } = this;
        const gameEl = mainElement.querySelector("pong-game");
        const scoreBoardEl = mainElement.querySelector("score-board");
        scoreBoardEl.page = this;
        scoreBoardEl.displayMatch();
        gameEl.remove();
        scoreBoardEl.classList.remove("d-none");
    }
}