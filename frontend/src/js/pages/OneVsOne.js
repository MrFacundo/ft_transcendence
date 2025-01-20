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
        const { api, auth, navigate } = this.app;
        const sendList = document.querySelector("#send-list");
        const receiveList = document.querySelector("#receive-list");
        const actionBtn = document.querySelector("#action-friend");
        const selectedUserCard = document.querySelector("user-profile");

        [sendList, receiveList, selectedUserCard].forEach(el => (el.page = this));
        sendList.initialize(selectedUserCard, actionBtn);
        receiveList.initialize(selectedUserCard, actionBtn);

        const friends = await api.getFriends(auth.user.id);
        const sentInvites = await api.getSentGameInvites();
        const receivedInvites = await api.getReceivedGameInvites();

        const pendingInviteIds = sentInvites
            .filter(invite => invite.status === "pending")
            .map(invite => invite.receiver.id);

        await sendList.populateList(friends, {
            actionText: "Invite",
            actionCallback: user => api.gameRequest(user.id),
            pendingIds: pendingInviteIds,
        });

        const pendingReceivedInvites = receivedInvites.filter(invite => invite.status === "pending");
        await receiveList.populateList(pendingReceivedInvites.map(invite => invite.sender), {
            actionText: "Accept",
            actionCallback: async (user) => {
                const invite = pendingReceivedInvites.find(inv => inv.sender.id === user.id);
                const response = await this.app.api.gameAccept(invite.id);
                console.log(`Redirecting to game: ${response.game_url}`);
                this.app.currentGame = true;
                navigate(response.game_url);
                return response;
            },
        });

        actionBtn.classList.add("d-none");
    }
}

export default OneVsOne;
