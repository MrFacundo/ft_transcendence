import Page from "./Page.js";

class HomePage extends Page {
    constructor(app) {
        super({
            name: "home",
            url: "/home",
            pageElement: "#Home",
            isProtected: true,
            app: app,
        });
    }

    async render() {
        const { api, auth } = this.app;
        const sendList = document.querySelector("#send-list");
        const receiveList = document.querySelector("#receive-list");
        const actionBtn = document.querySelector("#action-friend");
        const selectedUserCard = document.querySelector("user-profile");

        [sendList, receiveList, selectedUserCard].forEach(el => (el.page = this));
        sendList.initialize(selectedUserCard, actionBtn);
        receiveList.initialize(selectedUserCard, actionBtn);

        const potentialFriendRequests = await api.getPotentialFriendRequests(auth.user.id);
        const incomingFriendRequests = await api.getIncomingFriendRequests();

        await sendList.populateList(potentialFriendRequests, {
            actionText: "Invite",
            actionCallback: user => api.friendRequest(user.id)
        });

        await receiveList.populateList(incomingFriendRequests, {
            actionText: "Accept",
            actionCallback: user => api.friendAccept(user.id)
        });

        actionBtn.classList.add("d-none");
    }
}

export default HomePage;