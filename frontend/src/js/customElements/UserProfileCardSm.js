import { EMPTY_AVATAR_URL } from "../settings.js";
import { getAvatarSrc } from "../utils.js";

class UserProfileCardSm extends HTMLElement {
    constructor() {
        super().attachShadow({ mode: "open" });
        this.setupTemplate();
        this.state = { user: null };
    }

    set state(newState) {
        this._state = { ...this._state, ...newState };
        this.render();
    }

    get state() {
        return this._state;
    }

    async setUser(user) {
        if (!user) return;
        this.state = { user };
    }

    async render() {
        if (!this.state.user) return;

        const avatarEl = this.shadowRoot.getElementById("profile-avatar");
        const usernameEl = this.shadowRoot.getElementById("profile-username");

        avatarEl.src = await getAvatarSrc(this.state.user, this.page.app.api.fetchAvatarObjectUrl);
        usernameEl.textContent = this.state.user.username;
        this.updateOnlineStatus();
    }

    appendPendingButton(expiresAt = null) {
        console.log("Appending pending button");
        if (!expiresAt) expiresAt = "Pending";
        else expiresAt = `expires at ${new Date(expiresAt).toLocaleTimeString()}`;

        const profileContainer = this.shadowRoot.querySelector(".profile-container");
        if (!profileContainer.querySelector(".btn-warning")) {
            console.log("profileContainer", profileContainer);
            const pendingButton = document.createElement("button");
            pendingButton.className = "btn-warning";
            pendingButton.innerText = expiresAt;
            profileContainer.appendChild(pendingButton);
        }
    }

    updateOnlineStatus() {
        const { stateManager } = this.page.app;
        const onlineStatus = stateManager.onlineStatuses.get(this.state.user.id)?.is_online;
        this.shadowRoot.querySelector(".status-indicator").style.backgroundColor = onlineStatus ? "#e0a800" : "#a6a6a6";
    }

    setupTemplate() {
        this.shadowRoot.innerHTML = `
        <style>
            .profile-container {
                display: flex;
                align-items: center;
                text-align: left;
                margin-bottom: 0.5rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 0.5rem;
                transition: background-color 0.3s, box-shadow 0.3s;
            }
            .profile-container:hover {
                background-color: #f8f9fa;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .profile-avatar {
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #dee2e6;
                margin-right: 0.75rem;
                transition: transform 0.3s;
            }
            .profile-container:hover .profile-avatar {
                transform: scale(1.1);
            }
            .profile-username {
                font-size: 1rem;
                font-weight: bold;
                color: #343a40;
            }
            .status-indicator {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-right: 0.75rem;
            }
            .btn-warning {
                margin-left: 10px;
                background-color: #ffc107;
                border: none;
                color: white;
                padding: 0.25rem 0.5rem;
                text-align: center;
                text-decoration: none;
                border-radius: 0.25rem;
                transition: background-color 0.3s;
            }
            .btn-warning:hover {
                background-color: #e0a800;
            }
            .selected {
                background-color: #f8f9fa;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
        </style>
        <div class="profile-container">
            <img id="profile-avatar" src="${EMPTY_AVATAR_URL}" alt="User Avatar" class="profile-avatar" width="50" height="50" />
            <div class="status-indicator"></div>
            <span id="profile-username" class="profile-username"></span>
        </div>
    `;
    }
}

if (!customElements.get("user-profile-small"))
    customElements.define("user-profile-small", UserProfileCardSm);
