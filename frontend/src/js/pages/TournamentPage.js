import Page from "./Page.js";
import TournamentBracket from "../customElements/TournamentBracket.js";

const dummyTournament = {
    "id": 1,
    "participants": [
        {
            "id": 1,
            "username": "williamsnicholas",
            "avatar_oauth": null,
            "avatar_upload": null,
            "game_stats": {
                "total_matches": 44,
                "wins": 24,
                "losses": 20
            }
        },
        {
            "id": 2,
            "username": "matthew88",
            "avatar_oauth": null,
            "avatar_upload": "avatars/matthew88.jpg",
            "game_stats": {
                "total_matches": 50,
                "wins": 3,
                "losses": 47
            }
        },
        {
            "id": 3,
            "username": "sheri16",
            "avatar_oauth": null,
            "avatar_upload": "avatars/sheri16.jpg",
            "game_stats": {
                "total_matches": 54,
                "wins": 35,
                "losses": 19
            }
        },
        {
            "id": 10,
            "username": "olsonalexis",
            "avatar_oauth": null,
            "avatar_upload": "avatars/olsonalexis.jpg",
            "game_stats": {
                "total_matches": 55,
                "wins": 19,
                "losses": 36
            }
        }
    ],
    "semifinal_1_game1": {
        "id": 1,
        "player1": {
            "id": 3,
            "username": "sheri16",
            "email": "idixon@example.com",
            "avatar_oauth": null,
            "avatar_upload": "avatars/sheri16.jpg",
            "two_factor_method": "none",
            "new_email": null,
            "date_joined": "2025-02-09T23:47:25.057548Z",
            "game_stats": {
                "total_matches": 54,
                "wins": 35,
                "losses": 19
            },
            "friendship_status": null
        },
        "player2": {
            "id": 10,
            "username": "olsonalexis",
            "email": "carolyngarner@example.org",
            "avatar_oauth": null,
            "avatar_upload": "avatars/olsonalexis.jpg",
            "two_factor_method": "none",
            "new_email": null,
            "date_joined": "2025-02-09T23:47:29.035348Z",
            "game_stats": {
                "total_matches": 55,
                "wins": 19,
                "losses": 36
            },
            "friendship_status": null
        },
        "channel_group_name": "",
        "date_played": "2025-02-09T23:50:47.633353Z",
        "score_player1": 5,
        "score_player2": 1,
        "match_date": null,
        "status": "completed",
        "winner": 3,
        "tournament": 1
    },
    "semifinal_1_game2": {
        "id": 2,
        "player1": {
            "id": 1,
            "username": "williamsnicholas",
            "email": "trevinorussell@example.org",
            "avatar_oauth": null,
            "avatar_upload": null,
            "two_factor_method": "none",
            "new_email": null,
            "date_joined": "2025-02-09T23:47:23.728747Z",
            "game_stats": {
                "total_matches": 44,
                "wins": 24,
                "losses": 20
            },
            "friendship_status": null
        },
        "player2": {
            "id": 2,
            "username": "matthew88",
            "email": "taylorjohn@example.net",
            "avatar_oauth": null,
            "avatar_upload": "avatars/matthew88.jpg",
            "two_factor_method": "none",
            "new_email": null,
            "date_joined": "2025-02-09T23:47:24.057589Z",
            "game_stats": {
                "total_matches": 50,
                "wins": 3,
                "losses": 47
            },
            "friendship_status": null
        },
        "channel_group_name": "",
        "date_played": "2025-02-09T23:50:47.634337Z",
        "score_player1": 1,
        "score_player2": 5,
        "match_date": null,
        "status": "completed",
        "winner": 2,
        "tournament": 1
    },
    "name": "hairyball",
    "start_date": "2025-02-09T23:49:22.871239Z",
    "end_date": null,
    "participants_amount": 4,
    "semifinal_2_game1": null,
    "semifinal_2_game2": null,
    "final_game": {
        "id": 3,
        "player1": {
            "id": 3,
            "username": "sheri16",
            "email": "idixon@example.com",
            "avatar_oauth": null,
            "avatar_upload": "avatars/sheri16.jpg",
            "two_factor_method": "none",
            "new_email": null,
            "date_joined": "2025-02-09T23:47:25.057548Z",
            "game_stats": {
                "total_matches": 54,
                "wins": 35,
                "losses": 19
            },
            "friendship_status": null
        },
        "player2": {
            "id": 2,
            "username": "matthew88",
            "email": "taylorjohn@example.net",
            "avatar_oauth": null,
            "avatar_upload": "avatars/matthew88.jpg",
            "two_factor_method": "none",
            "new_email": null,
            "date_joined": "2025-02-09T23:47:24.057589Z",
            "game_stats": {
                "total_matches": 50,
                "wins": 3,
                "losses": 47
            },
            "friendship_status": null
        },
        "channel_group_name": "",
        "date_played": "2025-02-09T23:50:47.634337Z",
        "score_player1": 0,
        "score_player2": 5,
        "match_date": null,
        "status": "completed",
        "winner": 2,
        "tournament": 1
    },
};

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
        const tournamentBracketContainerEl = document.querySelector("#tournament-bracket-container");
        const tournamentBracketEl = document.querySelector("tournament-bracket");

        if (!tournament) {
            // Show Join/create cards 
            cardsContainerEl.classList.remove("d-none");
        } else {
            tournamentDetailsEl.classList.remove("d-none");
            const isTournamentFull = tournament.participants.length === tournament.participants_amount;

            tournamentNameEl.textContent = tournament.name + " 🏆";

            if (!isTournamentFull) {
                // Show participants list
                participantsInfoEl.classList.remove("d-none");
                [partcipantsListEl, selectedParticipantEl].forEach(el => (el.page = this));
                partcipantsListEl.initialize(selectedParticipantEl);
                partcipantsListEl.populateList({
                    users: tournament.participants,
                    actionText: null,
                    actionCallback: null,
                });
            } else {
                // Show tournament bracket
                tournamentBracketContainerEl.classList.remove("d-none");
                tournamentBracketEl.page = this;
                tournamentBracketEl.setTournament(dummyTournament);
            }
        }
    }

    updateParticipantsList(participant_id) {
        const participantsListEl = document.querySelector("#tournament-participants");
        if (!participantsListEl || participantsListEl.shadowRoot.querySelector(`user-profile-small[data-user-id="${participant_id}"]`)) return;

        const { stateManager } = this.app;
        const currentTournament = stateManager.currentTournament;
        if (!currentTournament) return;

        const participant = currentTournament.participants.find(p => p.id === participant_id);

        if (!participant) return;
        participantsListEl.addCard(participant);
    }

    handleStartButtonClick() {
        const { wsManager } = this.app;
        if (wsManager.tournamentWs) {
            wsManager.tournamentWs.send(JSON.stringify({
                type: "start",
            }));
        }
    }
}
export default TournamentPage;