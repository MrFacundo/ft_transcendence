import { settings } from "./settings.js";
import { showMessage } from "./utils.js";

/**
 * Sets up WebSocket connections for game invitations, friend invitations, online statuses, and tournaments.
 * Handles incoming WebSocket messages and updates the application state accordingly.
 */
export class WebSocketManager {
    constructor(app) {
        this.app = app;
        this.gameInvitationWs = null;
        this.friendWs = null;
        this.onlineStatusWs = null;
        this.tournamentWs = null;
        this.openTournamenstWs = null;
    }

    async init() {
        if (!this.app.auth?.user) {
            console.warn("Cannot establish WebSocket connections: User is not authenticated.");
            return;
        }

        const userId = this.app.auth.user.id;
        this.gameInvitationWs || this.setupGameInvitationWebSocket(userId);
        this.friendWs || this.setupFriendInvitationWebSocket(userId);
        this.onlineStatusWs || this.setupOnlineStatusWebSocket(userId);
        this.tournamentWs || this.setupTournamentWebSocket();
        this.openTournamenstWs || this.setupOpenTournamentsWebSocket();
    }

    setupGameInvitationWebSocket(userId) {
        this.gameInvitationWs = this.setupWebSocket(`game-invitation/${userId}`, this.handleGameInvitationMessage.bind(this));
    }

    setupFriendInvitationWebSocket(userId) {
        this.friendWs = this.setupWebSocket(`friend-invitation/${userId}`, this.handleFriendMessage.bind(this));
    }

    setupOnlineStatusWebSocket() {
        this.onlineStatusWs = this.setupWebSocket('online-status', this.handleOnlineStatusMessage.bind(this));
    }

    setupTournamentWebSocket() {
        const tournamentId = this.app.stateManager.state.currentTournament?.id;
        if (!tournamentId) return;
        this.tournamentWs = this.setupWebSocket(`tournament/${tournamentId}`, this.handleTournamentMessage.bind(this));
    }

    setupOpenTournamentsWebSocket() {
        this.openTournamenstWs = this.setupWebSocket('open-tournaments', this.handleOpenTournamentsMessage.bind(this));
    }

    setupWebSocket(path, messageHandler) {
        const ws = new WebSocket(`${settings.WS_URL}/${path}/?token=${this.app.auth.accessToken}`);
        ws.onopen = () => console.log(`WebSocket connection established: ${path}`);
        ws.onmessage = messageHandler;
        ws.onerror = (error) => {
            console.error(`${path} WebSocket error:`, error);
            this[`${path.split('/')[0]}Ws`] = null;
        };
        ws.onclose = () => {
            console.warn(`WebSocket connection closed: ${path}`);
            this[`${path.split('/')[0]}Ws`] = null;
        };
        return ws;
    }

    async handleGameInvitationMessage(event) {
        const data = JSON.parse(event.data);
        if (data.type === "game_accepted") {
            if (this.app.stateManager.currentGame) return;
            this.app.navigate(data.game_url);
        } else if (data.type === "game_invited") {
            if (this.app.stateManager.currentGame) return;
            if (confirm(`You have been challenged by ${data.invitation.sender.username}. Do you accept?`)) {
                try {
                    const response = await this.app.api.gameAccept(data.invitation.id);
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
            if (this.app.currentPage.name === "home") {
                this.app.currentPage.sendListElement.removeUser(data.friendship.receiver.id);
            }
        }
    }

    handleOnlineStatusMessage(event) {
        const data = JSON.parse(event.data);
        console.log("Online status WS message:", data);
        this.app.stateManager.updateIndividualOnlineStatus(data);
    }

    async handleTournamentMessage(event) {
        const { stateManager, currentPage, auth } = this.app;
        const data = JSON.parse(event.data);
        console.log("Tournament WS message:", data);

        switch (data.type) {
            case "join":
                this.handleJoinMessage(data, auth, stateManager);
                break;
            case "start_game":
                this.handleStartGameMessage(data, auth, stateManager);
                break;
            case "game_over":
                this.handleGameOverMessage(data, currentPage, stateManager);
                break;
            default:
                console.warn("Unknown message type:", data.type);
        }
    }

    handleJoinMessage(data, auth, stateManager) {
        if (data.tournament.participants.length === data.tournament.participants_amount) {
            return this.app.navigate("/tournament");
        }
        if (data.participant_id !== auth.user.id) {
            stateManager.updateState('currentTournament', data.tournament);
            const participant = data.tournament.participants.find(p => p.id === Number(data.participant_id));
            showMessage(`${participant.username} joined ${data.tournament.name} tournament.`);
        }
    }

    handleStartGameMessage(data, auth, stateManager) {
        if (auth.user.id === data.participant_id) {
            this.app.navigate(data.game_url);
        }
    }

    handleGameOverMessage(data, currentPage, stateManager) {
        stateManager.updateState('currentTournament', data.tournament);
        if (currentPage.name === "game") {
            this.app.navigate("/tournament");
        }
    }

    handleOpenTournamentsMessage(event) {
        const data = JSON.parse(event.data);
        console.log("Open tournaments WS message:", data);
        data.tournament && this.app.stateManager.updateOpenTournaments(data.tournament);
        
        const tournamentCreator = data.tournament.participants[0];
        if (tournamentCreator.id !== this.app.auth.user.id) {
            showMessage(tournamentCreator.username + " created the" + data.tournament.name + " tournament.");
        }
    }

    closeConnections() {
        ['gameInvitationWs', 'friendWs', 'onlineStatusWs', 'tournamentWs'].forEach(ws => {
            if (this[ws]) {
                this[ws].close();
                this[ws] = null;
            }
        });
    }
}