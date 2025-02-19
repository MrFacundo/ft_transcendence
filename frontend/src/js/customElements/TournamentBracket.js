import { settings } from "../settings.js";
import { getAvatarSrc } from "../utils.js";
import BaseElement from "./BaseElement.js";

class TournamentBracket extends BaseElement {
    constructor() {
        super().attachShadow({ mode: "open" });
        this.setupTemplate();
        this.state = {
            tournament: null,
            startButtonEnabled: false,
            participants: {
                semi1Player1: null,
                semi1Player2: null,
                semi2Player1: null,
                semi2Player2: null,
                finalPlayer1: null,
                finalPlayer2: null
            }
        };
        this._pageSetCallback = () => {
            this.unsubscribe = this.page.app.stateManager.subscribe(
                'currentTournament',
                (currentTournament) => this.setTournament(currentTournament)
            );
        };
    }

    checkIsParticipant(tournament) {
        const { user } = this.page.app.auth;
        if (!tournament || !user) return false;

        return ['semifinal_1_game', 'semifinal_2_game', 'final_game']
            .some(gameKey => {
                const game = tournament[gameKey];
                return game && 
                       game.status === "not_started" && 
                       [game.player1, game.player2].some(player => 
                           player && player.id === user.id
                       );
            });
    }

    async setTournament(tournament) {
        const startButtonEnabled = this.checkIsParticipant(tournament);
        const { semifinal_1_game, semifinal_2_game, final_game } = tournament;

        const participants = {
            semi1Player1: semifinal_1_game.player1,
            semi1Player2: semifinal_1_game.player2,
            semi2Player1: semifinal_2_game.player1,
            semi2Player2: semifinal_2_game.player2,
            finalPlayer1: final_game.player1,
            finalPlayer2: final_game.player2
        };

        this.setState({ tournament, startButtonEnabled, participants });

        if (final_game.status === "completed") {
            if (typeof this.unsubscribe === 'function') {
                this.unsubscribe();
                this.unsubscribe = null;
            }
            this.page.app.stateManager.updateState('currentTournament', null);
        }
    }

    async render() {
        if (!this.page) return;
        await this.renderParticipants();
        this.renderGames();
        this.renderStartButton();
        this.renderWinner();
    }

    async renderParticipant(elementId, player) {
        const participantEl = this.shadowRoot.getElementById(elementId);
        if (!participantEl || !player) return;

        const avatarImg = participantEl.querySelector(".avatar img");
        const usernameEl = participantEl.querySelector(".username");
        
        participantEl.style.opacity = 0;

        const avatarSrcPromise = getAvatarSrc(player, this.page.app.api.fetchAvatarObjectUrl);
        
        usernameEl.textContent = player.username;
        participantEl.setAttribute("data-player-id", player.id);
        
        if (player.id === this.page.app.auth.user?.id) {
            participantEl.style.backgroundColor = "#0d6efd";
        }

        avatarImg.src = await avatarSrcPromise;
        avatarImg.alt = player.username;
        
        participantEl.style.opacity = 1;
    }

    async renderParticipants() {
        const { participants } = this.state;
        
        await Promise.all([
            this.renderParticipant("semi1-player1", participants.semi1Player1),
            this.renderParticipant("semi1-player2", participants.semi1Player2),
            this.renderParticipant("semi2-player1", participants.semi2Player1),
            this.renderParticipant("semi2-player2", participants.semi2Player2),
            this.renderParticipant("final-player1", participants.finalPlayer1),
            this.renderParticipant("final-player2", participants.finalPlayer2)
        ]);
    }

    renderGame(game, type) {
        if (!game?.winner) return;

        const player1El = this.shadowRoot.getElementById(`${type}-player1`);
        const player2El = this.shadowRoot.getElementById(`${type}-player2`);
        if (!player1El || !player2El) return;

        player1El.querySelector(".score span").textContent = game.score_player1;
        player2El.querySelector(".score span").textContent = game.score_player2;

        const winnerEl = game.winner === game.player1.id ? player1El : player2El;
        winnerEl.style.backgroundColor = "#4CAF50";
    }

    renderGames() {
        const { tournament } = this.state;
        if (!tournament) return;

        const { semifinal_1_game, semifinal_2_game, final_game } = tournament;
        
        if (semifinal_1_game?.winner) this.renderGame(semifinal_1_game, "semi1");
        if (semifinal_2_game?.winner) this.renderGame(semifinal_2_game, "semi2");
        if (final_game?.winner) this.renderGame(final_game, "final");
    }

    renderStartButton() {
        const startButton = this.shadowRoot.querySelector(".start-button-container button");
        if (!startButton) return;

        const { startButtonEnabled } = this.state;
        startButton.style.display = startButtonEnabled ? "block" : "none";
        
        if (startButtonEnabled) {
            startButton.textContent = "START";
            startButton.disabled = false;
            startButton.style.cursor = "pointer";
        }
    }

    renderWinner() {
        const { tournament } = this.state;
        if (!tournament?.final_game?.winner) return;

        const { final_game } = tournament;
        const headerEl = this.shadowRoot.querySelector(".header h3");
        const winnerUsername = final_game.winner === final_game.player1.id ? 
            final_game.player1.username : 
            final_game.player2.username;
        headerEl.textContent = `Winner: ${winnerUsername}`;
    }

    handleStartButtonClick = () => {
        const startButton = this.shadowRoot.querySelector(".start-button-container button");
        startButton.textContent = "Waiting for opponent...";
        startButton.disabled = true;
        startButton.style.cursor = "default";
        this.page.handleStartButtonClick();
    };

