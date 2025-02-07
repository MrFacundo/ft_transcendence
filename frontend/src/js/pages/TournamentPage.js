import Page from "./Page.js";
import "../customElements/Bracket.js";
class TournamentPage extends Page {
    constructor(app) {
        super({
            name: "tournament",
            url: "/tournament",
            pageElement: "#Tournament",
            isProtected: true,
            app: app,
        });
    }
}
export default TournamentPage;
