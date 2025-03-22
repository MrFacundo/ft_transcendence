import { settings } from "./settings.js";
import Cookies from "js-cookie";

/**
 * Handles user authentication, including login, registration, token and OAuth2 management.
 */
export class Auth {
    constructor(app) {
        this.app = app;
        this.user = null;
        this.authenticated = false;
        this.accessToken = sessionStorage.getItem("access_token");
        this.oauthPopup = null;
    }

    /**
     * Authenticates the user using the access token stored in session storage.
     * @returns {Promise<boolean>} True if authenticated, false otherwise.
     */
    async authenticate() {
        if (this.accessToken) {
            try {
                const response = await this.app.api.getUser();
                this.user = response;
                this.authenticated = true;
                return true;
            } catch (error) {
                console.error(error.response?.data || error.message);
                this.accessToken = null;
                sessionStorage.removeItem("access_token");
                sessionStorage.removeItem("refresh_token");
                this.authenticated = false;
                return false;
            }
        } else {
            console.log("No access token found");
            this.authenticated = false;
            return false;
        }
    }

    /**
     * Refreshes the access token using the refresh token stored in session storage.
     * @returns {Promise<boolean>} True if the token was refreshed, false otherwise.
     */
    async refreshAccessToken() {
        const refreshToken = sessionStorage.getItem("refresh_token");
        if (!refreshToken) {
            console.error("No refresh token available");
            return false;
        }
        try {
            const response = await this.app.api.refreshToken(refreshToken);
            sessionStorage.setItem("access_token", response.access);
            this.accessToken = response.access;
            console.log("Access token successfully refreshed");
            return true;
        } catch (error) {
            console.error("Error refreshing access token, logging out", error);
            this.logout();
            return false;
        }
    }

    /**
     * Registers a new user.
     * @param {string} username - The username of the new user.
     * @param {string} email - The email of the new user.
     * @param {string} password - The password of the new user.
     * @param {string} password_confirmation - The password confirmation.
     * @returns {Promise<Object>} The response from the API.
     * @throws {Error} If any field is missing or passwords do not match.
     */
    async register(username, email, password, password_confirmation) {
        if (!username || !email || !password || !password_confirmation) {
            throw new Error("All fields are required");
        }
        if (username.length > 20 || email.length > 30 || password.length > 20) {
            throw new Error("Invalid email or password");
        }
        if (password !== password_confirmation) {
            throw new Error("Passwords do not match");
        }
        try {
            return await this.app.api.createUser(username, email, password);
        } catch (error) {
            console.error("Auth: Error response data:", error.response.data);
            throw error;
        }
    }

    /**
     * Logs in a user.
     * @param {string} email - The email of the user.
     * @param {string} password - The password of the user.
     * @returns {Promise<Object>} The response from the API.
     * @throws {Error} If email or password is missing or login fails.
     */
    async login(email, password) {
        if (!email || !password) {
            throw new Error("Email and password are required");
        }
        if (email.length > 30 || password.length > 20) {
            throw new Error("Invalid email or password");
        }
        try {
            const responseData = await this.app.api.login(email, password);
            if (!responseData.two_factor_required) {
                sessionStorage.setItem("access_token", responseData.access);
                sessionStorage.setItem("refresh_token", responseData.refresh);
                this.accessToken = responseData.access;
                this.app.navigate("/home");
            } else {
                localStorage.setItem("otp_oken", responseData.otp_token);
                this.app.navigate("/two-factor-auth");
                return responseData;
            }
        } catch (error) {
            if (error.response) {
                console.error(error);
            } else {
                console.error("Axios configuration error:", error.message);
            }
            throw error;
        }
    }

    /**
     * Verifies the one-time password (OTP) for two-factor authentication.
     * @param {string} otp - The one-time password.
     * @returns {Promise<Object>} The response from the API.
     * @throws {Error} If OTP is missing or verification fails.
     */
    async verifyOtp(otp) {
        const OtpToken = localStorage.getItem("otp_oken");
        if (!OtpToken) {
            console.error("No OTP token found");
            return this.app.navigate("/login");
        }
        if (!otp) {
            throw new Error("Please enter your one-time password");
        }
        if (!/^\d{6}$/.test(otp)) {
            throw new Error("Invalid one-time password");
        }
        try {
            const responseData = await this.app.api.verifyOtp(otp, OtpToken);
            console.log("2FA successful");
            sessionStorage.setItem("access_token", responseData.access);
            sessionStorage.setItem("refresh_token", responseData.refresh);
            this.accessToken = responseData.access;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * Initiates OAuth login process:
     * - Checks if user is already authenticated.
     * - Opens a new which calls the OAuth endpoint.
     * - Checks for token cookie every second.
     * @throws {Error} If popup is blocked by the browser.
     */
    async oAuthLogin() {
        await this.authenticate();
        if (this.authenticated) {
            return this.app.navigate("/home");
        }
        this.oauthPopup = window.open(
            `${settings.API_URL}/oauth/42`,
            "OAuth Login",
            "width=600,height=600"
        );
        if (!this.oauthPopup) {
            alert("Popup blocked by browser. Please unblock and try again.");
            return;
        }
        try {
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 30;

                const checkForTokenCookie = () => {
                    this.accessToken = Cookies.get("access_token");
                    if (this.accessToken) {
                        sessionStorage.setItem("access_token", this.accessToken);
                        sessionStorage.setItem("refresh_token", Cookies.get("refresh_token"));
                        Cookies.remove("access_token");
                        Cookies.remove("refresh_token");
                        return resolve();
                    }
                    if (++attempts >= maxAttempts) return reject("Token not received.");
                    setTimeout(checkForTokenCookie, 1000);
                };
                checkForTokenCookie();
            });
            this.oauthPopup.close();
            this.oauthPopup = null;
            this.app.navigate("/home");
        } catch (error) {
            console.error(error);
            if (this.oauthPopup) this.oauthPopup.close();
            this.oauthPopup = null;
        }
    } 

    /**
     * Logs out the user by removing tokens and navigating to the login page.
     */
    logout() {
        console.log("Logging out");
        this.app.wsManager.closeConnections();
        this.app.stateManager.close();
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        this.accessToken = null;
        this.authenticated = false;
        this.app.navigate("/login");
      }
}