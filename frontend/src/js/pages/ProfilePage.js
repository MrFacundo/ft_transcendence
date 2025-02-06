import Page from "./Page.js";
import "../customElements/UserProfileCardSm.js";
import { formatDate, capitalizeFirstLetter } from "../utils.js";

class ProfilePage extends Page {
    constructor(app) {
        super({
            name: "profilepage",
            url: "/profile/:id",
            pageElement: "#Profile",
            isProtected: true,
            app: app,
        });
    }

    createMatchItem(match) {
        const matchItem = document.createElement("li");
        matchItem.className = "list-group-item";
        const formattedDate = formatDate(match.date_played);
        matchItem.textContent = `${match.opponent.username} - ${match.result} - ${formattedDate}`;
        return matchItem;
    }

    setupFriendItem(friend) {
        const friendItem = document.createElement("user-profile-small");
        friendItem.page = this;
        friendItem.setUser(friend);
        friendItem.addEventListener("click", () => {
            const selectedFriendEl = this.mainElement.querySelector("user-profile#selected-friend");
            selectedFriendEl.page = this;
            selectedFriendEl.setUser(friend);
        });
        return friendItem;
    }

    async render() {
        const { api } = this.app;
        const { mainElement, params } = this;
        const profileId = params["id"];

        const pageTitle = mainElement.querySelector("h1");
        const UserProfileCard = mainElement.querySelector("user-profile");
        const userJoinedEl = mainElement.querySelector("#profile-joined");
        const matchHistoryEl = mainElement.querySelector("#match-history");
        const friendListTitle = mainElement.querySelector("#friend-list-title");
        const friendListEl = mainElement.querySelector("#friend-list");
        const selectedFriendEl = this.mainElement.querySelector("user-profile#selected-friend");

        const friends = await api.getFriends(profileId);
        const matchHistory = await api.getMatchHistory(profileId);
        const userProfile = await api.getProfile(profileId);

        UserProfileCard.page = this;
        UserProfileCard.setUser(userProfile);
        pageTitle.textContent = profileId == this.app.auth.user.id ? "Your Profile" : capitalizeFirstLetter(userProfile.username) + "'s profile";
        userJoinedEl.textContent = "joined: " + formatDate(userProfile.date_joined);

        if (matchHistory.length === 0) {
            matchHistoryEl.textContent = "No matches played yet";
        } else {
            matchHistory.forEach(match => {
                const matchItem = this.createMatchItem(match);
                matchHistoryEl.appendChild(matchItem);
            });
        }

        if (friends.length > 0) {
            friendListTitle.textContent = profileId == this.app.auth.user.id ? "Your friends" : capitalizeFirstLetter(userProfile.username) + "'s friends";
            friends.forEach(friend => {
                const friendItem = this.setupFriendItem(friend);
                friendListEl.appendChild(friendItem);
            });
        } else {
            selectedFriendEl.remove();
        }
    }
}

export default ProfilePage;