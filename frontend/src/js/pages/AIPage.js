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
    this.handleGameOver = this.handleGameOver.bind(this);
  }

  async render() {
    const difficultyCards = this.mainElement.querySelectorAll("#ai-game-settings .card");

    difficultyCards.forEach(card => {
      card.onclick = () => {
        const difficulty = card.dataset.difficulty;
        if (!this.app.stateManager.state.currentGame) this.startGame(difficulty);
      };
    });

    this.mainElement.addEventListener("gameOver", this.handleGameOver);
  }

  startGame(difficulty) {
    const settingsEl = this.mainElement.querySelector("#ai-game-settings");
    const pongAiEl = this.mainElement.querySelector("pong-ai");
    pongAiEl.page = this;
    settingsEl.classList.add("d-none");
    pongAiEl.classList.remove("d-none");
    pongAiEl.startGame(difficulty);
  }

  handleGameOver(e) {
    const pongAiEl = this.mainElement.querySelector("pong-ai");
    const settingsEl = this.mainElement.querySelector("#ai-game-settings");
    setTimeout(() => {
      pongAiEl.classList.add("d-none");
      settingsEl.classList.remove("d-none");
    }, 3000);
  }

  close() {
    super.close();
    this.mainElement.removeEventListener("gameOver", this.handleGameOver);
  }
}

export default AIPage;