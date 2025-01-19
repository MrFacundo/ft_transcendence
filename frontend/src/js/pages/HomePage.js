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
        
        const sendFriendInvitationList = document.querySelector("#send-list");
        const receivedFriendInvitationList = document.querySelector("#receive-list");
        const actionBtn = document.querySelector("#action-friend");
        const selectedUser = this.mainElement.querySelector("user-profile");
        selectedUser.page = this;
    
        const setupUserProfileCardSm = (friend, actionText, actionCallback) => {
            const userProfileCardSm = document.createElement("user-profile-small");
            userProfileCardSm.page = this;
            userProfileCardSm.setUser(friend);
        
            if (friend.friendship_status === "pending") {
                userProfileCardSm.appendPendingButton();
            }
            userProfileCardSm.addEventListener("click", () => {
                selectedUser.setUser(friend);
                const shouldShowActionBtn = actionText === "Accept" || (actionText === "Invite" && friend.friendship_status !== "pending");
                actionBtn.classList.toggle("d-none", !shouldShowActionBtn);
                if (shouldShowActionBtn) {
                    actionBtn.textContent = actionText;
                    actionBtn.onclick = actionCallback;
                }
            });
        
            return userProfileCardSm;
        };

        const potentialFriendRequests = await api.getPotentialFriendRequests()
        potentialFriendRequests.forEach(user => {
            const userProfileCardSm = setupUserProfileCardSm(user, "Invite", async () => {
                try {
                    const response = await api.friendRequest(user.id);
                    userProfileCardSm.appendPendingButton();
                    actionBtn.classList.add("d-none");
                    showMessage(response.message);
                } catch (error) {
                    showMessage(error.response.data.message);
                }
            });
            sendFriendInvitationList.appendChild(userProfileCardSm);
        });
    
        const incomingFriendRequests = await api.getIncomingFriendRequests();
        incomingFriendRequests.forEach(user => {
            const userProfileCardSm = setupUserProfileCardSm(user, "Accept", async () => {
                try {
                    const response = await api.friendAccept(user.id);
                    receivedFriendInvitationList.removeChild(userProfileCardSm);
                    actionBtn.classList.add("d-none");
                    showMessage(response.message);
                } catch (error) {
                    console.log(error);
                    showMessage(error.response.data.message);
                }
            });
            receivedFriendInvitationList.appendChild(userProfileCardSm);
        });
    
        actionBtn.classList.add("d-none");
    }
}

export default HomePage;