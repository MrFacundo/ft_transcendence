import Page from "./Page.js";
import { showMessage } from "../utils.js";

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
        const { api } = this.app;
        
        const sendList = document.querySelector("#send-list");
        const receiveList = document.querySelector("#receive-list");
        const inviteBtn = document.querySelector("#action-friend");
        const selectedFriend = this.mainElement.querySelector("user-profile");
        selectedFriend.page = this;
    
        const setupFriendItem = (friend, actionText, actionCallback) => {
            const friendItem = document.createElement("user-profile-small");
            friendItem.page = this;
            friendItem.setUser(friend);
            friendItem.addEventListener("click", () => {
                inviteBtn.classList.remove("d-none");
                inviteBtn.textContent = actionText;
                inviteBtn.onclick = actionCallback;
                selectedFriend.setUser(friend);
            });
            return friendItem;
        };

        const friendsInvitable = await api.getFriendsInvitable()
        friendsInvitable.forEach(friend => {
            const friendItem = setupFriendItem(friend, "Invite", async () => {
                try {
                    await api.friendRequest(friend.id);
                    friendItem.appendPendingButton();
                    inviteBtn.classList.add("d-none");
                } catch (error) {
                    showMessage(error.response.data.message);
                }
            });
            sendList.appendChild(friendItem);
        });
    
        const friendsRequests = await api.getFriendsRequests();
        friendsRequests.forEach(invite => {
            const friendItem = setupFriendItem(invite, "Accept", async () => {
                try {
                    const response = await api.friendAccept(invite.id);
                    receiveList.removeChild(friendItem);
                    inviteBtn.classList.add("d-none");
                    showMessage(response.message);
                } catch (error) {
                    console.log(error);
                    showMessage(error.response.data.message);
                }
            });
            receiveList.appendChild(friendItem);
        });
    
        inviteBtn.classList.add("d-none");
    }
}

export default HomePage;