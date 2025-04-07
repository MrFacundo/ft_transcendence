import Page from "./Page";
import { Modal } from 'bootstrap';
import { capitalizeFirstLetter, showMessage } from "../utils";
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
        this.setInitialValues();
    }

    setInitialValues() {
        const { username, email } = this.app.auth.user;
        document.getElementById("new-username").placeholder = username;
        document.getElementById("new-email").placeholder = email;
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
            const btn = this.mainElement.querySelector(button);
            const inp = this.mainElement.querySelector(input);
            const confirmInp = confirmInput ? this.mainElement.querySelector(confirmInput) : null;
            if (btn) btn.addEventListener("click", () => this.handleChange(field, inp.value, message, confirmInp?.value));
        });

        const update2FAButton = this.mainElement.querySelector("#two-factor .btn");
        if (update2FAButton) {
            update2FAButton.addEventListener("click", this.handle2FAButtonClick.bind(this));
        }

        const form = this.mainElement.querySelector("#authenticatorModal custom-form");
        form.submitForm = this.submitAuthenticatorForm.bind(this, form);

        const deleteAccountButton = this.mainElement.querySelector("#confirmDeleteAccount");
        if (deleteAccountButton) {
            deleteAccountButton.addEventListener("click", this.deleteAccount.bind(this));
        }
    }

    /* 2FA */
    async handle2FAButtonClick() {
        const selected2FAMethod = this.mainElement.querySelector("input[name='2fa-method']:checked").id.split("-")[1];
        if (selected2FAMethod == 'authenticator') {
            if (this.app.auth.user.two_factor_method === 'authenticator') return;
            try {
                const response = await this.app.api.setupAuthenticator();
                const QrCodeImgEl = document.getElementById('QRCode');
                QrCodeImgEl.src = `data:image/png;base64,${response.qr_code}`;
                const authenticatorModal = new Modal(document.getElementById('authenticatorModal'));
                console.log("authenticatorModal", authenticatorModal);
                authenticatorModal.show();
            } catch (error) {
                console.error("Error setting up authenticator app:", error);
            }
        } else {
            this.handleChange("two_factor_method", selected2FAMethod, "Two-factor authentication method successfully updated.");
        }
    }

    async submitAuthenticatorForm(form, formData) {
        const otp = formData["otp-input"];
        if (!otp) {
            form.showFormError("Please enter the OTP code.");
            return;
        }
        if (!/^\d{6}$/.test(otp)) {
            form.showFormError("Invalid one-time password.");
            return;
        }
        try {
            await this.app.api.verifyAuthenticatorSetup(otp.trim());
            const authenticatorModal = Modal.getInstance(document.getElementById('authenticatorModal'));
            authenticatorModal.hide();
            showMessage("Authenticator setup successfully");
        } catch (error) {
            console.error(error);
            form.showFormError(error.response.data.error);
        }
    }
    /* Account deletion */
    deleteAccount() {
        this.app.api.deleteUser()
            .then(() => {
                showMessage("Account successfully deleted.");
                Modal.getInstance(document.getElementById('deleteAccountModal')).hide();
                setTimeout(() => {
                    return this.app.auth.logout();
                }, 3000);
            })
            .catch(error => {
                showMessage("An error occurred while deleting the account.", "error");
            });
    }

    /* Update password, username, email, avatar */
    async handleChange(field, newValue, successMessage, confirmPasswordValue = null) {
        try {
            if (field === "new_password") {
                if (newValue !== confirmPasswordValue) {
                    showMessage("Passwords do not match.", "error");
                    return;
                }
            }
    
            if (field === "avatar") {
                const fileInput = this.mainElement.querySelector("#new-avatar");
                if (fileInput.files.length === 0) {
                    showMessage("Please select an image to upload.", "error");
                    return;
                }
                const file = fileInput.files[0];
                if (file.size > 5 * 1024 * 1024) {
                    showMessage("Upload error: File size must not exceed 5MB.", "error");
                    return;
                }
                const updatedUser = await this.app.api.uploadAvatar(file);
                this.updateUserAndRefresh(updatedUser, successMessage);
                return;
            }
    
            newValue = newValue.trim();
            if (!newValue || newValue === this.app.auth.user[field]) {
                return;
            }
    
            const updatedUser = await this.app.api.updateUser({ [field]: newValue });
            this.updateUserAndRefresh(updatedUser, successMessage);
        } catch (error) {
            this.handleUpdateError(error);
        }
    }
    
    handleUpdateError(error) {
        const data = error?.response?.data;

        const errorMessage = data?.error?.message
          || (typeof data === 'object' && data !== null
              ? Object.values(data)
                  .flat()
                  .filter(msg => typeof msg === 'string')
                  .join('\n')
              : "An error occurred while updating the settings.");  
        showMessage(capitalizeFirstLetter(errorMessage), "error");
    }
    
    updateUserAndRefresh(updatedUser, successMessage) {
        this.app.auth.user = updatedUser;
        showMessage(successMessage);
        this.close();
        this.open();
    }
}

export default UserSettingsPage;