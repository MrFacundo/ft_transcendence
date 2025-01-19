import { WS_URL } from "./constants.js";
import { showMessage } from "./utils.js";

export class WebSocketManager {
    constructor(app) {
        this.app = app;
        this.gameWs = null;
        this.friendWs = null;
        this.onlineStatusWs = null;
    }

    setupConnections() {
        if (!this.app.auth || !this.app.auth.user) {
            console.warn("Cannot establish WebSocket connections: User is not authenticated.");
            return;
        }

        const userId = this.app.auth.user.id;
        
        if (!this.gameWs) {
            this.setupGameInvitationWebSocket(userId);
        }

        if (!this.friendWs) {
            this.setupFriendInvitationWebSocket(userId);
        }

        if (!this.onlineStatusWs) {
            this.setupOnlineStatusWebSocket(userId);
        }
    }

    setupGameInvitationWebSocket(userId) {
        this.gameWs = new WebSocket(`${WS_URL}/game-invitation/${userId}/?token=${this.app.auth.accessToken}`);

        this.gameWs.onopen = () => {
            console.log("WebSocket Game Invitation connection established for user:", userId);
        };

        this.gameWs.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "game_accepted") {
                console.log("Game invitation accepted:", data);
                if (this.app.currentGame) {
                    console.log("Game already in progress, can not start new game now");
                    return;
                }
                console.log(`Redirecting to game: ${data.game_url}`);
                this.app.currentGame = true;
                this.app.navigate(data.game_url);
            } else if (data.type === "game_invited") {
                console.log("Game invitation received:", data);
                if (this.app.currentGame) {
                    console.log("Game already in progress, can not start new game now");
                    return;
                }
                if (confirm(`You have been challenged by ${data.invitation.sender.username}. Do you accept?`)) {
                    try {
                        const response = await this.app.api.gameAccept(data.invitation.id);
                        console.log("Starting game", response);
                        this.app.currentGame = true;
                        this.app.navigate(response.game_url);
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        };

        this.gameWs.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.gameWs = null;
        };

        this.gameWs.onclose = () => {
            console.warn("WebSocket connection closed.");
            this.gameWs = null;
        };
    }

    setupFriendInvitationWebSocket(userId) {
        this.friendWs = new WebSocket(`${WS_URL}/friend-invitation/${userId}/?token=${this.app.auth.accessToken}`);
        
        this.friendWs.onopen = () => {
            console.log("Friend WebSocket connection established for user:", userId);
        };
        
        this.friendWs.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === "friend_invited") {
                console.log("Friend invitation received:", data);
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
        };
        
        this.friendWs.onerror = (error) => {
            console.error("Friend WebSocket error:", error);
            this.friendWs = null;
        };
        
        this.friendWs.onclose = () => {
            console.warn("Friend WebSocket connection closed.");
            this.friendWs = null;
        };
    }

    setupOnlineStatusWebSocket() {
        this.onlineStatusWs = new WebSocket(`${WS_URL}/online-status/?token=${this.app.auth.accessToken}`);

        this.onlineStatusWs.onopen = async ()  => {
            console.log("Online status WebSocket connection established.");
            try {
                const response = await this.app.api.getOnlineStatuses();
                console.log("Online status data:", response);
                response.forEach(user => {
                    this.app.onlineStatuses.set(user.user_id, {
                        username: user.username,
                        is_online: user.is_online,
                        last_seen: user.last_seen
                    });
                });
                console.log("Updated online status data:", this.app.onlineStatuses);
            } catch (error) {
                console.error("Error fetching online status data:", error);
            }
        };

        this.onlineStatusWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Online status update:", data);
            if (data.type === "user_status") {
                this.app.onlineStatuses.set(data.user_id, {
                    username: data.username,
                    is_online: data.is_online,
                    last_seen: data.last_seen
                });
            }
            console.log("Updated online status data:", this.app.onlineStatuses);
        };

        this.onlineStatusWs.onerror = (error) => {
            console.error("Online status WebSocket error:", error);
            this.onlineStatusWs = null;
        };

        this.onlineStatusWs.onclose = () => {
            console.warn("Online status WebSocket connection closed.");
            this.onlineStatusWs = null;
        };
    
    }

    closeConnections() {
        if (this.gameWs) {
            this.gameWs.close();
            this.gameWs = null;
        }
        if (this.friendWs) {
            this.friendWs.close();
            this.friendWs = null;
        }
        if (this.onlineStatusWs) {
            this.onlineStatusWs.close();
            this.onlineStatusWs = null;
        }
    }
}