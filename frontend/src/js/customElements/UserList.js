import BaseElement from "./BaseElement.js";

class UserList extends BaseElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.setupTemplate();
        this.state = { users: [] };
        this._pageSetCallback = () => {
            this.unsubscribe = this.page.app.stateManager.subscribe(
                'onlineStatuses',
                (statuses, updatedUserId) => this.handleOnlineStatusUpdate(statuses, updatedUserId)
            );
            this.unsubscribe = this.page.app.stateManager.subscribe(
                'currentTournament',
                (currentTournament) => this.handleTournamentUpdate(currentTournament)
            );
        };
    }

    handleOnlineStatusUpdate(statuses, updatedUserId) {
        const userCard = this.shadowRoot.querySelector(`[data-user-id="${updatedUserId}"]`);
        if (userCard) {
            const status = statuses.get(updatedUserId);
            userCard.updateOnlineStatus(status.is_online);
        }
        const selectedUser = this.selectedUserCard?.state?.user?.id === updatedUserId;
        if (selectedUser) {
            this.selectedUserCard.updateOnlineStatus(statuses.get(updatedUserId));
        }
    }

    handleTournamentUpdate(currentTournament) { //TODO: this should be done by the page, not the component
        if (this.page.name === "tournament") {
            this.setState({ users: currentTournament.participants });
        }
    }

    set config({ selectedUserCard, actionButton, actionText, actionCallback }) {
        this.selectedUserCard = selectedUserCard;
        this.actionButton = actionButton;
        this.actionText = actionText;
        this.actionCallback = actionCallback;
    }

    addUser(user) {
        if (!this.state.users.find(u => u.id === user.id)) {
            this.setState({ users: [...this.state.users, user] });
        }
    }

    removeUser(userId) {
        this.setState({ users: this.state.users.filter(user => user.id !== userId) });
    }

    render() {
        const listGroup = this.shadowRoot.querySelector(".list-group");
        listGroup.innerHTML = '';
        this.state.users.forEach(user => {
            const listItem = document.createElement("li");
            listItem.className = "list-group-item";
            listItem.appendChild(this.createUserCard(user));
            listGroup.appendChild(listItem);
        });
    }

    createUserCard(user) {
        const userCardSm = document.createElement("user-profile-small");
        userCardSm.page = this.page;
        userCardSm.setState({user});
        userCardSm.setAttribute("data-user-id", user.id);

        const isPending = user.game_invite?.expires_at || user.friendship?.status === "pending";
        if (isPending) userCardSm.appendPendingButton(user.game_invite?.expires_at);

        userCardSm.addEventListener("click", () => {
            this.actionButton?.classList.add("d-none");
            this.updateSelectedStyle(userCardSm);
            this.selectedUserCard?.setState({ user });
            if (this.actionButton && (this.actionText === "Accept" || !isPending)) {
                this.actionButton.classList.remove("d-none");
                this.actionButton.textContent = this.actionText;
                this.actionButton.onclick = () => this.actionCallback(user, userCardSm);
            }
        });

        return userCardSm;
    }

    updateSelectedStyle(selectedCard) {
        this.shadowRoot.querySelectorAll("user-profile-small").forEach(card => {
            card.shadowRoot.querySelector(".profile-container").classList.remove("selected");
        });
        selectedCard?.shadowRoot.querySelector(".profile-container").classList.add("selected");
    }

    setupTemplate() {
        this.shadowRoot.innerHTML = `
        <style>
            :host { display: block; }
            .list-group {
                display: flex;
                flex-direction: column;
                padding-left: 0;
                margin-bottom: 0;
                border-radius: 0.25rem;
            }
            .list-group-item {
                position: relative;
                display: block;
                padding: 0;
                background-color: #fff;
            }
            .list-group-item:first-child { border-top-left-radius: inherit; border-top-right-radius: inherit; }
            .list-group-item:last-child { border-bottom-right-radius: inherit; border-bottom-left-radius: inherit; }
        </style>
        <ul class="list-group"></ul>
    `;
    }
}

if (!customElements.get("user-list"))
    customElements.define("user-list", UserList);
