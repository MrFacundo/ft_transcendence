import Page from "./Page.js";

class LoginPage extends Page {
    constructor(app) {
        super({
            name: "login",
            url: "/login",
            pageElement: "#Login",
            isProtected: false,
            app: app,
        });
    }

    async render() {
        require("../customElements/CustomForm.js");
        const { auth } = this.app;
        if (auth.authenticated) { return this.app.navigate("/home") }

        const form = this.mainElement.querySelector("custom-form");
        form.submitForm = async (formData) => {
            try {
                await auth.login(
                    formData['login-email'],
                    formData['login-password']
                );
            } catch (error) {
                if (error.response) {
                    if (error.response.status === 401) {
                        form.showFormError("Invalid email or password");
                    } else {
                        form.showFormError("An error ocurred, please try again later.");
                    }
                } else {
                    form.showFormError(error.message);
                }
            }
        };

        const oAuthButton = this.mainElement.querySelector("#oauth");
        oAuthButton.addEventListener("click", async () => {
            await auth.oAuthLogin().catch((error) => {
                form.showFormError(error.message);
            });
        });
    }
}

export default LoginPage;
