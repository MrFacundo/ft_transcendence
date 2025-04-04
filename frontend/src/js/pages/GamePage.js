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
        const { mainElement, params } = this;
        const gameId = params["id"];
        const gameEl = mainElement.querySelector("pong-remote");
        gameEl.page = this;
    
        if (this.app.stateManager.state.currentGame) return;
    
        try {
            const game = await app.api.getGame(gameId);
            gameEl.setSideUsernames(game.player1.username, game.player2.username);
            gameEl.setAvatars(game.player1, game.player2);
            gameEl.setRandomBackground(gameId);

            const handleResult = (game) => {
                const winnerUsername = game.winner === game.player1.id ? game.player1.username : game.player2.username;
                gameEl.displayResult(game.score_player1, game.score_player2, winnerUsername, game.status);
            };
    
            if (game.status === "not_started" || game.status === "in_progress") {
                gameEl.startGame(gameId);
                gameEl.addEventListener("gameOver", async () => {
                    const updatedGame = await app.api.getGame(gameId);
                    handleResult(updatedGame);
                });
            } else if (game.status === "completed" || game.status === "interrupted") {
                handleResult(game);
            }
        } catch (error) {
            console.error("Error fetching game instance:", error);
            gameEl.remove();
        }
    }
    
}