import { EMPTY_AVATAR_URL } from "../constants.js";
import { getAvatarSrc } from "../utils.js";

class ScoreBoard extends HTMLElement {
    constructor() {
        super().attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
        <style>
            #scoreboard {
                max-width: 800px;
                margin: 2rem auto;
                text-align: center;
                background: #007bff;
                border-radius: 8px;
                padding: 1.5rem;
                color: #fff;
                font-family: Arial, sans-serif;
            }
            #scoreboard-title { 
                margin-bottom: 1rem; 
                font-size: 1.5rem; 
                font-weight: bold; 
            }
            
            .row { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 1rem; 
            }
            
            .col-avatar img { 
                border-radius: 50%; 
                object-fit: cover; 
                border: 1px solid #dee2e6; 
                transition: opacity 0.3s; 
            }
            
            .score { 
                padding: 0 15px; 
                flex: 4; 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                font-size: 1.25rem; 
            }
            
            .text-danger { 
                color: #dc3545; 
            }
        </style>
        <div id="scoreboard">
            <div id="scoreboard-title">WELL PONGED</div>
            <div class="row">
                <div class="col-avatar"><img id="avatar-1" src="${EMPTY_AVATAR_URL}" alt="Avatar" width="100" height="100"></div>
                <div class="score">
                    <div id="username-1"></div>
                    <div id="score-1">0</div>
                    <div class="text-danger">VS</div>
                    <div id="score-2">0</div>
                    <div id="username-2"></div>
                </div>
                <div class="col-avatar"><img id="avatar-2" src="${EMPTY_AVATAR_URL}" alt="Avatar" width="100" height="100"></div>
            </div>
        </div>`;
    }

    async displayMatch() {
        const { api } = this.page.app;
        const match = await api.getGame(this.page.params.id);
        if (!match) return;

        const setElement = (id, value) => this.shadowRoot.getElementById(id).textContent = value;
        const setAvatar = async (id, user) => {
            const avatarSrc = await getAvatarSrc(user, api.fetchAvatarObjectUrl);
            this.shadowRoot.getElementById(id).src = avatarSrc;
        };
        
        await setAvatar("avatar-1", match.player1);
        setElement("username-1", match.player1.username);
        setElement("score-1", match.score_player1);

        await setAvatar("avatar-2", match.player2);
        setElement("username-2", match.player2.username);
        setElement("score-2", match.score_player2);

        const winner = match.player1.id === match.winner ? 1 : 2;
        ["avatar", "username", "score"].forEach((key) => {
            this.shadowRoot.getElementById(`${key}-${winner}`).style.cssText =
                key === "avatar" ? "border: 2px solid yellow;" : "color: gold;";
        });
    }
}

customElements.define("score-board", ScoreBoard);
