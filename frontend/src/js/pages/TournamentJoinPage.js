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
    }

    async open() {
        super.open();
        this.unsubscribe = this.app.stateManager.subscribe(
            'openTournaments',
            (openTournaments) => this.updateTournamentsList(openTournaments)
        );
    }
    
    async render() {
        const { api, wsManager, stateManager } = this.app;
        const openTournaments = stateManager.state.openTournaments;
        const tournamentListElement = this.mainElement.querySelector("#tournament-list");

        this.populateTournamentList(openTournaments, tournamentListElement, api, stateManager, wsManager);
    }

    updateTournamentsList(openTournaments) {
        console.log("Updating tournaments list", openTournaments);
        const tournamentListElement = this.mainElement.querySelector("#tournament-list");
        const { api, wsManager, stateManager } = this.app;
        this.populateTournamentList(openTournaments, tournamentListElement, api, stateManager, wsManager);
        console.log("Updating tournaments list", openTournaments);
    }

    populateTournamentList(openTournaments, tournamentListElement, api, stateManager, wsManager) {
        tournamentListElement.innerHTML = '';
        openTournaments.forEach(({ id, name, participants, participants_amount }) => {
            const tournamentItem = document.createElement("li");
            tournamentItem.id = `tournament-${id}`;
            tournamentItem.className = "text-white list-group-item d-flex justify-content-between align-items-center shadow-lg p-4 my-3 rounded cursor-pointer";
            tournamentItem.style.backgroundColor = "#202428";
            tournamentItem.innerHTML = `<span>${name}</span><span class="badge bg-light text-dark">${participants.length} / ${participants_amount}</span>`;
            tournamentListElement.appendChild(tournamentItem);

            tournamentItem.addEventListener("click", async () => {
                try {
                    const response = await api.joinTournament(id);
                    stateManager.updateState('currentTournament', response);
                    stateManager.setInitialOpenTournaments();
                    wsManager.setupTournamentWebSocket();
                    showMessage(`Joined tournament: ${name}`);
                } catch (error) {
                    console.error("error", error);
                    showMessage(error.response?.data?.message || error, "error");
                }
            });
        });
    }
}

export default TournamentPage;