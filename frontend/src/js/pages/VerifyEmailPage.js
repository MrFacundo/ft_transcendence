import Page from "./Page";

class VerifyEmailPage extends Page {
    constructor(app) {
        super({
            name: "verify-email",
            url: "/verify-email",
            pageElement: "#VerifyEmail",
            isProtected: false,
            app: app,
        });
    }

    render() {
        this.verifyEmail();
    }

    async verifyEmail() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const verificationMessageEl = document.getElementById('verification-message');

        if (!token) {
            verificationMessageEl.textContent = 'No token provided.';
            return;
        }

        try {
            const response = await this.app.api.verifyEmail(token);
            if (response) {
                verificationMessageEl.textContent = response.message;
            }
        } catch (error) {
            console.error("error", error);
            if (error.status === 401) {
                verificationMessageEl.textContent = 'Invalid or expired token';
            } else {
                verificationMessageEl.textContent = 'An error occurred while verifying the email.';
            }
        }
    }
}

export default VerifyEmailPage;