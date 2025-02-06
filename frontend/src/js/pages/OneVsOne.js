import Page from "./Page.js";
import "../customElements/UserProfileCard.js";
import "../customElements/UserProfileCardSm.js";

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
        const { api } = this.app;
        const sendList = document.querySelector("#send-list");
        const receiveList = document.querySelector("#receive-list");
        const inviteBtn = document.querySelector("#action-friend");
        const selectedFriend = this.mainElement.querySelector("user-profile");
        selectedFriend.page = this;

        const sentInvites = await api.getSentGameInvites();
        const friends = await api.getFriends(this.app.auth.user.id);
        const receivedInvites = await api.getReceivedGameInvites();

        this.createFriendList(friends, sentInvites, inviteBtn, selectedFriend, sendList);
        this.createReceivedInvitesList(receivedInvites, inviteBtn, selectedFriend, receiveList);

        inviteBtn.classList.add("d-none");
    }

    createFriendList(friends, sentInvites, inviteBtn, selectedFriend, sendList) {
        friends.forEach(friend => {
            const friendItem = this.setupFriendItem(friend, "Invite", async () => {
                try {
                    await this.app.api.gameRequest(friend.id);
                    friendItem.appendPendingButton();
                    inviteBtn.classList.add("d-none");
                } catch (error) {
                    console.error(error);
                }
            }, sentInvites, inviteBtn, selectedFriend);
            sendList.appendChild(friendItem);
        });
    }

    createReceivedInvitesList(receivedInvites, inviteBtn, selectedFriend, receiveList) {
        receivedInvites.forEach(invite => {
            if (invite.status !== "pending") return;
            const friendItem = this.setupFriendItem(invite.sender, "Accept", async () => {
                try {
                    const response = await this.app.api.gameAccept(invite.id);
                    receiveList.removeChild(friendItem);
                    inviteBtn.classList.add("d-none");
                    console.log(response);
                    console.log(`Redirecting to game: ${response.game_url}`);
                    this.app.currentGame = true; // TODO: implement game state management
                    this.app.navigate(response.game_url);
                } catch (error) {
                    console.error(error);
                }
            }, [], inviteBtn, selectedFriend);
            receiveList.appendChild(friendItem);
        });
    }

    setupFriendItem(friend, actionText, actionCallback, sentInvites, inviteBtn, selectedFriend) {
        const friendItem = document.createElement("user-profile-small");
        friendItem.page = this;
        friendItem.setUser(friend);
        friendItem.addEventListener("click", () => {
            inviteBtn.classList.remove("d-none");
            inviteBtn.textContent = actionText;
            inviteBtn.onclick = actionCallback;
            selectedFriend.setUser(friend);
        });

        if (sentInvites.some(invite => invite.receiver.id === friend.id && invite.status === "pending")) {
            friendItem.appendPendingButton();
        }

        return friendItem;
    }
}

export default OneVsOne;