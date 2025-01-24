import Page from "./Page.js";
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

    async render() {
        const { api, auth } = this.app;
        const { params } = this;
        const profileId = params["id"];

        const pageTitle = document.querySelector("h1");
        const UserProfileCard = document.querySelector("user-profile");
        const userJoinedEl = document.querySelector("#profile-joined");
        const matchHistoryEl = document.querySelector("#match-history");
        const friendListTitle = document.querySelector("#friend-list-title");
        const friendListEl = document.querySelector("#friend-list");
        const selectedUserCard = document.querySelector("user-profile#selected-friend");

        [UserProfileCard, friendListEl, selectedUserCard].forEach(el => (el.page = this));

        const userProfile = await api.getProfile(profileId);
        const matchHistory = await api.getMatchHistory(profileId);
        const friends = await api.getFriends(profileId);

        UserProfileCard.setUser(userProfile);
        pageTitle.textContent = profileId == auth.user.id ? "Your Profile" : capitalizeFirstLetter(userProfile.username) + "'s profile";
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
            friendListTitle.textContent = profileId == auth.user.id ? "Your friends" : capitalizeFirstLetter(userProfile.username) + "'s friends";
            friendListEl.initialize(selectedUserCard);
            friendListEl.populateList({
                users: friends,
                actionText: null,
                actionCallback: null,
            });
        } else {
            selectedUserCard.remove();
        }
    }
}

export default ProfilePage;