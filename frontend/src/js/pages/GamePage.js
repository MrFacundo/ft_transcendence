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
        const scoreBoardEl = mainElement.querySelector("score-board");

        gameEl.page = this;
        scoreBoardEl.page = this;

        try {
            const gameInstance = await app.api.getGame(gameId);
            const showScoreBoard = () => {
                scoreBoardEl.displayMatch();
                gameEl.remove();
                scoreBoardEl.classList.remove("d-none");
            };

            if (gameInstance.status === "not_started") {
                gameEl.startGame(gameId);
                gameEl.addEventListener("gameOver", async () => {
                    console.log("Game over from Pong component");
                    this.app.currentGame = false;
                    showScoreBoard();
                });
            } else if (gameInstance.status === "completed") {
                showScoreBoard();
            } else {
                gameEl.remove();
            }
        } catch (error) {
            console.error("Error fetching game instance:", error);
            gameEl.remove();
        }
    }
}