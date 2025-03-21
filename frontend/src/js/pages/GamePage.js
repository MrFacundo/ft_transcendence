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
            const game = await app.api.getGame(gameId);
            gameEl.setSideUsernames(game.player1.username, game.player2.username);

            if (game.status === "not_started" || game.status === "in_progress") {
                gameEl.startGame(gameId);
                gameEl.addEventListener("gameOver", async () => this.showScoreBoard(gameId));
            } else if (game.status === "completed" || game.status === "interrupted") {
                this.showScoreBoard(gameId);
            } else {
                gameEl.remove();
            }
        } catch (error) {
            console.error("Error fetching game instance:", error);
            gameEl.remove();
        }
    }

    async showScoreBoard(gameId) {
        const { mainElement } = this;
        const gameEl = mainElement.querySelector("pong-game");
        const scoreBoardEl = mainElement.querySelector("score-board");
        if (!scoreBoardEl)
            return;
        scoreBoardEl.page = this;
        scoreBoardEl.displayMatch(await this.app.api.getGame(gameId));
        gameEl && gameEl.remove();
        scoreBoardEl.classList.remove("d-none");
    }
}