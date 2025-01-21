import { parsePath } from "./utils.js";
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
import { logConstants } from "./constants.js";
import { WebSocketManager } from './WebSocketManager.js';
import { OnlineStatusManager } from './OnlineStatusManager.js';

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
            profile: new ProfilePage(this),
            AI: new AIPage(this),
            game: new GamePage(this),
        };
        this.currentPage = null;
        this.wsManager = new WebSocketManager(this);
        this.onlineStatusManager = new OnlineStatusManager(this);
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
        if (this.auth.authenticated) {
            this.wsManager.setupConnections();
        }
    }

    /**
     * Initializes the application, sets up event listeners, and handles initial navigation.
     */
    init() {
        logConstants();
        window.addEventListener("popstate", () => {
            this.navigate(window.location.pathname.toLowerCase());
        });
        this.navigate(window.location.pathname.toLowerCase());
        window.addEventListener("load", () => {
            document.body.classList.remove("loading");
        });
        window.addEventListener("beforeunload", () => {
            this.wsManager.closeConnections();
        });
        window.addEventListener("online-status-update", (event) => {
            console.log("Received online status update event");
            console.log("event", event);
            this.onlineStatusManager.updateUI(event);
        }); 
    }
}

new App();