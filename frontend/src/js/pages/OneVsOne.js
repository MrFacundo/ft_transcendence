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
        const { api, auth, currentGame } = this.app;
        const sendList = document.querySelector("#send-list");
        const receiveList = document.querySelector("#receive-list");
        const actionBtn = document.querySelector("#action-friend");
        const selectedUserCard = document.querySelector("user-profile");


        [sendList, receiveList, selectedUserCard].forEach(el => (el.page = this));
        sendList.initialize(selectedUserCard, actionBtn);
        receiveList.initialize(selectedUserCard, actionBtn);

        const friendList = await api.getFriends(auth.user.id);

        const sendListData = friendList.filter(user => 
            !user.pending_invite || user.pending_invite.sender === auth.user.id
        );

        const receiveListData = friendList.filter(user => 
            user.pending_invite && user.pending_invite.sender === user.id
        );

        await sendList.populateList({
            users: sendListData,
            actionText: "Invite",
            actionCallback: async (user) => {
                const response = await api.gameRequest(user.id);
                console.log(`Game invite sent to: ${user.username}`);
                return response;
            },
        });

        await receiveList.populateList({
            users: receiveListData,
            actionText: "Accept",
            actionCallback: async (user) => {
                const response = await api.gameAccept(user.pending_invite.id);
                console.log(`Game invite accepted from: ${user.username}`);
                this.app.currentGame = true;
                this.app.navigate(response.game_url);
                return response;
            },
        });

        actionBtn.classList.add("d-none");
    }
}

export default OneVsOne;
