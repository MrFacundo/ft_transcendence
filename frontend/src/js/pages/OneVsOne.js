import Page from "./Page.js";
import "../customElements/UserProfileCard.js";
import "../customElements/UserProfileCardSm.js";
import "../customElements/UserList.js";

class OneVsOne extends Page {
    constructor(app) {
        super({
            name: "onevsone",
            url: "/onevsone",
            pageElement: "#OneVsOne",
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
            actionCallback: async (user, userCardSm) => {
                const response = await api.gameRequest(user.id);
                userCardSm.appendPendingButton(Date.now() + 10 * 60 * 1000);
                console.log(`Game invite sent to: ${user.username}`);
                return response;
            },
		};
		sendList.state = { users: sendListData };

        receiveList.config = {
			selectedUserCard,
			actionButton,
			actionText: "Accept",
            actionCallback: async (user) => {
                if (!stateManager.onlineStatuses.get(user.id)?.is_online) {
                    alert(`${user.username} is offline, try again later.`);
                    return;
                }
                const response = await api.gameAccept(user.game_invite.id);
                console.log(`Game invite accepted from: ${user.username}`);
                this.app.navigate(response.game_url);
                return response;
            },
		};
		receiveList.state = { users: receiveListData };
    }
}

export default OneVsOne;
