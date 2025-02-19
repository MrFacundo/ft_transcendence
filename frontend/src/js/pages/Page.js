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
        const { app } = this;

        document.querySelectorAll("section").forEach((section) => { section.remove() });
        const tempElement = document.createElement(this.pageElement.tagName);
        tempElement.innerHTML = this.pageElement.innerHTML;
        this.mainElement.innerHTML = tempElement.innerHTML;
        this.mainElement.querySelectorAll("[data-href]").forEach((element) => {
            element.addEventListener("click", (event) => this.handleClick(event, app));
        });
        document.title = this.name;
        this.renderNavbar(this);
        this.render(app);
    }

    /**
     * Closes the page and removes event listeners.
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
     * Handles click events for navigation.
     * @param {Event} event - The click event
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
}

export default Page;