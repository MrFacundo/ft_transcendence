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
		this.sendListElement = null;
	}

	async render() {
		const { api, auth } = this.app;
		const sendList = document.querySelector("#send-list");
		const receiveList = document.querySelector("#receive-list");
		const actionButton = document.querySelector("#action-friend");
		const selectedUserCard = document.querySelector("user-profile");

		[sendList, receiveList, selectedUserCard].forEach(el => el.page = this);
		
		const userLists = await api.getUsers(auth.user.id);

        const sendListData = userLists.filter(user => 
            user.id !== auth.user.id && 
            (!user.friendship || 
            (user.friendship.status === "pending" && user.friendship.sender === auth.user.id))
        );
        
        const receiveListData = userLists.filter(user => 
            user.friendship?.sender === user.id &&
            user.friendship.status === "pending"
        );

		sendList.config = {
			selectedUserCard,
			actionButton,
			actionText: "Invite",
			actionCallback: async (user, userCardSm) => {
				try {
					await api.friendRequest(user.id);
					userCardSm.appendPendingButton();
				}
				catch (error) {
					this.handleError();
				}
			}
		};
		sendList.setState ({ users: sendListData });
		this.sendListElement = sendList;

		receiveList.config = {
			selectedUserCard,
			actionButton,
			actionText: "Accept",
			actionCallback: async (user) => {
				try {
					await api.friendAccept(user.id);
					receiveList.removeUser(user.id);
					showMessage(`${user.username} is now your friend.`);
				}
				catch (error) {
					this.handleError();
				}
			}
		};
		receiveList.setState ({ users: receiveListData });
	}

	handleError() {
		showMessage(error?.response?.data?.message, "error");
        this.close();
        this.open();
    }
}

export default HomePage;
