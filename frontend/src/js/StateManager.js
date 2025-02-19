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
            currentGame: null
        };
        this.init();
    }
    
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);
        return () => {
            if (this.subscribers.has(key)) {
                const unsubscribed = this.subscribers.get(key).delete(callback);
                console.log(`Unsubscribing from ${key}: ${unsubscribed ? 'Success' : 'Failed'}`);
            }
        };
    }
    
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
            this.state.currentTournament === null ? this.setInitialCurrentTournament() : null
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

    close() {
        this.subscribers.clear();
        Object.keys(this.state).forEach(key => {
            if (this.state[key] !== null) {
                this.updateState(key, null);
            }
        });
    }
}