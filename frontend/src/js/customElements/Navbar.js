import { EMPTY_AVATAR_URL } from "../constants.js";

class Navbar extends HTMLElement {
    constructor() {
        super().attachShadow({ mode: "open" });
        this._page = null;
        this.shadowRoot.innerHTML = `
            <style>
                .navbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem 1rem;
                    background-color: #0d6efd;
                    height: 40px;
                }
                .navbar a, .nav-link {
                    color: white;
                    text-decoration: none;
                    margin-right: 1rem;
                    font-weight: 500;
                }
                .navbar a:hover, .nav-link:hover {
                    color: lightgray;
                    cursor: pointer;
                }
                .navbar-brand {
                    font-size: 1.25rem;
                    font-weight: bold;
                }
                .navbar-center {
                    align-items: center;
                    gap: 0.5rem;
                }
                .navbar-nav {
                    display: flex;
                    gap: 1rem;
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .profile {
                    cursor: pointer;
                }
                img.avatar {
                    border-radius: 50%;
                    margin-right: 0.5rem;
                    border: 1px solid white;
                }
                .username {
                    color: white;
                    font-weight: 500;
                    width: 100px;
                }

            </style>
            <nav class="navbar">
                <a class="navbar-brand" data-href="/home">PONG</a>
                <div class="profile navbar-center" data-href="/profile">
                    <img src={EMPTY_AVATAR_URL} width="40" height="40" alt="Avatar" class="avatar" />
                    <span class="username"></span>
                </div>
                <ul class="navbar-nav">
                    <li class="login nav-item"><a class="nav-link" data-href="/login">Login</a></li>
                    <li class="register nav-item"><a class="nav-link" data-href="/register">Register</a></li>
                    <li class="settings nav-item"><a class="nav-link" data-href="/settings">Settings</a></li>
                    <li class="logout nav-item"><a class="nav-link" data-href="/logout">Logout</a></li>
                </ul>
            </nav>
        `;
    }

    setDisplay(elements, display) {
        elements.forEach(el => el.style.display = display);
    }

    async updateAuthValues() {
        const { auth, api } = this.page.app;
        
        this.shadowRoot.querySelectorAll("[data-href]").forEach(element => {
            element.addEventListener("click", this.page.handleClick);
        });

        const loginEl = this.shadowRoot.querySelector(".login");
        const registerEl = this.shadowRoot.querySelector(".register");
        const profileEl = this.shadowRoot.querySelector(".profile");
        const settingsEl = this.shadowRoot.querySelector(".settings");
        const logoutEl = this.shadowRoot.querySelector(".logout");

        if (auth.authenticated) {
            const { user } = auth;
            const avatar_upload = user.avatar_upload ? await api.fetchAvatarObjectUrl(user.avatar_upload) : null;
            profileEl.querySelector("img").src = avatar_upload || user.avatar_oauth || EMPTY_AVATAR_URL;
            profileEl.querySelector(".username").textContent = user.username;
            profileEl.setAttribute('data-href', `/profile/${user.id}`);
            this.setDisplay([loginEl, registerEl], "none");
            this.setDisplay([settingsEl, logoutEl], "block");
            this.setDisplay([profileEl], "flex");
        } else {
            this.setDisplay([loginEl, registerEl], "block");
            this.setDisplay([profileEl, settingsEl, logoutEl], "none");
        }
    }

    disconnectedCallback() {
        this.shadowRoot.querySelectorAll("[data-href]").forEach(element => {
            element.removeEventListener("click", this.page.handleClick);
        });
    }
}

if (!customElements.get("nav-bar"))
    customElements.define("nav-bar", Navbar);