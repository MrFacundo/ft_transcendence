import Page from "./Page.js";
import "../customElements/PongAi.js";

class AIPage extends Page {
  constructor(app) {
    super({
      name: "ai_game",
      url: "/ai",
      pageElement: "#AI",
      isProtected: true,
      app: app,
    });
    this.handleGameEnd = this.handleGameEnd.bind(this);
  }

  async render() {
    const difficultyCards = this.mainElement.querySelectorAll("#ai-game-settings .card");

    difficultyCards.forEach(card => {
      card.onclick = () => {
        const difficulty = card.dataset.difficulty;
        this.startGame(difficulty);
      };
    });

    this.mainElement.addEventListener("gameEnd", this.handleGameEnd);
  }

  createGameObject(gameData) {
      const player1 = this.app.auth.user;
      const winner = gameData.playerScore > gameData.aiScore ? player1.id : "ai";
      return {
          id: "",
          player1: {
              id: player1.id,
              username: player1.username,
              email: player1.email,
              avatar_oauth: player1.avatar_oauth,
              avatar_upload: player1.avatar_upload,
              two_factor_method: player1.two_factor_method,
              new_email: player1.new_email,
              date_joined: player1.date_joined,
              game_stats: player1.game_stats || {
                  total_matches: "",
                  wins: "",
                  losses: ""
              },
              friendship_status: player1.friendship_status || ""
          },
          player2: {
              id: "ai",
              username: "AI",
              email: "",
              avatar_oauth: "",
              avatar_upload: "",
              two_factor_method: "",
              new_email: "",
              date_joined: "",
              game_stats: {
                  total_matches: "",
                  wins: "",
                  losses: ""
              },
              friendship_status: ""
          },
          channel_group_name: "",
          date_played: "",
          score_player1: gameData.playerScore,
          score_player2: gameData.aiScore,
          registered_on_blockchain: false,
          status: "completed",
          winner: winner,
          tournament: null
      };
  }


  startGame(difficulty) {
    this.app.stateManager.updateState("currentGame", true);
    const settingsEl = this.mainElement.querySelector("#ai-game-settings");
    const pongAiEl = this.mainElement.querySelector("pong-ai");
    const scoreBoardEl = this.mainElement.querySelector("score-board");
    settingsEl.classList.add("d-none");
    scoreBoardEl.classList.add("d-none");
    pongAiEl.classList.remove("d-none");
    pongAiEl.startGame(difficulty);
  }

  handleGameEnd(e) {
    const pongAiEl = this.mainElement.querySelector("pong-ai");
    pongAiEl && pongAiEl.classList.add("d-none");
    const settingsEl = this.mainElement.querySelector("#ai-game-settings");
    settingsEl.classList.remove("d-none");
    this.app.stateManager.updateState("currentGame", false);
    const scoreBoardEl = this.mainElement.querySelector("score-board");
    if (!scoreBoardEl)
        return;
    scoreBoardEl.page = this;
    const game = this.createGameObject(e.detail);
    scoreBoardEl.displayMatch(game);
    scoreBoardEl.classList.remove("d-none");
  }

  close() {
    super.close();
    this.mainElement.removeEventListener("gameEnd", this.handleGameEnd);
  }
}

export default AIPage;