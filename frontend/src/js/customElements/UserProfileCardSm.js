import { EMPTY_AVATAR_URL } from "../constants.js";

class UserProfileCardSm extends HTMLElement {
    constructor() {
        super().attachShadow({ mode: "open" });
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
                <span id="profile-username" class="profile-username"></span>
            </div>
        `;
        this.shadowRoot.querySelector('.profile-container').addEventListener('click', () => this.updateSelected());
    }

    updateSelected() {
        document.querySelectorAll("user-profile-small").forEach((profile) => {
            profile.shadowRoot.querySelector(".profile-container").classList.remove("selected");
        });
        this.shadowRoot.querySelector(".profile-container").classList.add("selected");
    }

    async setUser(user) {
        if (!user) return;

        const avatarEl = this.shadowRoot.getElementById("profile-avatar");
        const usernameEl = this.shadowRoot.getElementById("profile-username");
        const { api } = this.page.app;
        const avatar_upload = user.avatar_upload ? await api.fetchAvatarObjectUrl(user.avatar_upload): null;

        avatarEl.src = avatar_upload || user.avatar_oauth || EMPTY_AVATAR_URL;
        usernameEl.textContent = user.username;
    }

    appendPendingButton() {
        const profileContainer = this.shadowRoot.querySelector(".profile-container");
        const existingPendingButton = profileContainer.querySelector(".btn-warning");
        if (!existingPendingButton) {
            const pendingButton = document.createElement("button");
            pendingButton.className = "btn-warning";
            pendingButton.innerText = "Pending";
            profileContainer.appendChild(pendingButton);
        }
    }
}

if (!customElements.get("user-profile-small"))
    customElements.define("user-profile-small", UserProfileCardSm);