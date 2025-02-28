/**
 * Handles state updates, subscriptions to state changes, and initialization of state data.
 * Provides methods to update individual pieces of state and to close the state manager.
 */
export class StateManager {
    constructor(app) {
        this.app = app;
        this.subscribers = new Map();
        this.state = {
            onlineStatuses: null,
            currentTournament: null,
            currentGame: null,
            openTournaments: null,
        };
        this.init();
    }
    
    /**
     * Subscribes a callback function to a specific key in the state manager.
     * The callback will be invoked whenever the state associated with the key changes.
     * If a page is specified, the callback will only be invoked when the current page matches the specified page.
     *
     * @param {string} key - The key to subscribe to.
     * @param {function} callback - The callback function to invoke when the state changes.
     * @param {string|null} [page=null] - When a callback is subscribed from a Page class, the page name should be passed so it's only invoked when the page is active. 
     * @returns {function} - A function to unsubscribe the callback from the key.
     */
    subscribe(key, callback, page = null) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        const wrappedCallback = (value, additionalData) => {
            if (!page || this.app.currentPage === page) {
                callback(value, additionalData);
            }
        };
        this.subscribers.get(key).add(wrappedCallback);
        return () => {
            if (this.subscribers.has(key)) {
                const unsubscribed = this.subscribers.get(key).delete(wrappedCallback);
                console.log(`Unsubscribing from ${key}: ${unsubscribed ? 'Success' : 'Failed'}`);
            }
        };
    }
    
    /**
     * Updates the state associated with a specific key and notifies all subscribers.
     *
     * @param {string} key - The key of the state to update.
     * @param {*} newValue - The new value to set for the state.
     * @param {*} [additionalData] - Optional additional data to pass to the subscribers.
     */
    updateState(key, newValue, additionalData) {
        console.log("Updating state:", key, newValue);
        this.state[key] = newValue;
        if (this.subscribers.has(key)) {
            this.subscribers.get(key).forEach(callback =>
                callback(newValue, additionalData)
            );
        }
    }

    async init() {
        if (!this.app.auth.authenticated) {
            return;
        }

        const promises = [
            this.state.onlineStatuses === null ? this.setInitialOnlineStatuses() : null,
            this.state.currentTournament === null ? this.setInitialCurrentTournament() : null,
            this.state.openTournaments === null ? this.setInitialOpenTournaments() : null,
        ].filter(Boolean);

        await Promise.all(promises);
    }

    async setInitialOnlineStatuses() {
        try {
            const response = await this.app.api.getOnlineStatuses();
            const statusesMap = new Map(response.map(user => [user.user_id, user]));
            this.updateState('onlineStatuses', statusesMap);
        } catch (error) {
            console.error("Error fetching online status data:", error);
        }
    }

    updateIndividualOnlineStatus(data) {
        if (!this.state.onlineStatuses) return;

        const newStatuses = new Map(this.state.onlineStatuses);
        newStatuses.set(data.user_id, data);

        this.updateState('onlineStatuses', newStatuses, data.user_id);
    }

    async setInitialCurrentTournament() {
        try {
            const currentTournament = await this.app.api.getCurrentTournament();
            currentTournament && this.updateState('currentTournament', currentTournament);
        } catch (error) {
            console.error("Error fetching current tournament data:", error);
        }
    }

    async setInitialOpenTournaments() {
        try {
            const openTournaments = await this.app.api.getTournaments();
            this.updateState('openTournaments', openTournaments);
        } catch (error) {
            console.error("Error fetching open tournaments data:", error);
        }
    }

    updateOpenTournaments(tournament) {
        const openTournaments = this.state.openTournaments;
        if (!openTournaments) return;

        if (!openTournaments.some(t => t.id === tournament.id)) {
            const updatedTournaments = [...openTournaments, tournament];
            this.updateState("openTournaments", updatedTournaments);
        }
    }

    close() {
        this.subscribers.clear();
        Object.keys(this.state).forEach(key => {
            if (this.state[key] !== null) {
                this.updateState(key, null);
            }
        });
    }
}