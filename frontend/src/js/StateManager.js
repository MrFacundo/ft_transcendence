export class StateManager {
    constructor(app) {
        this.app = app;
        this.onlineStatuses = null;
        this.tournaments = null;
        this.currentTournament = null;
        this.currentGame = null;
    }

    async init() {
        if (!this.app.auth || !this.app.auth.user) {
            console.warn("Cannot set state: User is not authenticated.");
            return;
        }

        const promises = [
            this.onlineStatuses ? null : this.setInitialOnlineStatuses(),
            this.tournaments ? null : this.setInitialTournaments(),
            this.currentTournament ? null : this.setCurrentTournament()
        ].filter(Boolean);

        await Promise.all(promises);
    }
    
    /* Online Status */

    async setInitialOnlineStatuses() {
        try {
            const response = await this.app.api.getOnlineStatuses();
            this.onlineStatuses = new Map(response.map(user => [user.user_id, user]));
        } catch (error) {
            console.error("Error fetching online status data:", error);
        }
    }

    updateOnlineStatus(data) {
        if (!this.onlineStatuses) return;
        this.onlineStatuses.set(data.user_id, data);
        window.dispatchEvent(new CustomEvent("online-status-update", { detail: { user_id: data.user_id } }));
    }

    updateOnlineStatusUI(event) {
        const { user_id } = event.detail;
        setTimeout(() => {
            document.querySelectorAll("user-list").forEach(list => {
                const card = list.shadowRoot.querySelector(`[data-user-id="${user_id}"]`);
                if (card) card.updateOnlineStatus();
            });
        }, 500);
    }

    /* Tournaments */

    async setInitialTournaments() {
        try {
            const response = await this.app.api.getTournaments();
            this.tournaments = new Map(response.map(tournament => [tournament.id, tournament]));
            console.log("Tournaments:", this.tournaments);
        } catch (error) {
            console.error("Error fetching tournament data:", error);
        }
    }

    async setCurrentTournament(tournament = null) {
        if (tournament) {
            this.currentTournament = tournament;
        } else {
            try {
                this.currentTournament = await this.app.api.getCurrentTournament();
            } catch (error) {
                console.error("Error fetching current tournament data:", error);
            }
        }
        console.log("Current tournament:", this.currentTournament);
    }

	close() {
		this.onlineStatuses = null;
		this.tournaments = null;
		this.currentTournament = null;
		this.currentGame = null;
	}
}