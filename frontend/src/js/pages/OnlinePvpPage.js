import Page from "./Page.js";
import "../customElements/UserProfileCard.js";
import "../customElements/UserProfileCardSm.js";
import "../customElements/UserList.js";
import { showMessage } from "../utils.js";

class OnlinePvpPage extends Page {
    constructor(app) {
        super({
            name: "online_pvp",
            url: "/online_pvp",
            pageElement: "#OnlinePvp",
            isProtected: true,
            app: app,
        });
    }

    async render() {
        const { api, auth, stateManager } = this.app;
        const sendList = this.mainElement.querySelector("#send-list");
        const receiveList = this.mainElement.querySelector("#receive-list");
        const actionButton = this.mainElement.querySelector("#action-friend");
        const selectedUserCard = this.mainElement.querySelector("user-profile");

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
            actionText: "Challenge to PvP",
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
