import Page from "./Page.js";

class OAuthResultPage extends Page {
    constructor(app) {
        super({
            name: "oauth-result",
            url: "/oauth-result",
            pageElement: "#OAuthResult",
            isProtected: false,
            app: app,
        });
    }

    render() {
        this.handleOAuthCallback();
    }

    handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const errorMessage = urlParams.get('error');
    
        if (errorMessage) {
            const errorElement = document.getElementById('oauth-message');
            errorElement.textContent = "An error occurred while trying to log in. Please close this window and try again.";
        } else {
            setTimeout(window.close(), 3000);
        }
    }
}

export default OAuthResultPage;