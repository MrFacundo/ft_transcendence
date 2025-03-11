import Page from "./Page.js";
import "../customElements/UserProfileCard.js";
import "../customElements/UserProfileCardSm.js";
import "../customElements/UserList.js";
import { showMessage } from "../utils.js";

class OnlinePvpPage extends Page {
    constructor(app) {
        super({
            name: "onlinepvp",
            url: "/onlinepvp",
            pageElement: "#OnlinePvp",
            isProtected: true,
            app: app,
        });
    }

    async render() {
        const { api, auth, stateManager } = this.app;
        const sendList = document.querySelector("#send-list");
        const receiveList = document.querySelector("#receive-list");
        const actionButton = document.querySelector("#action-friend");
        const selectedUserCard = document.querySelector("user-profile");

        [sendList, receiveList, selectedUserCard].forEach(el => (el.page = this));

        const friendList = await api.getFriends(auth.user.id);

        const sendListData = friendList.filter(user =>
            !user.game_invite || user.game_invite.sender === auth.user.id
        );

        const receiveListData = friendList.filter(user =>
            user.game_invite && user.game_invite.sender === user.id
        );

        sendList.config = {
            selectedUserCard,
            actionButton,
            actionText: "Invite",
            actionCallback: async (user) => {
                try {
                    await api.gameRequest(user.id);
					user.isPending = true;
					sendList.updateUser(user);
					actionButton.classList.add("d-none");
                } catch (error) {
                    this.handleError(error);
                }
            },
        };
        sendList.setState({ users: sendListData });

        receiveList.config = {
            selectedUserCard,
            actionButton,
            actionText: "Accept",
            actionCallback: async (user) => {
                try {
                    if (!stateManager.state.onlineStatuses?.get(user.id)?.is_online) {
                        alert(`${user.username} is offline, try again later.`);
                        return;
                    }
                    const response = await api.gameAccept(user.game_invite.id);
                    console.log(`Game invite accepted from: ${user.username}`);
                    this.app.navigate(response.game_url);
                    return response;
                } catch (error) {
                    this.handleError(error);
                }
            },
        };
        receiveList.setState({ users: receiveListData });
    }

    handleError(error) {
        showMessage(error?.response?.data?.message, "error");
        this.close();
        this.open();
    }
}

export default OnlinePvpPage;
