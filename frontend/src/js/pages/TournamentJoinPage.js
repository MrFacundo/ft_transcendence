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

    appendPendingButton(tournamentItem) {
        if (!tournamentItem.querySelector(".pending")) {
            const pendingButton = document.createElement("button");
            pendingButton.className = "pending btn btn-warning text-white";
            pendingButton.textContent = "Joined";
            const spans = tournamentItem.querySelectorAll("span");
            tournamentItem.insertBefore(pendingButton, spans[1]);
        }
    }

    async render() {
        const { api } = this.app;
        const openTournaments = await api.getTournaments();
        const tournamentListElement = document.querySelector("#tournament-list");

        openTournaments.forEach((tournament) => {
            const tournamentItem = document.createElement("li");
            tournamentItem.className = "list-group-item d-flex justify-content-between align-items-center shadow-lg p-4 my-3 rounded cursor-pointer";
            tournamentItem.innerHTML = `<span>${tournament.name}</span><span class="badge bg-light text-dark">${tournament.participants.length} / ${tournament.participants_amount}</span>`;
            tournamentListElement.appendChild(tournamentItem);

            if (tournament.participants.some(participant => participant.id === this.app.auth.user.id)) {
                this.appendPendingButton(tournamentItem);
            }

            tournamentItem.addEventListener("click", async () => {
                try {
                    await api.joinTournament(tournament.id);
                    showMessage(`Joined tournament: ${tournament.name}`);
                    this.appendPendingButton(tournamentItem);
                } catch (error) {
                    showMessage(error.response.data.message, "error");
                }
            });
        });
    }
}

export default TournamentPage;