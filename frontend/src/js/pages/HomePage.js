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

		[sendList, receiveList, selectedUserCard].forEach(
			(el) => (el.page = this)
		);
		sendList.initialize(selectedUserCard, actionBtn);
		receiveList.initialize(selectedUserCard, actionBtn);

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

		await sendList.populateList({
			users: sendListData,
			actionText: "Invite",
			actionCallback: async (user, userCardSm) => {
				await api.friendRequest(user.id);
				userCardSm.appendPendingButton();
			},
		});

		await receiveList.populateList({
			users: receiveListData,
			actionText: "Accept",
			actionCallback: async (user) =>  {
				api.friendAccept(user.id)
				receiveList.removeCard(user.id);
			}
		});
		actionBtn.classList.add("d-none");
	}
}

export default HomePage;
