import Page from "./Page.js";
import "../customElements/PongAi.js";

class AIPage extends Page {
  constructor(app) {
    super({
      name: "ai",
      url: "/ai",
      pageElement: "#AI",
      isProtected: true,
      app: app,
    });
    this.handleGameEnd = this.handleGameEnd.bind(this);
  }

  async render() {
    const difficultyCards = document.querySelectorAll("#ai-game-settings .card");

    difficultyCards.forEach(card => {
      card.onclick = () => {
        const difficulty = card.dataset.difficulty;
        this.startGame(difficulty);
      };
    });

    this.mainElement.addEventListener("gameEnd", this.handleGameEnd);
  }

  startGame(difficulty) {
    this.app.stateManager.updateState("currentGame", true);

    const settingsEl = document.querySelector("#ai-game-settings");
    settingsEl.classList.add("d-none");

    const gameEl = document.createElement("div");
    gameEl.id = "Game";
    gameEl.style.cssText = `display:flex;justify-content:center;align-items:start;height:100vh;`;

    const pongAi = document.createElement("pong-ai");
    pongAi.setApp(this.app);
    pongAi.setAttribute("difficulty", difficulty);

    this.mainElement.appendChild(gameEl);
    gameEl.appendChild(pongAi);
  }

  handleGameEnd(e) {
    const gameEl = document.querySelector("#Game");
    gameEl && gameEl.remove();
    const settingsEl = document.querySelector("#ai-game-settings");
    settingsEl.classList.remove("d-none");
    this.app.stateManager.updateState("currentGame", false);
  }

  close() {
    super.close();
    this.mainElement.removeEventListener("gameEnd", this.handleGameEnd);
  }
}

export default AIPage;