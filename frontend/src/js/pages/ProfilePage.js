import Page from "./Page.js";
import { formatDate, capitalizeFirstLetter } from "../utils.js";

class ProfilePage extends Page {
    constructor(app) {
        super({
            name: "profile",
            url: "/profile/:id",
            pageElement: "#Profile",
            isProtected: true,
            app: app,
        });
    }

    createMatchItem(match) {
        const matchItem = document.createElement("li");
        matchItem.className = "list-group-item";
        Object.assign(matchItem.style, {
            width: "300px",
            textAlign: "center",
            backgroundColor: "#202428",
            color: "white"
        });
        const formattedDate = formatDate(match.date_played);
        matchItem.textContent = `${match.opponent.username} - ${match.result} - ${formattedDate}`;
        matchItem.setAttribute("data-href", `/profile/${match.opponent.id}`);
        matchItem.addEventListener("click", (event) => { this.handleClick(event) });
        return matchItem;
    }

    async render() {
        const { api, auth } = this.app;
        const { params } = this;
        const profileId = params["id"];

        const pageTitle = this.mainElement.querySelector("h1");
        const UserProfileCard = this.mainElement.querySelector("user-profile");
        const userJoinedEl = this.mainElement.querySelector("#profile-joined");
        const matchHistoryEl = this.mainElement.querySelector("#match-history");
        const friendListTitle = this.mainElement.querySelector("#friend-list-title");
        const friendListEl = this.mainElement.querySelector("#friend-list");
        const selectedUserCard = this.mainElement.querySelector("user-profile#selected-friend");

        [UserProfileCard, friendListEl, selectedUserCard].forEach(el => el.page = this);

        const userProfile = await api.getProfile(profileId);
        const matchHistory = await api.getMatchHistory(profileId);
        matchHistory.sort((a, b) => new Date(b.date_played) - new Date(a.date_played));
        const friends = await api.getFriends(profileId);

        UserProfileCard.setState({user: userProfile});
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
            friendListEl.config = { selectedUserCard};
            friendListEl.setState ({ users: friends });
        } else {
            selectedUserCard.remove();
        }
    }
}

export default ProfilePage;