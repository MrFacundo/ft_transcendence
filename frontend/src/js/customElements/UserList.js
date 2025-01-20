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

    initialize(actionButton, selectedUserProfile) {
        this.actionButton = actionButton;
        this.selectedUserProfile = selectedUserProfile;
    }

    async populateList(users, options = {}) {
        const { actionText, actionCallback, pendingIds = [] } = options;
        const listGroup = this.shadowRoot.querySelector(".list-group");

        users.forEach(user => {
            const listItem = document.createElement("li");
            listItem.className = "list-group-item";

            const userCard = this.createUserCard(user, {
                actionText,
                actionCallback,
                isPending: pendingIds.includes(user.id),
            });

            listItem.appendChild(userCard);
            listGroup.appendChild(listItem);
        });
    }

    createUserCard(user, { actionText, actionCallback, isPending }) {
        const userCard = document.createElement("user-profile-small");
        userCard.page = this.page;
        userCard.setUser(user);
        userCard.setAttribute("data-user-id", user.id);

        if (isPending) userCard.appendPendingButton();

        userCard.addEventListener("click", async () => {
            this.selectedUserProfile.setUser(user);
            this.updateSelectedStyle(userCard);
            const shouldShowActionBtn = actionText && (!isPending || actionText === "Accept");
            
            if (this.actionButton) {
                this.actionButton.classList.toggle("d-none", !shouldShowActionBtn);
    
                if (shouldShowActionBtn) {
                    this.actionButton.textContent = actionText;
                    this.actionButton.onclick = async () => {
                        try {
                            await actionCallback(user);
                            if (actionText === "Accept") {
                                this.removeCard(user.id);
                            } else {
                                userCard.appendPendingButton();
                            }
                            this.actionButton.classList.add("d-none");
                        } catch (error) {
                            console.error("Action failed:", error);
                        }
                    };
                }
            }
        });

        return userCard;
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