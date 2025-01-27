export class OnlineStatusManager {
	constructor(app) {
		this.app = app;
		this.statuses = new Map();
	}

	async fetchInitialStatuses() {
		try {
			const response = await this.app.api.getOnlineStatuses();
			response.forEach(user => {
				this.statuses.set(user.user_id, {
					username: user.username,
					is_online: user.is_online,
					last_seen: user.last_seen
				});
			});
		} catch (error) {
			console.error("Error fetching online status data:", error);
		}
	}

	updateStatus(data) {
		this.statuses.set(data.user_id, {
			username: data.username,
			is_online: data.is_online,
			last_seen: data.last_seen
		});
		window.dispatchEvent(new CustomEvent("online-status-update", {
			detail: {
				user_id: data.user_id
			}
		}));
	}

	updateUI(event) {
		const { user_id } = event.detail;
		const userLists = document.querySelectorAll("user-list");
		setTimeout(() => {
			userLists.forEach(list => {
				const card = list.shadowRoot.querySelector(`[data-user-id="${user_id}"]`);
				if (card) {
					card.updateOnlineStatus();
				}
			});
		}, 500); // for some reason, cards are not found without a delay 
	}
}