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
  }

  async render() {
    const difficultyCards = this.mainElement.querySelectorAll("#ai-game-settings .card");

    difficultyCards.forEach(card => {
      card.onclick = () => {
        const difficulty = card.dataset.difficulty;
        if (!this.app.stateManager.state.currentGame) this.startGame(difficulty);
      };
    });
  }

  startGame(difficulty) {
    const settingsEl = this.mainElement.querySelector("#ai-game-settings");
    const pongAiEl = this.mainElement.querySelector("pong-ai");
    pongAiEl.page = this;
    settingsEl.classList.add("d-none");
    pongAiEl.classList.remove("d-none");
    pongAiEl.startGame(difficulty);
  }
}

export default AIPage;