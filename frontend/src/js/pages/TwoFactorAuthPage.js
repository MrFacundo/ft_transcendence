import Page from "./Page.js";

class TwoFactorAuthPage extends Page {
	constructor(app) {
		super({
			name: "two-factor-auth",
			url: "/two-factor-auth",
			pageElement: "#TwoFactorAuth",
			isProtected: false,
			app: app,
			isAuthPage: true,
		});
	}

	async render() {
		require("../customElements/CustomForm.js");
		const { auth } = this.app;
		if (auth.authenticated){ return this.app.navigate("/home") }

		const form = this.mainElement.querySelector("custom-form");
		form.submitForm = async (formData) => {
			try {
				await auth.verifyOtp(formData.otp);
				this.app.navigate("/home");
			} catch (error) {
				if (error.response) {
					if (error.response.status === 400 || error.response.status === 410) {
						form.showFormError("One-time password expired. Please login again.");
					} else if (error.response.status === 401) {
						form.showFormError("Invalid one-time password.");
					} else if (error.response.status === 500) {
						form.showFormError("An error ocurred, please try again later.");
					}
				} else {
					form.showFormError(error.message);
				}
				throw error;
			}
		};
	}
}

export default TwoFactorAuthPage;
