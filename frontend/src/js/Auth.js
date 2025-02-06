import Cookies from "js-cookie";
import { API_URL } from "./constants.js"; // TODO: handle oauth in Api.js

/**
 * Auth class handles user authentication, including login, registration, token management, and OAuth.
 */
export class Auth {
    constructor(app) {
        this.app = app;
        this.user = null;
        this.authenticated = false;
        this.accessToken = Cookies.get("access_token");
        this.oauthPopup = null;
    }

    /**
     * Authenticates the user using the access token stored in cookies.
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
                console.error(error.response.data);
                this.accessToken = null;
                Cookies.remove("access_token");
                Cookies.remove("refresh_token");
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
     * Refreshes the access token using the refresh token stored in cookies.
     * @returns {Promise<boolean>} True if the token was refreshed, false otherwise.
     */
    async refreshAccessToken() {
        const refreshToken = Cookies.get("refresh_token");
        if (!refreshToken) {
            console.error("No refresh token available");
            return false;
        }
        try {
            const response = await this.app.api.request("post", "/token/refresh/", {
                refresh: refreshToken
            });
            Cookies.set("access_token", response.access);
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
        if (password !== password_confirmation) {
            throw new Error("Passwords do not match");
        }
        try {
            return await this.app.api.createUser({ username, email, password });
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
        try {
            const responseData = await this.app.api.login(email, password);
            if (!responseData.two_factor_required) {
                console.log("Login successful");
                Cookies.set("access_token", responseData.access);
                Cookies.set("refresh_token", responseData.refresh);
                this.accessToken = responseData.access;
                this.authenticated = true;
                this.app.navigate("/home");
                return responseData;
            } else {
                console.log("2FA required");
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
        try {
            const responseData = await this.app.api.verifyOtp(otp, OtpToken);
            console.log("2FA successful");
            Cookies.set("access_token", responseData.access);
            Cookies.set("refresh_token", responseData.refresh);
            this.accessToken = responseData.access;
            this.authenticated = true;
            return responseData;

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

        if (this.oauthPopup) return; // CORS policy prevents checking if popup is open

        this.oauthPopup = window.open(
            `${API_URL}/oauth/42`,
            "OAuth Login",
            "width=600,height=600"
        );
        if (!this.oauthPopup) {
            throw new Error("Popup blocked by browser, please unblock.");
        }

        let attempts = 0;
        const maxAttempts = 30;

        const checkForTokenCookie = () => {
            // Automatically login if token is received
            const token = Cookies.get("access_token");
            if (token) {
                this.oauthPopup = null;
                return this.app.navigate("/home");
            }
            if (++attempts < maxAttempts) {
                return setTimeout(checkForTokenCookie, 1000);
            }
            console.log("Token not received. Max attempts reached");
            this.oauthPopup = null;
        };
        checkForTokenCookie();
    }

    /**
     * Logs out the user by removing tokens and navigating to the login page.
     */
    logout() {
        console.log("Logging out");
        if (this.app.ws) {
            console.log("Closing WebSocket connection");
            this.app.ws.close();
            this.app.ws = null;
        }
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        this.accessToken = null;
        this.authenticated = false;
        this.app.navigate("/login");
    }
}