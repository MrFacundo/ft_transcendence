import Page from "./Page.js";

class AIPage extends Page {
  constructor(app) {
    super({
      name: "ai",
      url: "/ai",
      pageElement: "#AI",
      isProtected: true,
      app: app,
    });
    this.initialized = false;
  }

  async render() {
    if (!this.initialized) {
      this.setupEventListeners();
      this.initialized = true;
    }
  }

  setupEventListeners() {
    const startBtn = document.getElementById("startGame");
    const difficultySelect = document.getElementById("difficulty");

    if (startBtn && difficultySelect) {
      startBtn.addEventListener("click", async () => {
        const difficulty = difficultySelect.value;
        await this.startGame(difficulty);
      });
    }
  }

  async startGame(difficulty) {
    try {
      const response = await this.app.api.createAIGame({ difficulty });
      document.getElementById("gameCanvas").classList.remove("d-none");
      // Game initialization code here
    } catch (error) {
      console.error("Failed to start AI game:", error);
    }
  }
}

export default AIPage;
