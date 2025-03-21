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
        const cardsContainerEl = this.mainElement.querySelector("#cards-container");
        const tournamentDetailsEl = this.mainElement.querySelector("#tournament-details");
        const tournamentNameEl = this.mainElement.querySelector("#tournament-title");
        const participantsInfoEl = this.mainElement.querySelector("#participants-info");
        const partcipantsListEl = this.mainElement.querySelector("#tournament-participants");
        const selectedUserCard = this.mainElement.querySelector("user-profile#selected-participant");
        const tournamentBracketContainerEl = this.mainElement.querySelector("#tournament-bracket-container");
        const tournamentBracketEl = this.mainElement.querySelector("tournament-bracket");
        const tournament = this.app.stateManager.state.currentTournament;

        if (!tournament) {
            cardsContainerEl.classList.remove("d-none");
        } else {
            const { name, participants, participants_amount } = tournament;
            const isTournamentFull = participants.length === participants_amount;

            tournamentDetailsEl.classList.remove("d-none");
            tournamentNameEl.textContent = name;

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
                    this.app.wsManager.ws.currentTournament.close();
                    if (this.unsubscribe) this.unsubscribe();
                    this.app.stateManager.updateState('currentTournament', null);
                }
            }
        }
    }

    handleStartButtonClick() {
        const { wsManager } = this.app;
        if (wsManager.ws.currentTournament) {
            wsManager.ws.currentTournament.send(JSON.stringify({
                type: "start",
            }));
        }
    }

    updatePartcipantsList(currentTournament) {
        if (!currentTournament) return;
        const partcipantsListEl = this.mainElement.querySelector("#tournament-participants");
        const selectedUserCard = this.mainElement.querySelector("user-profile#selected-participant");
        [partcipantsListEl, selectedUserCard].forEach(el => (el.page = this));

        partcipantsListEl.config = { selectedUserCard };
        partcipantsListEl.setState({ users: currentTournament.participants });
    }
}

export default TournamentPage;

