import Page from "./Page";
import { Modal } from 'bootstrap';
import { capitalizeFirstLetter } from "../utils";
import "../customElements/CustomForm";

class UserSettingsPage extends Page {
    constructor(app) {
        super({
            name: "settings",
            url: "/settings",
            pageElement: "#UserSettings",
            isProtected: true,
            app: app,
        });
    }

    render() {
        this.setupEventListeners();
        this.setInitial2FASelection();
    }

    setInitial2FASelection() {
        const twoFactorElement = document.getElementById(`2fa-${this.app.auth.user.two_factor_method}`);
        if (twoFactorElement) twoFactorElement.checked = true;
    }

    setupEventListeners() {
        const elements = [
            { button: "#change-username button", input: "#new-username", field: "username", message: "Username successfully changed." },
            { button: "#change-email button", input: "#new-email", field: "new_email", message: "Email successfully changed. Please verify your new email address." },
            { button: "#change-password button", input: "#new-password", field: "new_password", message: "Password successfully changed.", confirmInput: "#confirm-password" },
            { button: "#change-avatar button", input: "#new-avatar", field: "avatar", message: "Avatar successfully updated." },
        ];

        elements.forEach(({ button, input, field, message, confirmInput }) => {
            const btn = document.querySelector(button);
            const inp = document.querySelector(input);
            const confirmInp = confirmInput ? document.querySelector(confirmInput) : null;
            if (btn) btn.addEventListener("click", () => this.handleChange(field, inp.value, message, confirmInp?.value));
        });

        const update2FAButton = document.querySelector("#two-factor .btn");
        if (update2FAButton) {
            update2FAButton.addEventListener("click", this.handle2FAButtonClick.bind(this));
        }

        const form = document.querySelector("#authenticatorModal custom-form");
        form.submitForm = this.submitAuthenticatorForm.bind(this, form);

        const deleteAccountButton = document.querySelector("#confirmDeleteAccount");
        if (deleteAccountButton) {
            deleteAccountButton.addEventListener("click", this.deleteAccount.bind(this));
        }
    }

    /* 2FA */
    async handle2FAButtonClick() {
        const selected2FAMethod = document.querySelector("input[name='2fa-method']:checked").id.split("-")[1];
        if (selected2FAMethod == 'authenticator') {
            if (this.app.auth.user.two_factor_method === 'authenticator') return;
            try {
                const response = await this.app.api.setupAuthenticator();
                const QrCodeImgEl = document.getElementById('QRCode');
                QrCodeImgEl.src = `data:image/png;base64,${response.qr_code}`;
                const authenticatorModal = new Modal(document.getElementById('authenticatorModal'));
                authenticatorModal.show();
            } catch (error) {
                console.error("Error setting up authenticator app:", error);
            }
        } else {
            this.handleChange("two_factor_method", selected2FAMethod, "Two-factor authentication method successfully updated.");
        }
    }

    async submitAuthenticatorForm(form, formData) {
        try {
            await this.app.api.verifyAuthenticatorSetup(formData["otp-input"].trim());
            form.showFormSuccess("Authenticator setup successfully");
        } catch (error) {
            console.error(error);
            form.showFormError(error.response.data.error);
        }
    }
    /* Account deletion */
    deleteAccount() {
        this.app.api.deleteUser()
            .then(() => {
                this.showMessage("Account successfully deleted.", "success");
                Modal.getInstance(document.getElementById('deleteAccountModal')).hide();
                setTimeout(() => {
                    return this.app.auth.logout();
                }, 3000);
            })
            .catch(error => {
                this.showMessage("An error occurred while deleting the account.", "error");
            });
    }

    /* Update password, username, email, avatar */
    handleChange(field, newValue, successMessage, confirmPasswordValue = null) {
        newValue = newValue.trim();
        if (field === "new_password" && newValue !== confirmPasswordValue) {
            this.showMessage("Passwords do not match.", "error");
            return;
        }
        if (field === "avatar") {
            const fileInput = document.querySelector("#new-avatar");
            if (fileInput.files.length === 0) {
                this.showMessage("Please select an image to upload.", "error");
                return;
            }
            const file = fileInput.files[0];
            this.app.api.uploadAvatar(file)
                .then(() => {
                    this.showMessage(successMessage, "success");
                    setTimeout(() => this.app.navigate(this.url), 3000);
                })
                .catch(error => {
                    this.showMessage("An error occurred while updating the avatar.", "error");
                });
            return;
        }
        if (!newValue || newValue === this.app.auth.user[field]) {
            return;
        }
        this.app.api.updateUser({ [field]: newValue })
            .then(() => {
                this.showMessage(successMessage, "success");
                setTimeout(() => this.app.navigate(this.url), 3000);
            })
            .catch(error => {
                const errors = error.response.data;
                const firstErrorKey = Object.keys(errors)[0];
                if (firstErrorKey && errors[firstErrorKey][0]) {
                    return this.showMessage(capitalizeFirstLetter(errors[firstErrorKey][0]), "error");
                }
                this.showMessage("An error occurred while updating the settings.", "error");
            });
    }

    /* Show form / response message */
    showMessage(message, type) {
        const existingMessageContainer = document.querySelector(".alert");
        if (existingMessageContainer) existingMessageContainer.remove();

        const messageContainer = document.createElement("div");
        messageContainer.className = `mt-3 alert alert-${type === "success" ? "success" : "danger"} alert-dismissible fade show`;
        messageContainer.textContent = message;

        document.querySelector("#tab-content").appendChild(messageContainer);

        setTimeout(() => {
            messageContainer.classList.remove("show");
            setTimeout(() => messageContainer.remove(), 150);
        }, 3000);
    }
}

export default UserSettingsPage;