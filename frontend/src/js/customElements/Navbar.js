import { settings } from "../settings.js";
import { getAvatarSrc } from "../utils.js";
import BaseElement from "./BaseElement.js";

class Navbar extends BaseElement {
    constructor() {
        super().attachShadow({ mode: "open" });
        this.state = { user: null, authenticated: false };
        this.setupTemplate();
    }

    setDisplay(elements, display) {
        elements.forEach(el => el.style.display = display);
    }

    render() {
        const pagesNavEl = this.shadowRoot.querySelector(".navbar-center > .navbar-nav");
        const loginEl = this.shadowRoot.querySelector(".login");
        const navbarEl = this.shadowRoot.querySelector(".navbar");
        const registerEl = this.shadowRoot.querySelector(".register");
        const profileEl = this.shadowRoot.querySelector(".profile");
        const settingsEl = this.shadowRoot.querySelector(".settings");
        const logoutEl = this.shadowRoot.querySelector(".logout");

        if (this.state.authenticated) {
            const { user } = this.state;
            profileEl.querySelector("img").src = user.avatarUrl || settings.EMPTY_AVATAR_URL;
            profileEl.setAttribute("data-href", `/profile/${user.id}`);
            this.setDisplay([loginEl, registerEl], "none");
            this.setDisplay([settingsEl, logoutEl], "flex");
            this.setDisplay([profileEl], "flex");
            this.setDisplay([pagesNavEl], "flex");
            navbarEl.style.backgroundColor = "#1e1e1e7f";
        } else {
            this.setDisplay([loginEl, registerEl], "flex");
            this.setDisplay([profileEl, settingsEl, logoutEl], "none");
            this.setDisplay([pagesNavEl], "none");
            navbarEl.style.backgroundColor = "#0c6dfd";
        }

        pagesNavEl.querySelectorAll(".nav-link").forEach(link => {
            const parentLi = link.closest("li");
            if (link.dataset.href === this.page.url) {
                link.style.fontWeight = "bold";
                if (parentLi) {
                    parentLi.style.borderBottom = "2px solid #fec006";
                }
            } else {
                link.style.fontWeight = "normal";
                if (parentLi) {
                    parentLi.style.borderBottom = "none";
                }
            }
        });


        if (!this.listenersAdded) {
            this.shadowRoot.querySelectorAll("[data-href]").forEach(element => {
                element.addEventListener("click", (event) => this.page.handleClick(event));
            });
            this.shadowRoot.querySelector(".logout").addEventListener("click", () => this.page.app.auth.logout());
            this.listenersAdded = true;
        }
    }

    async updateAuthValues() {
        const { auth, api } = this.page.app;

        if (auth.authenticated) {
            const avatarUrl = await getAvatarSrc(auth.user, api.fetchAvatarObjectUrl);
            this.setState({
                authenticated: true,
                user: { ...auth.user, avatarUrl }
            });
        } else {
            this.setState({ authenticated: false, user: null });
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.shadowRoot.querySelectorAll("[data-href]").forEach(element => {
            console.log("Removing event listener from", element);
            element.removeEventListener("click", this.page.handleClick);
        });
        this.shadowRoot.querySelector(".logout").removeEventListener("click", this.page.auth.logout);
    }

    setupTemplate() {
        this.shadowRoot.innerHTML = `
            <style>
                .navbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem 1rem;
                    background-color: #1e1e1e7f;
                    height: 40px;
                }
                .navbar a, .nav-link {
                    color: white;
                    text-decoration: none;
                }
                .navbar-center a:hover {
                    color: #fec006;
                }
                a:hover, .profile {
                    cursor: pointer;
                }
                .navbar-brand {
                    font-size: 1.25rem;
                    font-weight: bold;
                    font-family: 'CustomFont', sans-serif;
                }
                .navbar-center {
                    align-items: center;
                    gap: 0.5rem;
                    font-family: 'CustomFont', sans-serif;
                    text-transform: uppercase;
                    font-size: 14px;
                }
                .navbar-nav {
                    display: flex;
                    align-items: center;
                    list-style: none;
                }
                .nav-item {
                     padding: 3px 10px;
                }
                img.avatar {
                    border-radius: 50%;
                    margin-right: 0.5rem;
                    border: 1px solid white;
                    object-fit: cover;
                }
            </style>
            <nav class="navbar">
                <a class="navbar-brand" data-href="/home">PONG</a>
                <div class="navbar-center" >
                    <ul class="navbar-nav">
                        <li class="nav-item"><a class="nav-link title" data-href="/onlinepvp">Online 1v1</a></li>
                        <li class="nav-item"><a class="nav-link" data-href="/tournament">Tournamens</a></li>
                        <li class="nav-item"><a class="nav-link" data-href="/pvp_offline">Local 1v1</a></li>
                        <li class="nav-item"><a class="nav-link" data-href="/ai">AI Game</a></li>
                    </ul>
                </div>
                <ul class="navbar-nav">
                    <li class="login nav-item"><a class="nav-link" data-href="/login">Login</a></li>
                    <li class="register nav-item"><a class="nav-link" data-href="/register">Register</a></li>
                    <li class="settings nav-item"><a class="nav-link" data-href="/settings">Settings</a></li>
                    <li class="logout nav-item"><a class="nav-link">Logout</a></li>
                    <li class="profile nav-item" data-href="/profile">
                        <img src="${settings.EMPTY_AVATAR_URL}" width="40" height="40" alt="Avatar" class="avatar" />
                    </li>
                </ul>
            </nav>
        `;
    }
}

if (!customElements.get("nav-bar"))
    customElements.define("nav-bar", Navbar);