/**
 * @class
 * @abstract
 * Provides the basic structure and functionality for a page in the application.
 * It handles opening and closing of the page, and rendering of the content, rendering 
 * and click event listeners.
 */
class Page {
    /**
     * @param {string} name - The name of the page
     * @param {string} url - The URL of the page
     * @param {string} pageElement - The element of the where we can find the content of the page
     * @param {boolean} isProtected - The User must be authenticated to access the page
     * @param {object} app - The app object
     */
    constructor({ name, url, pageElement, isProtected, app }) {
        this.name = name;
        this.url = url;
        this.pageElement = document.querySelector(pageElement);
        this.isProtected = isProtected;
        this.mainElement = document.querySelector("#main");
        this.app = app;
        this.handleClick = this.handleClick.bind(this);
    }

    /**
     * Renders the page's content.
     */
    async open() {
        document.querySelectorAll("section").forEach((section) => { section.remove() });
        this.mainElement.innerHTML = this.pageElement.innerHTML;
        this.addEventListeners();
        document.title = "Ultimate Pong - " + this.name.replace(/[_-]/g, ' ').charAt(0).toUpperCase() + this.name.replace(/[_-]/g, ' ').slice(1);
        this.renderNavbar(this);
        this.render(this.app);
        this.toggleBackground();
        document.body.classList.remove("loading");
    }

    /**
     * Closes the page and removes event listeners and state subscriptions.
     */
    close() {
        this.mainElement.querySelectorAll("[data-href]").forEach((element) => {
            element.removeEventListener("click", (event) =>
                this.handleClick(event, app)
            );
        });
        if (this.unsubscribe) this.unsubscribe();
        this.mainElement.innerHTML = "";
    }

    /**
     * Adds event listeners to the elements with the data-href attribute.
     */
    addEventListeners() {
        this.mainElement.querySelectorAll("[data-href]").forEach((element) => {
            element.addEventListener("click", (event) => this.handleClick(event));
        });
    }

    /**
     * Handles click events for navigation.
     */
    handleClick(event) {
        event.preventDefault();
        const path = event.currentTarget.getAttribute("data-href");
        if (path && path !== window.location.pathname) {
            this.app.navigate(path);
        }
    }

    /**
     * Renders the navigation bar.
     */
    renderNavbar() {
        require("../customElements/Navbar.js");
        const navbarElement = this.mainElement.parentNode.querySelector("nav-bar");
        navbarElement.page = this;
        navbarElement.updateAuthValues();
    }
    
    /**
     * Renders the page
     * @abstract
     */
    render() {
        console.warn(`TEST: Rendering ${this.name} page`);
    }

    toggleBackground() {
        const backgroundEl = document.querySelector("#background");
        const noBackgroundPages = ["login", "register", "404", "auth-result", "two-factor-auth", "verify-email", "oauth-result"];
        if (!noBackgroundPages.includes(this.name)) {
            backgroundEl.style.opacity = "1";
        } else {
            backgroundEl.style.opacity = "0";
        }
    }
}

export default Page;