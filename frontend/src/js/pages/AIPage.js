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
    const difficultySelect = document.querySelector("#difficulty");
    const startGameBtn = document.querySelector("#startGame");
    const resultModal = document.querySelector("#resultModal");
    const settingsEl = document.querySelector("#ai-game-settings");

    startGameBtn.onclick = () => {
      this.app.stateManager.updateState("currentGame", true);

      resultModal.classList.add("d-none");
      settingsEl.classList.add("d-none");
      const gameEl = document.createElement("div");
      gameEl.id = "Game";
      gameEl.style.cssText = `display:flex;justify-content:center;align-items:center;height:100vh;`;

      const pongAi = document.createElement("pong-ai");
      pongAi.setApp(this.app);
      pongAi.setAttribute("difficulty", difficultySelect.value);

      this.mainElement.appendChild(gameEl);
      gameEl.appendChild(pongAi);
    };
    
    this.mainElement.addEventListener("gameEnd", this.handleGameEnd);
  }

  handleGameEnd(e) {
    const gameEl = document.querySelector("#Game");
    gameEl && gameEl.remove();
    const resultModal = document.querySelector("#resultModal");
    const settingsEl = document.querySelector("#ai-game-settings");
    resultModal.classList.remove("d-none");
    settingsEl.classList.remove("d-none");
    this.app.stateManager.updateState("currentGame", false);
  }

  close() {
    super.close();
    this.mainElement.removeEventListener("gameEnd", this.handleGameEnd);
  }
}

export default AIPage;