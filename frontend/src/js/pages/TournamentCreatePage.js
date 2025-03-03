import Page from "./Page.js";
import { formatErrorMessages, showMessage } from "../utils.js";
import "../customElements/CustomForm.js";

class TournamentCreatePage extends Page {
    constructor(app) {
        super({
            name: "tournament-create",
            url: "/tournament-create",
            pageElement: "#TournamentCreate",
            isProtected: true,
            app: app,
        });
    }

    render() {
        const { api, wsManager, stateManager } = this.app;

        if (stateManager.currentTournament) {
            this.app.navigate("/tournament");
            return;
        }

        const form = this.mainElement.querySelector("custom-form");

        form.submitForm = async (formData) => {
            try {
                if (!formData['tournament-name'] || formData['tournament-name'].length < 3 || formData['tournament-name'].length > 20) {
                    throw new Error('Tournament name must be between 3 and 20 characters.');
                }
                const response = await api.createTournament(formData['tournament-name'], formData['participants-amount']);
                stateManager.updateState('currentTournament', response);
                wsManager.setupTournamentWebSocket();
                showMessage("Tournament created successfully.");
                this.app.navigate("/tournament");
            } catch (error) {
                console.error("error", error);
                const errorMessage = error.response?.data ? formatErrorMessages(error.response.data) : error.message || "An unknown error occurred";
                form.showFormError(errorMessage);
            }
        }
    }
}

export default TournamentCreatePage;