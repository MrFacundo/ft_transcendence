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
  }

  async render() {
    await this.domReady();

    const difficultySelect = document.querySelector("#difficulty");
    const startGameBtn = document.querySelector("#startGame");
    const mainContainer = document.querySelector("#main");
    const resultModal = document.querySelector("#resultModal");

    startGameBtn.onclick = () => {
      mainContainer.style.display = "none";
      resultModal.classList.add("d-none");

      const gameSection = document.createElement("section");
      gameSection.id = "Game";
      gameSection.style.cssText = `
        display:flex;justify-content:center;align-items:center;height:100vh;`;

      const pongAi = document.createElement("pong-ai");
      pongAi.setApp(this.app);
      pongAi.setAttribute("difficulty", difficultySelect.value);
      pongAi.addEventListener("gameEnd", (e) => {
        gameSection.remove();
        mainContainer.style.display = "block";
        resultModal.classList.remove("d-none");
      });

      document.body.appendChild(gameSection);
      gameSection.appendChild(pongAi);
    };
  }

  domReady() {
    return new Promise((resolve) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", resolve);
      } else resolve();
    });
  }

  close() {
    console.log("AIPage.close() called – cleaning up...");
    // Ensure the main container is visible.
    const mainContainer = document.querySelector("#main");
    if (mainContainer) {
      mainContainer.style.display = "block";
    }
    // Remove the game section if it exists.
    const gameSection = document.querySelector("#Game");
    if (gameSection) {
      gameSection.remove();
    }
  }
}

export default AIPage;
