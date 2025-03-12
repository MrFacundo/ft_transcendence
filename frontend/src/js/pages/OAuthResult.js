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
        const error = urlParams.get("error");

        const messageEl = document.getElementById("oauth-message");
        if (error === "unknown") {
            messageEl.textContent = "An error occurred while logging in. Please close this window and try again.";
            messageEl.classList.add("error-message", "alert", "alert-danger");
        } else if (error === "duplicate_data") {
            messageEl.textContent = "An account with this credentials already exists. Please try with a different account.";
            messageEl.classList.add("error-message", "alert", "alert-danger");
        } else {
            messageEl.textContent = "Login successful! You can close this window.";
            messageEl.classList.add("success-message", "alert", "alert-success");
            setTimeout(() => window.close(), 2000);
        }
    }
}

export default OAuthResultPage;