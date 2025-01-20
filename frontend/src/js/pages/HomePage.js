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
        const selectedFriend = document.querySelector("user-profile");

        [sendList, receiveList, selectedFriend].forEach(el => (el.page = this));
        sendList.initialize(actionBtn, selectedFriend);
        receiveList.initialize(actionBtn, selectedFriend);

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