import { EMPTY_AVATAR_URL } from "../constants.js";
import { getAvatarSrc } from "../utils.js";

class TournamentBracket extends HTMLElement {
    constructor() {
        super().attachShadow({ mode: "open" });
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
                    transition: opacity 0.3s;
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
                                <img src="${EMPTY_AVATAR_URL}" alt="Player 1">
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
                                <img src="${EMPTY_AVATAR_URL}" alt="Player 2">
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
                                <img src="${EMPTY_AVATAR_URL}" alt="Finalist 1">
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
								<img src="${EMPTY_AVATAR_URL}" alt="Finalist 2">
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
                                <img src="${EMPTY_AVATAR_URL}" alt="Player 3">
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
                                <img src="${EMPTY_AVATAR_URL}" alt="Player 4">
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

    updateParticipant = async (elementId, player) => {
        const { auth } = this.page.app;

        const participantEl = this.shadowRoot.getElementById(elementId);
        if (!participantEl || !player) return;

        const avatarImg = participantEl.querySelector(".avatar img");
        const usernameEl = participantEl.querySelector(".username");
        participantEl.style.opacity = 0;

        avatarImg.src = await getAvatarSrc(player, this.page.app.api.fetchAvatarObjectUrl);
        avatarImg.alt = player.username;
        usernameEl.textContent = player.username;

        participantEl.setAttribute("data-player-id", player.id);

        participantEl.style.opacity = 1;
        if (player.id === auth.user.id) {
            participantEl.style.backgroundColor = "#0d6efd";
        }
    };

    updateGame(game, type) {
        if (!game?.winner) return;

        const player1El = this.shadowRoot.getElementById(`${type}-player1`);
        const player2El = this.shadowRoot.getElementById(`${type}-player2`);
        if (!player1El || !player2El) return;

        player1El.querySelector(".score span").textContent = game.score_player1;
        player2El.querySelector(".score span").textContent = game.score_player2;

        const winnerEl = game.winner === game.player1.id ? player1El : player2El;
        winnerEl.style.backgroundColor = "#4CAF50";

        const finalPlayer = game.winner === game.player1.id ? game.player1 : game.player2;
        this.updateParticipant(`${type === "semi1" ? "final-player1" : "final-player2"}`, finalPlayer);
    }

    async setTournament(tournament) {
        if (!tournament) return;

        const { semifinal_1_game, semifinal_2_game, final_game } = tournament;

        await this.updateParticipant("semi1-player1", semifinal_1_game.player1);
        await this.updateParticipant("semi1-player2", semifinal_1_game.player2);
        await this.updateParticipant("semi2-player1", semifinal_2_game.player1);
        await this.updateParticipant("semi2-player2", semifinal_2_game.player2);

        if (semifinal_1_game.winner) this.updateGame(semifinal_1_game, "semi1");
        if (semifinal_2_game.winner) this.updateGame(semifinal_2_game, "semi2");
        if (final_game?.winner) this.updateGame(final_game, "final");

        this.shadowRoot.querySelector(".start-button-container button")
            .addEventListener("click", this.handleStartButtonClick.bind(this));
    }

    handleStartButtonClick() {
        const button = this.shadowRoot.querySelector(".start-button-container button");
        button.textContent = "Waiting for opponent...";
        button.disabled = true;
        button.style.cursor = "default";
        this.page.handleStartButtonClick();
    }

    setTournamentOver(winner) {
        this.shadowRoot.querySelector(".start-button-container button").remove();
        const headerEl = this.shadowRoot.querySelector(".header h3");
        headerEl.textContent = `Winner: ${winner.username}`;
    }

    disconnectedCallback() {
        const button = this.shadowRoot.querySelector(".start-button-container button");
        if (button) {
            button.removeEventListener("click", this.handleStartButtonClick);
        }
    }
}

if (!customElements.get("tournament-bracket"))
    customElements.define("tournament-bracket", TournamentBracket);