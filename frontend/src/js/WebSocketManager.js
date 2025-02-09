import { WS_URL } from "./constants.js";
import { showMessage } from "./utils.js";

export class WebSocketManager {
    constructor(app) {
        this.app = app;
        this.gameWs = null;
        this.friendWs = null;
        this.onlineStatusWs = null;
        this.tournamentWs = null;
    }

    async init() {
        if (!this.app.auth || !this.app.auth.user) {
            console.warn("Cannot establish WebSocket connections: User is not authenticated.");
            return;
        }

        const userId = this.app.auth.user.id;
        this.gameWs || this.setupGameInvitationWebSocket(userId);
        this.friendWs || this.setupFriendInvitationWebSocket(userId);
        this.onlineStatusWs || this.setupOnlineStatusWebSocket(userId);
        this.tournamentWs || this.setupTournamentWebSocket();
    }

    setupGameInvitationWebSocket(userId) {
        this.gameWs = this.setupWebSocket(`game-invitation/${userId}`, this.handleGameMessage.bind(this));
    }

    setupFriendInvitationWebSocket(userId) {
        this.friendWs = this.setupWebSocket(`friend-invitation/${userId}`, this.handleFriendMessage.bind(this));
    }

    setupOnlineStatusWebSocket() {
        this.onlineStatusWs = this.setupWebSocket('online-status', this.handleOnlineStatusMessage.bind(this));
    }

    setupTournamentWebSocket() {
        const tournamentId = this.app.stateManager.currentTournament?.id;
        if (!tournamentId) return;
        this.tournamentWs = this.setupWebSocket(`tournament/${tournamentId}`, this.handleTournamentMessage.bind(this));
    }

    setupWebSocket(path, messageHandler) {
        const ws = new WebSocket(`${WS_URL}/${path}/?token=${this.app.auth.accessToken}`);
        ws.onopen = () => console.log(`${path} WebSocket connection established.`);
        ws.onmessage = messageHandler;
        ws.onerror = (error) => {
            console.error(`${path} WebSocket error:`, error);
            this[`${path.split('/')[0]}Ws`] = null;
        };
        ws.onclose = () => {
            console.warn(`${path} WebSocket connection closed.`);
            this[`${path.split('/')[0]}Ws`] = null;
        };
        return ws;
    }

    async handleGameMessage(event) {
        const data = JSON.parse(event.data);
        if (data.type === "game_accepted") {
            if (this.app.stateManager.currentGame) return;
            this.app.stateManager.currentGame = true;
            this.app.navigate(data.game_url);
        } else if (data.type === "game_invited") {
            if (this.app.stateManager.currentGame) return;
            if (confirm(`You have been challenged by ${data.invitation.sender.username}. Do you accept?`)) {
                try {
                    const response = await this.app.api.gameAccept(data.invitation.id);
                    this.app.stateManager.currentGame = true;
                    this.app.navigate(response.game_url);
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }

    async handleFriendMessage(event) {
        const data = JSON.parse(event.data);
        if (data.type === "friend_invited") {
            if (confirm(`${data.friendship.sender.username} wants to be your friend. Do you accept?`)) {
                try {
                    await this.app.api.friendAccept(data.friendship.sender.id);
                    showMessage(`${data.friendship.sender.username} is now your friend.`);
                } catch (error) {
                    console.error("Error accepting friendship:", error);
                }
            }
        } else if (data.type === "friend_accepted") {
            showMessage(`${data.friendship.receiver.username} is now your friend.`);
        }
    }

    handleOnlineStatusMessage(event) {
        const data = JSON.parse(event.data);
        this.app.stateManager.updateIndividualOnlineStatus(data);
        this.app.currentPage.updateIndividualOnlineStatusUI(data);
    }

    async handleTournamentMessage(event) {
        const data = JSON.parse(event.data);
        console.log("Tournament WS message:", data);
        if (data.type === "join") {
            this.app.stateManager.updateCurrentTournament(data.tournament);
            if (this.app.currentPage === "tournament-join") {
                this.app.pages.tournamentJoin.updateCurrentTournamentUI();
            }
            if (data.participant_id !== this.app.auth.user.id) {
                showMessage(`${data.tournament.participants.find(p => p.id === data.participant_id).username} joined the tournament.`);
            }
        }
    }

    closeConnections() {
        ['gameWs', 'friendWs', 'onlineStatusWs', 'tournamentWs'].forEach(ws => {
            if (this[ws]) {
                this[ws].close();
                this[ws] = null;
            }
        });
    }
}