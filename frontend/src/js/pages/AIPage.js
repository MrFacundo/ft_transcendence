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
        if (!this.app.stateManager.state.currentGame) this.startGame(difficulty);
      };
    });

    this.mainElement.addEventListener("gameEnd", this.handleGameEnd);
  }

  createGameObject(gameData) {
      const player1 = this.app.auth.user;
      const winner = gameData.playerScore > gameData.opponentScore ? player1.id : "ai";
      const defaultStats = { total_matches: "", wins: "", losses: "" };
      const defaultPlayer = {
          id: "",
          username: "",
          email: "",
          avatar_oauth: "",
          avatar_upload: "",
          two_factor_method: "",
          new_email: "",
          date_joined: "",
          game_stats: defaultStats,
          friendship_status: ""
      };
  
      return {
          id: "",
          player1: {
              ...defaultPlayer,
              id: player1.id,
              username: player1.username,
              email: player1.email,
              avatar_oauth: player1.avatar_oauth,
              avatar_upload: player1.avatar_upload,
              two_factor_method: player1.two_factor_method,
              new_email: player1.new_email,
              date_joined: player1.date_joined,
              game_stats: player1.game_stats || defaultStats,
              friendship_status: player1.friendship_status || ""
          },
          player2: { ...defaultPlayer, id: "ai", username: "AI" },
          channel_group_name: "",
          date_played: "",
          score_player1: gameData.playerScore,
          score_player2: gameData.opponentScore,
          registered_on_blockchain: false,
          status: "completed",
          winner: winner,
          tournament: null
      };
  }

  startGame(difficulty) {
    const settingsEl = this.mainElement.querySelector("#ai-game-settings");
    const pongAiEl = this.mainElement.querySelector("pong-ai");
    pongAiEl.page = this;
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
    const scoreBoardEl = this.mainElement.querySelector("score-board");
    if (!scoreBoardEl)
        return;
    scoreBoardEl.page = this;
    scoreBoardEl.displayMatch(this.createGameObject(e.detail));
    scoreBoardEl.classList.remove("d-none");
  }

  close() {
    super.close();
    this.mainElement.removeEventListener("gameEnd", this.handleGameEnd);
  }
}

export default AIPage;