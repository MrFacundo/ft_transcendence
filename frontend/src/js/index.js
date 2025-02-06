import { parsePath } from "./utils.js";
import { WS_URL } from "./constants.js";
import {
    LoginPage,
    NotFoundPage,
    RegisterPage,
    VerifyEmailPage,
    OAuthResultPage,
    TwoFactorAuthPage,
    UserSettingsPage,
    HomePage,
    OneVsOne,
    TournamentPage,
    ProfilePage,
    AIPage,
    GamePage,
} from "./pages/index.js";
import "../scss/styles.scss";
import { Api } from "./Api.js";
import { Auth } from "./Auth.js";

/**
 * App class initializes the application, manages page navigation, and handles authentication.
 */
class App {
    constructor() {
        this.mainElement = document.querySelector("#main");
        this.auth = new Auth(this);
        this.api = new Api(this.auth);
        this.pages = {
            login: new LoginPage(this),
            register: new RegisterPage(this),
            404: new NotFoundPage(this),
            verifyEmail: new VerifyEmailPage(this),
            OAuthResult: new OAuthResultPage(this),
            twoFactorAuth: new TwoFactorAuthPage(this),
            settings: new UserSettingsPage(this),
            home: new HomePage(this),
            oneVsOne: new OneVsOne(this),
            tournament: new TournamentPage(this),
            gameStats: new ProfilePage(this),
            AI: new AIPage(this),
            game: new GamePage(this),
        };
        this.currentPage = null;
        this.ws = null;
        this.currentGame = null;
        this.init();
        if (document.getElementById("noScript"))
            document.getElementById("noScript").remove();
    }

    /**
     * Navigates to the specified path and updates the current page.
     * @param {string} path - The path to navigate to.
     */
    async navigate(path) {
        if (path === "/") {
            path = "/home";
        } else if (path === "/logout") {
            return this.auth.logout();
        }

        const parsedPath = parsePath(path, this.pages);
        if (!parsedPath || !parsedPath.page) {
            console.error("No matching page found for path:", path);
            if (path !== "/404") this.navigate("/404");
            return;
        }
        const { page, params } = parsedPath;
        const queryParams = window.location.search;
        console.log("Navigating to:", path, "page: ", page, "params: ", params, "queryParams: ", queryParams);

        page.params = params;
        if (this.currentPage) this.currentPage.close();
        this.mainElement.setAttribute("data-page", page.name);
        this.currentPage = page;
        
        history.pushState({}, page.name, path + (queryParams || ''));
        
        await page.open(this);
        if (this.auth.authenticated && !this.ws) {
            this.listenToInvitations();
        }
    }

    /**
     * Listens to WebSocket invitations.
     */
    listenToInvitations() {
        if (!this.auth || !this.auth.user) {
            console.warn("Cannot establish WebSocket connection: User is not authenticated.");
            return;
        }

        if (this.ws) {
            console.warn("WebSocket connection already established.");
            return;
        }

        const userId = this.auth.user.id;
        console.log("Establishing WebSocket connection for user:", userId);
        this.ws = new WebSocket(`${WS_URL}/game-invitation/${userId}/?token=${this.auth.accessToken}`);
        
        this.ws.onopen = () => {
            console.log("WebSocket connection established for user:", userId);
        };
        
        this.ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "game_accepted") {
                console.log("Game invitation accepted:", data);
                if (this.currentGame) {
                    console.log("Game already in progress, can not start new game now");
                    return;
                }
                console.log(`Redirecting to game: ${data.game_url}`);
                this.currentGame = true; // TODO: implement game state management
                this.navigate(data.game_url);
            }
        
            if (data.type === "game_invited") {
                console.log("Game invitation received:", data);
                if (this.currentGame) {
                    console.log("Game already in progress, can not start new game now");
                    return;
                }
                if (confirm(`You have been challenged by ${data.invitation.sender.username}. Do you accept?`)) {
                    try {
                        const response = await this.api.gameAccept(data.invitation.id);
                        console.log("Starting game", response);
                        this.currentGame = true; // TODO: implement game state management
                        this.navigate(response.game_url);
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        };
        
        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.ws = null;
        };
        
        this.ws.onclose = () => {
            console.warn("WebSocket connection closed.");
            this.ws = null;
        };

        // Clean up on page unload
        window.addEventListener("beforeunload", () => {
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }
        });
    }

    /**
     * Initializes the application, sets up event listeners, and handles initial navigation.
     */
    init() {
        window.addEventListener("popstate", () => {
            this.navigate(window.location.pathname.toLowerCase());
        });
        this.navigate(window.location.pathname.toLowerCase());
        window.addEventListener("load", () => {
            document.body.classList.remove("loading");
        });
    }
}

const app = new App();