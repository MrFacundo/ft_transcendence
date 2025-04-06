import Page from "./Page";
import PongOffline from "../customElements/PongOffline.js";

class OfflinePvpPage extends Page {
  constructor(app) {
    super({
      name: "offline_pvp",
      url: "/pvp_offline",
      pageElement: "#Offline",
      isProtected: true,
      app: app,
    });
  }

  render() {
    const pongOfflineElement = new PongOffline();
    pongOfflineElement.page = this;
    this.mainElement.appendChild(pongOfflineElement);
  }
}

export default OfflinePvpPage;
