import Page from "./Page";
import { formatErrorMessages } from "../utils.js";

class RegisterPage extends Page {
    constructor(app) {
        super({
            name: "register",
            url: "/register",
            pageElement: "#Register",
            isProtected: false,
            app: app,
        });
    }

    render() {
        require("../customElements/CustomForm.js");

        const form = this.mainElement.querySelector("custom-form");
        form.submitForm = async (formData) => {
            try {
                await this.app.auth.register(
                    formData.username,
                    formData['register-email'],
                    formData['register-password'],
                    formData.confirmpassword
                );
                const successMessage = "User registered successfully. Please verify your email.";
                form.showFormSuccess(successMessage);
                this.mainElement.querySelector("#register-success").textContent = successMessage;
                form.style.display = "none";
            } catch (error) {
                console.error("error", error);
                let errorMessage = "An unknown error occurred";
                if (error.response && error.response.data) {
                    errorMessage = formatErrorMessages(error.response.data);
                } else {
                    errorMessage = error.message || errorMessage;
                }
                form.showFormError(errorMessage);
            }
        };
    }
}

export default RegisterPage;
