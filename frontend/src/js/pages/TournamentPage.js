import Page from "./Page.js";
import "../customElements/Bracket.js";

class TournamentPage extends Page {
    constructor(app) {
        super({
            name: "tournament",
            url: "/tournament",
            pageElement: "#Tournament",
            isProtected: true,
            app: app,
        });
    }

    render() {
        const { stateManager } = this.app;
        const tournament = stateManager.currentTournament;
        const cardsContainerEl = document.querySelector("#cards-container");
        const tournamentDetailsEl = document.querySelector("#tournament-details");
        const tournamentNameEl = document.querySelector("#tournament-name");
        const participantsInfoEl = document.querySelector("#participants-info");
        const partcipantsListEl = document.querySelector("#tournament-participants");
        const selectedParticipantEl = document.querySelector("#selected-participant");
        const tournamentBracketEl = document.querySelector("#tournament-bracket");

        if (!tournament) {
            cardsContainerEl.classList.remove("d-none");
        } else {
            tournamentDetailsEl.classList.remove("d-none");
            const isTournamentFull = tournament.participants.length === tournament.participants_amount;
            
            tournamentNameEl.textContent = tournament.name + " 🏆";
        
            if (!isTournamentFull) {
                participantsInfoEl.classList.remove("d-none");
                [partcipantsListEl, selectedParticipantEl].forEach(el => (el.page = this));
                partcipantsListEl.initialize(selectedParticipantEl);
                partcipantsListEl.populateList({
                    users: tournament.participants,
                    actionText: null,
                    actionCallback: null,
                });
            } else {
                tournamentBracketEl.classList.remove("d-none");
            }
        }
    }

    updateCurrentTournamentUI(participant_id) {
        const participantsListEl = document.querySelector("#tournament-participants");
        if (!participantsListEl || participantsListEl.shadowRoot.querySelector(`user-profile-small[data-user-id="${participant_id}"]`)) return;
        
        const { stateManager } = this.app;
        const currentTournament = stateManager.currentTournament;
        if (!currentTournament) return;
        
        const participant = currentTournament.participants.find(p => p.id === participant_id);
        
        if (!participant) return;
        participantsListEl.addCard(participant);
    }
}


export default TournamentPage;