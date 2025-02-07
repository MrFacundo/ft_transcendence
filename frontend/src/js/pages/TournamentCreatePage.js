import Page from "./Page.js";
import { formatErrorMessages } from "../utils.js";
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
        const { api } = this.app;
        const form = this.mainElement.querySelector("custom-form");
        const successMsg = this.mainElement.querySelector("#create-success");
        const createdName = this.mainElement.querySelector("#tournament-created-name");
        const createdParticipants = this.mainElement.querySelector("#tournament-created-participants");

        form.submitForm = async (formData) => {
            try {
                if (formData.tournament_name.length < 3 || formData.tournament_name.length > 20) {
                    throw new Error("Tournament name must be between 3 and 20 characters.");
                }
                const response = await api.createTournament(formData.tournament_name, formData.participants_amount);
                const successMessage = "Tournament created successfully.";
                form.showFormSuccess(successMessage);
                successMsg.textContent = successMessage;
                createdName.textContent = response.name;
                createdParticipants.textContent = "Participants: " + response.participants_amount;
                form.style.display = "none";
            } catch (error) {
                console.error("error", error);
                const errorMessage = error.response?.data ? formatErrorMessages(error.response.data) : error.message || "An unknown error occurred";
                form.showFormError(errorMessage);
            }
        }
    }
}

export default TournamentCreatePage;