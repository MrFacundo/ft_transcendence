class UserList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.setupTemplate();
        this.state = {
            users: [],
            actionText: null,
            actionCallback: null
        };
    }

    set state(newState) {
        this._state = { ...this._state, ...newState };
        this.render();
    }

    get state() {
        return this._state;
    }

    set config({ selectedUserCard, actionButton, actionText, actionCallback }) {
        this.selectedUserCard = selectedUserCard;
        this.actionButton = actionButton;
        this.state = { actionText, actionCallback };
    }

    async populateList(users) {
        this.state = { users };
    }

    addUser(user) {
        const users = [...this.state.users];
        if (!users.find(u => u.id === user.id)) {
            users.push(user);
            this.state = { users };
        }
    }

    removeUser(userId) {
        const users = this.state.users.filter(user => user.id !== userId);
        this.state = { users };
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
        userCardSm.setUser(user);
        userCardSm.setAttribute("data-user-id", user.id);

        const isPending = user.game_invite?.expires_at || user.friendship?.status === "pending";
        if (isPending) userCardSm.appendPendingButton(user.game_invite?.expires_at);

        userCardSm.addEventListener("click", () => {
            this.actionButton?.classList.add("d-none");
            this.updateSelectedStyle(userCardSm);
            this.selectedUserCard?.setUser(user);
            if (this.actionButton && (this.state.actionText === "Accept" || !isPending)) {
                this.actionButton.classList.remove("d-none");
                this.actionButton.textContent = this.state.actionText;
                this.actionButton.onclick = () => this.state.actionCallback(user, userCardSm);
            }
        });

        return userCardSm;
    }

    updateSelectedStyle(selectedCard) {
        this.shadowRoot.querySelectorAll("user-profile-small").forEach(card => {
            card.shadowRoot.querySelector(".profile-container").classList.remove("selected");
        });
        if (selectedCard) {
            selectedCard.shadowRoot.querySelector(".profile-container").classList.add("selected");
        }
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
