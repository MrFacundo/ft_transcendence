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
                    stateManager.setCurrentTournament(response);
                    wsManager.setupTournamentWebSocket();
                    showMessage(`Joined tournament: ${name}`);
                } catch (error) {
                    console.error("error", error);
                    showMessage(error.response?.data?.message || error, "error");
                }
            });
        });
    }

    updateTournamentsList() {
        const { stateManager } = this.app;
        const currentTournament = stateManager.currentTournament;
        if (!currentTournament) return;

        const tournamentItem = document.querySelector(`#tournament-${currentTournament.id}`);
        if (tournamentItem) {
            const badge = tournamentItem.querySelector(".badge");
            if (badge) badge.textContent = `${currentTournament.participants.length} / ${currentTournament.participants_amount}`;

            if (!tournamentItem.querySelector(".pending")) {
                const pendingButton = document.createElement("button");
                pendingButton.className = "pending btn btn-warning text-white";
                pendingButton.textContent = "Joined";
                tournamentItem.insertBefore(pendingButton, tournamentItem.querySelectorAll("span")[1]);
            }
        }
    }
}

export default TournamentPage;