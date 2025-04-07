import { settings } from "../settings.js";
import { getCachedAvatarSrc } from "../utils.js";
import BaseElement from "./BaseElement.js";

class UserProfileCardSm extends BaseElement {
  constructor() {
    super().attachShadow({ mode: "open" });
    this.setupTemplate();
    this.state = { user: null };
    this._lastUserId = null;
    this._lastAvatarUrl = null;
  }

  async render() {
    const user = this.state.user;
    if (!user) return;

    const avatarEl = this.shadowRoot.getElementById("profile-avatar");
    const usernameEl = this.shadowRoot.getElementById("profile-username");

    if (
      user.id !== this._lastUserId ||
      !this._lastAvatarUrl ||
      avatarEl.src === settings.EMPTY_AVATAR_URL
    ) {
      const newSrc = await getCachedAvatarSrc(
        user,
        this.page.app.api.fetchAvatarObjectUrl
      );

      if (avatarEl.src !== newSrc) {
        avatarEl.src = newSrc;
      }

      this._lastUserId = user.id;
      this._lastAvatarUrl = newSrc;
    }

    usernameEl.textContent = user.username;

    const { stateManager } = this.page.app;
    const status = stateManager.state.onlineStatuses?.get(user.id)?.is_online;
    this.updateOnlineStatus(status);
  }

  appendPendingButton(expiresAt = null) {
    this.clearPendingButton();

    if (!expiresAt) {
      expiresAt = "Pending";
    } else {
      expiresAt = `expires at ${new Date(expiresAt).toLocaleTimeString()}`;
    }

    const profileContainer =
      this.shadowRoot.querySelector(".profile-container");
    const pendingButton = document.createElement("button");
    pendingButton.className = "btn-warning";
    pendingButton.style.position = "absolute";
    pendingButton.style.right = "16px";
    pendingButton.innerText = expiresAt;
    profileContainer.appendChild(pendingButton);
  }

  updateOnlineStatus(isOnline) {
    const statusIndicator = this.shadowRoot.querySelector(".status-indicator");
    if (statusIndicator) {
      statusIndicator.style.backgroundColor = isOnline ? "#e0a800" : "#a6a6a6";
    }
  }

  clearPendingButton() {
    const profileContainer =
      this.shadowRoot.querySelector(".profile-container");
    const pendingButton = profileContainer?.querySelector(".btn-warning");
    if (pendingButton) {
      pendingButton.remove();
    }
  }

  setupTemplate() {
    this.shadowRoot.innerHTML = `
        <style>
            .profile-container {
                display: flex;
                align-items: center;
                text-align: left;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 0.5rem;
                transition: background-color 0.3s, box-shadow 0.3s;
            	background: #202428;
            }
            .profile-container:hover {
            	background: #383e45;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
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
                color: #fff;
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
                color: #fff;
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
            	background: #383e45;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
            }
        </style>
        <div class="profile-container">
            <img id="profile-avatar" src="${settings.EMPTY_AVATAR_URL}" alt="User Avatar" class="profile-avatar" width="50" height="50" />
            <div class="status-indicator"></div>
            <span id="profile-username" class="profile-username"></span>
        </div>
    `;
  }
}

if (!customElements.get("user-profile-small"))
  customElements.define("user-profile-small", UserProfileCardSm);
