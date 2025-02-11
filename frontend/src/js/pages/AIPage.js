// AIPage.js
import Page from "./Page.js";
import "../customElements/UserProfileCard.js";
// Import PongAi.js so that the <pong-ai> element is registered.
import "../customElements/PongAi.js";

class AIPage extends Page {
  constructor(app) {
    super({
      name: "ai",
      url: "/ai",
      pageElement: "#AI", // This should match the container holding your AI settings in your HTML.
      isProtected: true,
      app: app,
    });
  }

  async render() {
    // Wait until the DOM is fully loaded.
    if (document.readyState === "loading") {
      await new Promise((resolve) => {
        document.addEventListener("DOMContentLoaded", resolve);
      });
    }

    // Retrieve required DOM elements
    const difficultySelect = document.querySelector("#difficulty");
    const startGameBtn = document.querySelector("#startGame");
    const botProfile = document.querySelector("user-profile[bot='true']");
    const mainContainer = document.querySelector("#main");

    if (!difficultySelect || !startGameBtn || !botProfile || !mainContainer) {
      console.error("Required AI page elements not found");
      return;
    }

    // Initialize the bot profile
    botProfile.page = this;

    // Handle game start
    startGameBtn.addEventListener("click", () => {
      const difficulty = difficultySelect.value;

      // Hide main container
      mainContainer.style.display = "none";

      // Setup game container
      let gameSection = document.querySelector("#Game");
      if (!gameSection) {
        gameSection = document.createElement("section");
        gameSection.id = "Game";
        document.body.appendChild(gameSection);
      }

      // Center the game
      gameSection.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 0;
        `;

      // Create pong game
      let pongAi = gameSection.querySelector("pong-ai");
      if (!pongAi) {
        pongAi = document.createElement("pong-ai");
        gameSection.appendChild(pongAi);
      }

      // Start the game
      this.startAIGame(difficulty);
    });
  }

  async startAIGame(difficulty) {
    try {
      // Optionally, create a new AI game instance via the API.
      let game;
      if (this.app.api && typeof this.app.api.createAIGame === "function") {
        game = await this.app.api.createAIGame({ difficulty });
      } else {
        // Simulate a game object if no API method is available.
        game = { id: null };
      }

      // Find the AI settings container.
      let aiSection =
        typeof this.pageElement === "string"
          ? document.querySelector(this.pageElement)
          : this.pageElement;

      // Hide the AI settings (which include Game Settings and AI Opponent info).
      if (aiSection) {
        aiSection.style.display = "none";
      } else {
        console.warn("AI section not found; it may have already been removed.");
      }

      // Create (or reveal) a new Game section to hold the game.
      let gameSection = document.querySelector("#Game");
      if (!gameSection) {
        console.warn("Game section not found; creating one dynamically.");
        gameSection = document.createElement("section");
        gameSection.id = "Game";
        document.body.appendChild(gameSection);
      }

      // Style the Game section so the game is centered.
      gameSection.style.display = "flex";
      gameSection.style.justifyContent = "center";
      gameSection.style.alignItems = "center";
      gameSection.style.height = "100vh"; // Full viewport height for centering
      gameSection.classList.remove("d-none");

      // Look for an existing <pong-ai> element; if not, create one.
      let pongAi = gameSection.querySelector("pong-ai");
      if (!pongAi) {
        pongAi = document.createElement("pong-ai");
        gameSection.appendChild(pongAi);
      }

      // Pass the current page context and game ID (if any) to the <pong-ai> element.
      pongAi.page = this;
      if (game.id) {
        pongAi.setAttribute("game-id", game.id);
      }

      // Save the current game ID in the app state.
      this.app.currentGame = game.id;

      // Since this is an AI game, no WebSocket connection is required.
      // Start the local game by calling startGame() on the <pong-ai> element.
      if (typeof pongAi.startGame === "function") {
        pongAi.startGame();
      } else {
        throw new Error("Pong AI game not properly initialized");
      }
    } catch (error) {
      console.error("Error starting AI game:", error);
      // If an error occurs, optionally revert the changes:
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
