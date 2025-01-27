class UserList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
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
                .list-group-item:first-child {
                    border-top-left-radius: inherit;
                    border-top-right-radius: inherit;
                }
                .list-group-item:last-child {
                    border-bottom-right-radius: inherit;
                    border-bottom-left-radius: inherit;
                }
            </style>
            <ul class="list-group"></ul>
        `;
        this.selectedUser = null;
        this.actionButton = null;
        this.page = null;
    }

    initialize(selectedUserCard, actionButton = null) {
        this.selectedUserCard = selectedUserCard;
        this.actionButton = actionButton;
    }

    async populateList({ users, actionText, actionCallback }) {
        const listGroup = this.shadowRoot.querySelector(".list-group");
    
        users.forEach((user) => {
            const listItem = document.createElement("li");
            listItem.className = "list-group-item";
            const userCardSm = this.createUserCard(user, actionText, async () => {
                try {
                    await actionCallback(user, userCardSm);
                } catch (error) {
                    console.error("Action failed:", error);
                }
            });
            listItem.appendChild(userCardSm);
            listGroup.appendChild(listItem);
        });
    }

    createUserCard(user, actionText, actionCallback) {
        const userCardSm = document.createElement("user-profile-small");
        userCardSm.page = this.page;
        userCardSm.setUser(user);
        userCardSm.setAttribute("data-user-id", user.id);
    
        const isPending = user.game_invite?.expires_at || user.friendship?.status === "pending";
        if (isPending) userCardSm.appendPendingButton(user.game_invite?.expires_at);
    
        userCardSm.addEventListener("click", () => {
            this.actionButton && this.actionButton.classList.add("d-none");
            this.updateSelectedStyle(userCardSm);
            this.selectedUserCard.setUser(user);
    
            if (this.actionButton && (actionText === "Accept" || !isPending)) {
                this.actionButton.classList.remove("d-none");
                this.actionButton.textContent = actionText;
                this.actionButton.onclick = actionCallback;
            }
        });
        return userCardSm;
    }

    removeCard(userId) {
        const listGroup = this.shadowRoot.querySelector(".list-group");
        const listItem = listGroup.querySelector(`user-profile-small[data-user-id="${userId}"]`)?.parentElement;
        if (listItem) {
            listGroup.removeChild(listItem);
        }
    }

    updateSelectedStyle(selectedCard) {
        document.querySelectorAll("user-list").forEach(list => {
            list.shadowRoot.querySelectorAll("user-profile-small").forEach(card => {
                card.shadowRoot.querySelector(".profile-container").classList.remove("selected");
            });
        });

        if (selectedCard) {
            selectedCard.shadowRoot.querySelector(".profile-container").classList.add("selected");
        }
    }
}
if (!customElements.get("user-list"))
    customElements.define("user-list", UserList);