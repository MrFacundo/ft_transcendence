import Page from "./Page.js";
import "../customElements/PongRemote.js";

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
        if (this.app.stateManager.state.currentGame) return;

        const { mainElement, params } = this;
        const gameId = params["id"];
        const gameEl = mainElement.querySelector("pong-remote");
        gameEl.page = this;
    
        try {
            const handleResult = (game) => {
                const winnerUsername = game.winner === game.player1.id ? game.player1.username : game.player2.username;
                gameEl.displayResult(game.score_player1, game.score_player2, winnerUsername, game.status);
            };
            const game = await app.api.getGame(gameId);
            
            if (game.status === "not_started" || game.status === "in_progress") {
                gameEl.startGame(game);
                gameEl.addEventListener("gameOver", async () => {
                    const updatedGame = await app.api.getGame(gameId);
                    handleResult(updatedGame);
                    gameEl.displayPlayAgainButton();
                });
            } else if (game.status === "completed" || game.status === "interrupted") {
                handleResult(game);
                gameEl.updateInfoUI(game.id, game.player1, game.player2);
            }
        } catch (error) {
            console.error("Error fetching game instance:", error);
            gameEl.remove();
        }
    }
    
}