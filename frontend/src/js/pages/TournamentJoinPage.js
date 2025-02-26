import Page from "./Page.js";
import { showMessage } from "../utils.js";

class TournamentPage extends Page {
    constructor(app) {
        super({
            name: "tournament-join",
            url: "/tournament-join",
            pageElement: "#TournamentJoin",
            isProtected: true,
            app: app,
        });
        this.unsubscribe = this.app.stateManager.subscribe(
            'currentTournament',
            (currentTournament) => this.updateTournamentsList(currentTournament)
        );
    }

    async render() {
        const { api, wsManager, stateManager } = this.app;
        const openTournaments = await api.getTournaments();
        const tournamentListElement = document.querySelector("#tournament-list");

        openTournaments.forEach(({ id, name, participants, participants_amount }) => {
            const tournamentItem = document.createElement("li");
            tournamentItem.id = `tournament-${id}`;
            tournamentItem.className = "list-group-item d-flex justify-content-between align-items-center shadow-lg p-4 my-3 rounded cursor-pointer";
            tournamentItem.innerHTML = `<span>${name}</span><span class="badge bg-light text-dark">${participants.length} / ${participants_amount}</span>`;
            tournamentListElement.appendChild(tournamentItem);

            tournamentItem.addEventListener("click", async () => {
                try {
                    const response = await api.joinTournament(id);
                    stateManager.updateState('currentTournament', response);
                    this.updateTournamentsList(response);
                    wsManager.setupTournamentWebSocket();
                    showMessage(`Joined tournament: ${name}`);
                } catch (error) {
                    console.error("error", error);
                    showMessage(error.response?.data?.message || error, "error");
                }
            });
        });
    }

    // updates list of tournaments
    updateTournamentsList(tournaments) {
    }
}

export default TournamentPage;