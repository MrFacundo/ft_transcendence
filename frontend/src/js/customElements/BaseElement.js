/**
 * Extends HTMLElement.
 * Adds basic functionality for managing a page property,
 * setting state, and handling subscription to the app state.
 * 
 * Use this class as a base class for all custom elements.
 */
class BaseElement extends HTMLElement {
    constructor() {
        super();
        this._pageSetCallback = null;
    }

    set page(newPage) {
        this._page = newPage;
        this.onPageSet();
    }

    get page() {
        return this._page;
    }

    onPageSet() {
        if (this._pageSetCallback) {
            this._pageSetCallback();
        }
    }
    
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

export default BaseElement;
