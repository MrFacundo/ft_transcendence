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
        this.unsubscribe = this.app.stateManager.subscribe(
            'currentTournament',
            (currentTournament) => this.updatePartcipantsList(currentTournament),
            this
        );
    }

    render() {
        const { stateManager } = this.app;
        const tournament = stateManager.state.currentTournament;
        const cardsContainerEl = document.querySelector("#cards-container");
        const tournamentDetailsEl = document.querySelector("#tournament-details");
        const tournamentNameEl = document.querySelector("#tournament-name");
        const participantsInfoEl = document.querySelector("#participants-info");
        const partcipantsListEl = document.querySelector("#tournament-participants");
        const selectedUserCard = document.querySelector("user-profile#selected-participant");
        const tournamentBracketContainerEl = document.querySelector("#tournament-bracket-container");
        const tournamentBracketEl = document.querySelector("tournament-bracket");

        if (!tournament) {
            // Show Join/create cards 
            cardsContainerEl.classList.remove("d-none");
        } else {
            tournamentDetailsEl.classList.remove("d-none");
            tournamentNameEl.textContent = tournament.name + " 🏆";

            const isTournamentFull = tournament.participants.length === tournament.participants_amount;
            if (!isTournamentFull) {
                // Show participants list
                participantsInfoEl.classList.remove("d-none");
                [partcipantsListEl, selectedUserCard].forEach(el => (el.page = this));

                partcipantsListEl.config = { selectedUserCard };
                partcipantsListEl.setState ({ users: tournament.participants });
            } else {
                // Show tournament bracket
                tournamentBracketContainerEl.classList.remove("d-none");
                tournamentBracketEl.page = this;
                tournamentBracketEl.setTournament(tournament);
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
        const partcipantsListEl = document.querySelector("#tournament-participants");
        const selectedUserCard = document.querySelector("user-profile#selected-participant");
        [partcipantsListEl, selectedUserCard].forEach(el => (el.page = this));

        partcipantsListEl.config = { selectedUserCard };
        partcipantsListEl.setState({ users: currentTournament.participants });
    }
}

export default TournamentPage;

