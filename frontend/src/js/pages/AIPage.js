import Page from "./Page.js";
import "../customElements/UserProfileCard.js";
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
  }

  async render() {
    if (document.readyState === "loading") {
      await new Promise((resolve) => {
        document.addEventListener("DOMContentLoaded", resolve);
      });
    }

    const difficultySelect = document.querySelector("#difficulty");
    const startGameBtn = document.querySelector("#startGame");
    const botProfile = document.querySelector("user-profile[bot='true']");
    const mainContainer = document.querySelector("#main");

    if (!difficultySelect || !startGameBtn || !botProfile || !mainContainer) {
      console.error("Required AI page elements not found");
      return;
    }

    botProfile.page = this;

    startGameBtn.addEventListener("click", () => {
      const difficulty = difficultySelect.value;

      mainContainer.style.display = "none";

      let gameSection = document.querySelector("#Game");
      if (!gameSection) {
        gameSection = document.createElement("section");
        gameSection.id = "Game";
        document.body.appendChild(gameSection);
      }

      gameSection.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 0;
        `;

      let pongAi = gameSection.querySelector("pong-ai");
      if (!pongAi) {
        pongAi = document.createElement("pong-ai");
        gameSection.appendChild(pongAi);
      }

      this.startAIGame(difficulty);
    });
  }

  async startAIGame(difficulty) {
    try {
      let game;
      if (this.app.api && typeof this.app.api.createAIGame === "function") {
        game = await this.app.api.createAIGame({ difficulty });
      } else {
        game = { id: null };
      }

      let aiSection =
        typeof this.pageElement === "string"
          ? document.querySelector(this.pageElement)
          : this.pageElement;

      if (aiSection) {
        aiSection.style.display = "none";
      } else {
        console.warn("AI section not found; it may have already been removed.");
      }

      let gameSection = document.querySelector("#Game");
      if (!gameSection) {
        console.warn("Game section not found; creating one dynamically.");
        gameSection = document.createElement("section");
        gameSection.id = "Game";
        document.body.appendChild(gameSection);
      }

      gameSection.style.display = "flex";
      gameSection.style.justifyContent = "center";
      gameSection.style.alignItems = "center";
      gameSection.style.height = "100vh"; 
      gameSection.classList.remove("d-none");

      let pongAi = gameSection.querySelector("pong-ai");
      if (!pongAi) {
        pongAi = document.createElement("pong-ai");
        gameSection.appendChild(pongAi);
      }

      pongAi.page = this;
      if (game.id) {
        pongAi.setAttribute("game-id", game.id);
      }

      this.app.currentGame = game.id;

      if (typeof pongAi.startGame === "function") {
        pongAi.startGame();
      } else {
        throw new Error("Pong AI game not properly initialized");
      }
    } catch (error) {
      console.error("Error starting AI game:", error);
      let aiSection =
        typeof this.pageElement === "string"
          ? document.querySelector(this.pageElement)
          : this.pageElement;
      const gameSection = document.querySelector("#Game");
      if (aiSection) {
        aiSection.style.display = "";
      }
      if (gameSection) {
        gameSection.classList.add("d-none");
      }
      alert("Failed to start game");
    }
  }
}

export default AIPage;
