import Page from "./Page.js";
import TournamentBracket from "../customElements/TournamentBracket.js";

class TournamentPage extends Page {
    constructor(app) {
        super({
            name: "tournament",
            url: "/tournament",
            pageElement: "#Tournament",
            isProtected: true,
            app: app,
        });
        this.handleStartButtonClick = this.handleStartButtonClick.bind(this);
        this.elements = null;
    }

    async open() {
        super.open();
        this.unsubscribe = this.app.stateManager.subscribe(
            'currentTournament',
            (currentTournament) => this.render()
        );
    }

    render() {
        const cardsContainerEl = document.querySelector("#cards-container");
        const tournamentDetailsEl = document.querySelector("#tournament-details");
        const tournamentNameEl = document.querySelector("#tournament-name");
        const participantsInfoEl = document.querySelector("#participants-info");
        const partcipantsListEl = document.querySelector("#tournament-participants");
        const selectedUserCard = document.querySelector("user-profile#selected-participant");
        const tournamentBracketContainerEl = document.querySelector("#tournament-bracket-container");
        const tournamentBracketEl = document.querySelector("tournament-bracket");
        const tournament = this.app.stateManager.state.currentTournament;

        if (!tournament) {
            cardsContainerEl.classList.remove("d-none");
        } else {
            const { name, participants, participants_amount } = tournament;
            const isTournamentFull = participants.length === participants_amount;

            tournamentDetailsEl.classList.remove("d-none");
            tournamentNameEl.textContent = name + " 🏆";

            if (!isTournamentFull) {
                this.updatePartcipantsList(tournament);
                participantsInfoEl.classList.remove("d-none");
            } else {
                partcipantsListEl.classList.add("d-none");
                selectedUserCard.classList.add("d-none");
                participantsInfoEl.classList.add("d-none");

                tournamentBracketContainerEl.classList.remove("d-none");
                tournamentBracketEl.page = this;
                tournamentBracketEl.setTournament(tournament);
                if (tournament.final_game.status === "completed" || tournament.final_game.status === "interrupted") { 
                    if (this.unsubscribe) this.unsubscribe();
                    this.app.stateManager.updateState('currentTournament', null);
                }
            }
        }
    }

    handleStartButtonClick() {
        const { wsManager } = this.app;
        if (wsManager.tournamentWs) {
            wsManager.tournamentWs.send(JSON.stringify({
                type: "start",
            }));
        }
    }

    updatePartcipantsList(currentTournament) {
        if (!currentTournament) return;
        const partcipantsListEl = document.querySelector("#tournament-participants");
        const selectedUserCard = document.querySelector("user-profile#selected-participant");
        [partcipantsListEl, selectedUserCard].forEach(el => (el.page = this));

        partcipantsListEl.config = { selectedUserCard };
        partcipantsListEl.setState({ users: currentTournament.participants });
    }
}

export default TournamentPage;

