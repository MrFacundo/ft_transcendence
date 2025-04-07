import { parsePath } from "./utils.js";
import * as Pages from "./pages/index.js";
import "../scss/styles.scss";
import { settings } from "./settings.js";
import { Api } from "./Api.js";
import { Auth } from "./Auth.js";
import { WebSocketManager } from './WebSocketManager.js';
import { StateManager } from './StateManager.js';

/**
 * Initializes pages, authentication, API, state management, and WebSocket management.
 * Handles navigation and manages the application's state.
 */
class App {
    constructor() {
        this.mainElement = document.querySelector("#main");
        this.auth = new Auth(this);
        this.api = new Api(this.auth);
        this.stateManager = new StateManager(this);
        this.wsManager = new WebSocketManager(this);
        this.pages = {
            login: new Pages.LoginPage(this),
            register: new Pages.RegisterPage(this),
            404: new Pages.NotFoundPage(this),
            verifyEmail: new Pages.VerifyEmailPage(this),
            OAuthResult: new Pages.OAuthResultPage(this),
            twoFactorAuth: new Pages.TwoFactorAuthPage(this),
            settings: new Pages.UserSettingsPage(this),
            home: new Pages.HomePage(this),
            OnlinePvp: new Pages.OnlinePvpPage(this),
            tournament: new Pages.TournamentPage(this),
            tournamentCreate: new Pages.TournamentCreatePage(this),
            tournamentJoin: new Pages.TournamentJoinPage(this),
            profile: new Pages.ProfilePage(this),
            AI: new Pages.AIPage(this),
            game: new Pages.GamePage(this),
            offline: new Pages.OfflinePvpPage(this),
        };
        this.currentPage = null;
        this.init();
        if (document.getElementById("noScript"))
            document.getElementById("noScript").remove();
    }
    /**
     * Navigates to the specified path
     * @param {string} path - The path to navigate to.
     * @param {boolean} replaceHistory - Whether to replace the current history entry instead of pushing a new one.
     */
    async navigate(path, replaceHistory = false) {
        const { pages, auth, stateManager, wsManager} = this;
        if (this.currentPage?.url === path) return;

        const parsedPath = parsePath(path, pages);
        if (!parsedPath || !parsedPath.page) {
            console.error("No matching page found for path:", path);
            this.navigate("/404", true);
            return;
        }

        const { page, params } = parsedPath;
        const queryParams = window.location.search;

        console.log("Navigating to:", path, "page: ", page, "params: ", params, "queryParams: ", queryParams);
        
        await auth.authenticate();
        if (page.isProtected &&  !auth.authenticated) return auth.logout();
        if (page.isAuthPage &&  auth.authenticated) return this.navigate("/home");
        
        if (this.currentPage) this.currentPage.close();
        page.params = params;
        this.mainElement.setAttribute("data-page", page.name);
        this.currentPage = page;

        if (!replaceHistory) {
            history.pushState({}, page.name, path + (queryParams || ''));
        }
        if (auth.authenticated) {
            await stateManager.init();
            await wsManager.init();
        }
        await page.open(this);
    }

    /**
     * Initializes the application, sets up event listeners, and handles initial navigation.
     */
    init() {
        console.log("Settings:", settings);
        window.addEventListener("popstate", () => {
            this.navigate(window.location.pathname.toLowerCase(), true);
        });
        this.navigate(window.location.pathname.toLowerCase());
        window.addEventListener("beforeunload", () => {
            this.wsManager.closeConnections();
            this.stateManager.close();
        });
    }
}

new App();