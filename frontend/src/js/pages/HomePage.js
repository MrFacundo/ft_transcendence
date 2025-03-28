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
		const sendList = this.mainElement.querySelector("#send-list");
		const receiveList = this.mainElement.querySelector("#receive-list");
		const actionButton = this.mainElement.querySelector("#action-friend");
		const selectedUserCard = this.mainElement.querySelector("user-profile");

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
			actionText: "Send friend request",
			actionCallback: async (user) => {
				try {
					await api.friendRequest(user.id);
					user.isPending = true;
					sendList.updateUser(user);
					actionButton.classList.add("d-none");
				}
				catch (error) {
					this.handleError(error);
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
					actionButton.classList.add("d-none");
					showMessage(`${user.username} is now your friend.`);
				}
				catch (error) {
					this.handleError(error);
				}
			}
		};
		receiveList.setState ({ users: receiveListData });
	}

	handleError(error) {
		showMessage(error?.response?.data?.message, "error");
        this.close();
        this.open();
    }
}

export default HomePage;