    connectedCallback() {
        const startButton = this.shadowRoot.querySelector(".start-button-container button");
        if (startButton) {
            startButton.addEventListener("click", this.handleStartButtonClick);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        const startButton = this.shadowRoot.querySelector(".start-button-container button");
        if (startButton) {
            startButton.removeEventListener("click", this.handleStartButtonClick);
        }
    }
    
    setupTemplate() {
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
                padding: 40px;
            }

            .tournament-container {
                width: 100%;
                max-width: 1500px;
                margin: 0 auto;
            }

            .header {
                text-align: center;
                margin-bottom: 40px;
                color: white;
            }

            .header h3 {
                font-size: 2.5em;
                margin: 0;
                color: #ffd700;
            }

            .start-button-container {
                text-align: center;
                display: flex;
                width: 100%;
                justify-content: center;
            }

            .start-button-container button {
                font-size: 2.5em;
                margin: 0;
                color: #ffd700;
                padding: 17px;
                background: white;
                border-radius: 15px;
                transition: all 0.3s;
                cursor: pointer;
            }

            .tournament-bracket {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 40px;
            }

            .round {
                display: flex;
                flex-direction: column;
                gap: 60px;
            }

            .final {
                flex-direction: row;
            }

            .participant {
                width: 250px;
                height: 50px;
                background: #2a4189;
                border-radius: 25px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                position: relative;
                overflow: hidden;
                transition: all 0.3s;
                box-shadow: 0 1rem 1rem rgba(0, 0, 0, .2);
            }

            .avatar {
                width: 50px;
                height: 50px;
                border-radius: 25px;
                overflow: hidden;
                flex-shrink: 0;
            }

            .avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .participant-info {
                padding: 0 15px;
                color: white;
            }

            .username {
                font-weight: bold;
                margin-bottom: 2px;
            }

            .score {
                color: white;
                padding-right: 15px;
            }

            /* Responsive styles */
            @media (max-width: 1200px) {
                .participant {
                    width: 200px;
                    height: 45px;
                }
                
                .avatar {
                    width: 45px;
                    height: 45px;
                }
                
                .tournament-bracket {
                    gap: 30px;
                }
                
                .round {
                    gap: 45px;
                }
            }

            @media (max-width: 900px) {
                :host {
                    padding: 20px;
                }
                
                .participant {
                    width: 160px;
                    height: 40px;
                }
                
                .avatar {
                    width: 40px;
                    height: 40px;
                }
                
                .participant-info {
                    padding: 0 10px;
                    font-size: 0.9em;
                }
                
                .tournament-bracket {
                    gap: 20px;
                }
                
                .round {
                    gap: 30px;
                }
                
                .header h3 {
                    font-size: 2em;
                }
                
                .start-button-container button {
                    font-size: 2em;
                    padding: 12px;
                }
            }

            @media (max-width: 600px) {
                :host {
                    padding: 10px;
                }
                
                .participant {
                    width: 120px;
                    height: 35px;
                }
                
                .avatar {
                    width: 35px;
                    height: 35px;
                }
                
                .participant-info {
                    padding: 0 8px;
                    font-size: 0.8em;
                }
                
                .score {
                    padding-right: 8px;
                }
                
                .tournament-bracket {
                    gap: 15px;
                }
                
                .round {
                    gap: 20px;
                }
                
                .header h3 {
                    font-size: 1.5em;
                }
                
                .start-button-container button {
                    font-size: 1.5em;
                    padding: 10px;
                }
        }
        </style>

        <div class="tournament-container">
            <div class="header">
                <h3></h3>
            </div>
            
            <div class="tournament-bracket">
                <!-- Left Semifinals -->
                <div class="round">
                    <div class="participant" id="semi1-player1">
                        <div class="avatar">
                            <img src="${settings.EMPTY_AVATAR_URL}" alt="Player 1">
                        </div>
                        <div class="participant-info">
                            <div class="username">TBD</div>
                        </div>
                        <div class="score">
                            <span></span>
                        </div>
                    </div>
                    <div class="participant" id="semi1-player2">
                        <div class="avatar">
                            <img src="${settings.EMPTY_AVATAR_URL}" alt="Player 2">
                        </div>
                        <div class="participant-info">
                            <div class="username">TBD</div>
                        </div>
                        <div class="score">
                            <span></span>
                        </div>
                    </div>
                </div>
                
                <!-- Finals -->
                <div class="round final">
                    <div class="participant" id="final-player1">
                        <div class="avatar">
                            <img src="${settings.EMPTY_AVATAR_URL}" alt="Finalist 1">
                        </div>
                        <div class="participant-info">
                            <div class="username">TBD</div>
                        </div>
                        <div class="score">
                            <span></span>
                        </div>
                    </div>
                    <div class="participant" id="final-player2">
                        <div class="avatar">
                            <img src="${settings.EMPTY_AVATAR_URL}" alt="Finalist 2">
                        </div>
                        <div class="participant-info">
                            <div class="username">TBD</div>
                        </div>
                        <div class="score">
                            <span></span>
                        </div>
                    </div>
                </div>
                
                <!-- Right Semifinals -->
                <div class="round">
                    <div class="participant" id="semi2-player1">
                        <div class="avatar">
                            <img src="${settings.EMPTY_AVATAR_URL}" alt="Player 3">
                        </div>
                        <div class="participant-info">
                            <div class="username">TBD</div>
                        </div>
                                                    <div class="score">
                            <span></span>
                        </div>
                    </div>
                    <div class="participant" id="semi2-player2">
                        <div class="avatar">
                            <img src="${settings.EMPTY_AVATAR_URL}" alt="Player 4">
                        </div>
                        <div class="participant-info">
                            <div class="username">TBD</div>
                        </div>
                        <div class="score">
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="start-button-container">
                <button>START</button>
            </div>
        </div>
`;
    }
}

if (!customElements.get("tournament-bracket"))
    customElements.define("tournament-bracket", TournamentBracket);