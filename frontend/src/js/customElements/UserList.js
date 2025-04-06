import BaseElement from "./BaseElement.js";

class UserList extends BaseElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.setupTemplate();
    this.state = { users: [] };
    this.selectedUserId = null;
    this.itemHeight = 104;
    this.buffer = 1;
    this.visibleCount = 0;
    this.userCardCache = new Map(); // Cache for user cards
    this.handleScroll = this.handleScroll.bind(this);
    this._pageSetCallback = () => {
      this.unsubscribe = this.page.app.stateManager.subscribe(
        "onlineStatuses",
        (statuses, updatedUserId) =>
          this.handleOnlineStatusUpdate(statuses, updatedUserId),
      );
    };
  }

  connectedCallback() {
    const scrollContainer = this.shadowRoot.querySelector(".scroll-container");
    scrollContainer.addEventListener("scroll", this.handleScroll);
    this.measureItemHeight().then(() => {
      this.handleScroll();
    });
  }

  disconnectedCallback() {
    const scrollContainer = this.shadowRoot.querySelector(".scroll-container");
    if (scrollContainer) {
      scrollContainer.removeEventListener("scroll", this.handleScroll);
    }
    if (typeof this.unsubscribe === "function") {
      this.unsubscribe();
    }
  }

  measureItemHeight() {
    return new Promise((resolve) => {
      const sampleCard = document.createElement("user-profile-small");
      sampleCard.style.visibility = "hidden";
      sampleCard.style.position = "absolute";
      this.shadowRoot.appendChild(sampleCard);

      requestAnimationFrame(() => {
        const rawHeight = sampleCard.offsetHeight;
        const marginTop = 8;
        const marginBottom = 8;
        this.itemHeight = rawHeight + marginTop + marginBottom;

        sampleCard.remove();
        resolve();
      });
    });
  }

  handleOnlineStatusUpdate(statuses, updatedUserId) {
    const userCard = this.shadowRoot.querySelector(
      `[data-user-id="${updatedUserId}"]`,
    );
    if (userCard) {
      const status = statuses.get(updatedUserId);
      userCard.updateOnlineStatus(status?.is_online);
    }
    const selectedUser =
      this.selectedUserCard?.state?.user?.id === updatedUserId;
    if (selectedUser) {
      this.selectedUserCard.updateOnlineStatus(statuses.get(updatedUserId));
    }
  }

  set config({ selectedUserCard, actionButton, actionText, actionCallback }) {
    this.selectedUserCard = selectedUserCard;
    this.actionButton = actionButton;
    this.actionText = actionText;
    this.actionCallback = actionCallback;
  }

  addUser(user) {
    if (!this.state.users.find((u) => u.id === user.id)) {
      this.setState({ users: [...this.state.users, user] });
    }
  }

  removeUser(userId) {
    this.userCardCache.delete(userId);
    this.setState({
      users: this.state.users.filter((user) => user.id !== userId),
    });
  }

  updateUser(updatedUser) {
    this.setState({
      users: this.state.users.map((user) =>
        user.id === updatedUser.id ? updatedUser : user,
      ),
    });
    
    const cachedCard = this.userCardCache.get(updatedUser.id);
    if (cachedCard) {
      cachedCard.setState({ user: updatedUser });
    }
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.handleScroll();
  }

  handleScroll() {
    const scrollContainer = this.shadowRoot.querySelector(".scroll-container");
    const scrollTop = scrollContainer.scrollTop;
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / this.itemHeight) - this.buffer,
    );

    this.updateVisibleItems(startIndex);
  }

  updateVisibleItems(startIndex = 0) {
    const scrollContainer = this.shadowRoot.querySelector(".scroll-container");
    const listGroup = this.shadowRoot.querySelector(".list-group");
    const spacer = this.shadowRoot.querySelector(".spacer");
    const users = this.state.users;
    
    spacer.style.height = `${users.length * this.itemHeight}px`;
    
    const containerHeight = scrollContainer.clientHeight;
    this.visibleCount = Math.ceil(containerHeight / this.itemHeight) + this.buffer * 2;
    
    if (!this.renderPool) {
      this.renderPool = [];
      for (let i = 0; i < this.visibleCount; i++) {
        const listItem = document.createElement("li");
        listItem.className = "list-group-item";
        listGroup.appendChild(listItem);
        this.renderPool.push(listItem);
      }
    }

    for (let i = 0; i < this.renderPool.length; i++) {
      const listItem = this.renderPool[i];
      const userIndex = startIndex + i;
      
      if (userIndex >= users.length) {
        listItem.style.display = "none";
        continue;
      }

      const user = users[userIndex];
      listItem.style.display = "block";
      listItem.style.top = `${userIndex * this.itemHeight}px`;

      let userCard = listItem.querySelector("user-profile-small");
      
      if (!userCard || userCard.getAttribute("data-user-id") !== user.id.toString()) {
        userCard = this.userCardCache.get(user.id);
        
        if (!userCard) {
          userCard = this.createUserCard(user);
          this.userCardCache.set(user.id, userCard);
        }
        
        listItem.innerHTML = "";
        listItem.appendChild(userCard);
      }
    }
  }

  createUserCard(user) {
    const userCardSm = document.createElement("user-profile-small");
    userCardSm.page = this.page;
    userCardSm.setState({ user });
    userCardSm.setAttribute("data-user-id", user.id);

    const isPending =
      user.game_invite?.expires_at ||
      user.friendship?.status === "pending" ||
      user.isPending;
    
    if (isPending) userCardSm.appendPendingButton(user.game_invite?.expires_at);
    
    if (user.id === this.selectedUserId) {
      userCardSm.shadowRoot
        .querySelector(".profile-container")
        ?.classList.add("selected");
    }

    userCardSm.addEventListener("click", () => {
      this.actionButton?.classList.add("d-none");
      this.selectedUserId = user.id;
      this.selectedUserCard?.setState({ user });
      this.updateSelectedStyles();
      if (this.actionButton && (this.actionText === "Accept" || !isPending)) {
        this.actionButton.classList.remove("d-none");
        this.actionButton.textContent = this.actionText;
        this.actionButton.onclick = () =>
          this.actionCallback?.(user, userCardSm);
      }
    });

    return userCardSm;
  }

  updateSelectedStyles() {
    this.shadowRoot.querySelectorAll("user-profile-small").forEach((card) => {
      const isSelected = card.state?.user?.id === this.selectedUserId;
      card.shadowRoot
        .querySelector(".profile-container")
        ?.classList.toggle("selected", isSelected);
    });
  }

  setupTemplate() {
    this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
                height: 420px;
            }

            .scroll-container {
                overflow-y: auto;
                height: 100%;
                position: relative;
            }

            .spacer {
                height: 0;
            }

            .list-group {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                margin: 0;
                padding: 0;
                list-style: none;
            }

            .list-group-item {
                position: absolute;
                display: block;
                top: 0;
                left: 16px;
                right: 16px;
                margin-top: 8px;
                margin-bottom: 8px;
                width: calc(100% - 32px);
                transition: transform 0.2s ease;
            }

            .list-group-item:hover {
                transform: scale(1.01);
            }

            /* Example styling for selected profile container */
            user-profile-small::part(profile-container).selected {
                border: 2px solid blue;
            }
        </style>
        <div class="scroll-container">
            <div class="spacer"></div>
            <ul class="list-group"></ul>
        </div>
        `;
  }
}

if (!customElements.get("user-list")) {
  customElements.define("user-list", UserList);
}