import { parsePath } from "./utils.js";
import * as Pages from "./pages/index.js";
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
            login: new Pages.LoginPage(this),
            register: new Pages.RegisterPage(this),
            404: new Pages.NotFoundPage(this),
            verifyEmail: new Pages.VerifyEmailPage(this),
            OAuthResult: new Pages.OAuthResultPage(this),
            twoFactorAuth: new Pages.TwoFactorAuthPage(this),
            settings: new Pages.UserSettingsPage(this),
            home: new Pages.HomePage(this),
            oneVsOne: new Pages.OneVsOne(this),
            tournament: new Pages.TournamentPage(this),
            tournamentCreate: new Pages.TournamentCreatePage(this),
            tournamentJoin: new Pages.TournamentJoinPage(this),
            profile: new Pages.ProfilePage(this),
            AI: new Pages.AIPage(this),
            game: new Pages.GamePage(this),
        };
        this.currentGame = false;
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
     * @param {boolean} replaceHistory - Whether to replace the current history entry instead of pushing a new one.
     */
    async navigate(path, replaceHistory = false) {
        if (path === "/") {
            path = "/home";
        } else if (path === "/logout") {
            return this.auth.logout();
        }

        const parsedPath = parsePath(path, this.pages);
        if (!parsedPath || !parsedPath.page) {
            console.error("No matching page found for path:", path);
            if (path !== "/404") this.navigate("/404", true);
            return;
        }

        const { page, params } = parsedPath;
        const queryParams = window.location.search;
        console.log("Navigating to:", path, "page: ", page, "params: ", params, "queryParams: ", queryParams);

        page.params = params;
        if (this.currentPage) this.currentPage.close();
        this.mainElement.setAttribute("data-page", page.name);
        this.currentPage = page;

        // Avoid modifying the history stack on popstate navigation
        if (!replaceHistory) {
            history.pushState({}, page.name, path + (queryParams || ''));
        }

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
            this.navigate(window.location.pathname.toLowerCase(), true);
        });
        this.navigate(window.location.pathname.toLowerCase());
        window.addEventListener("load", () => {
            document.body.classList.remove("loading");
        });
        window.addEventListener("beforeunload", () => {
            this.wsManager.closeConnections();
        });
        window.addEventListener("online-status-update", (event) => {
            this.onlineStatusManager.updateUI(event);
        });
    }
}

new App();