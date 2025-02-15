import axios from "axios";
import { API_URL, MEDIA_URL } from "./settings.js";

/**
 * Handles all API requests.
 */
export class Api {
    constructor(auth) {
        this.auth = auth;
        this.client = axios.create({
            baseURL: API_URL,
        });
    }

    /**
     * Makes an HTTP request using axios.
     * @param {string} method - The HTTP method (e.g., 'get', 'post').
     * @param {string} url - The URL endpoint.
     * @param {Object} [data=null] - The request payload.
     * @param {Object} [config={}] - Additional axios configuration.
     * @returns {Promise<Object>} The response data.
     * @throws {Error} If the request fails.
     */
    async request(method, url, data = null, config = {}) {
        // Get the access token from the global auth object.
        const token = this.auth.accessToken;
        if (token) {
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${token}`,
            };
        }
        // Make the request and handle 401 errors by refreshing the access token.
        try {
            const response = await this.client.request({
                method,
                url,
                data,
                ...config,
            });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 401 && this.auth.authenticated) {
                const refreshed = await this.auth.refreshAccessToken();
                if (refreshed) {
                    return this.request(method, url, data, config);
                }
            }
            throw error;
        }
    }

    /* User / Auth */

    /**
     * Creates a new user.
     * @param {Object} data - The user email, password, and username.
     * @returns {Promise<Object>} The created user.
     */
    async createUser(data) {
        return this.request("post", "/user", data);
    }

    /**
     * Retrieves the authenticated user's data.
     * @returns {Promise<Object>} The current user.
     */
    async getUser() {
        return this.request("get", "/user");
    }

    /**
     * Retrieves a user's profile data.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Object>} The id specified user.
     */
    async getProfile(userId) {
        return this.request("get", `/user/${userId}`);
    }

    /**
     * Updates the authenticated user's data.
     * @param {Object} data - The user data to update.
     * @returns {Promise<Object>} The updated user.
     */
    async updateUser(data) {
        return this.request("patch", "/user", data);
    }

    /**
     * Deletes the authenticated user's account.
     */
    async deleteUser() {
        return this.request("delete", "/user");
    }

    /**
     * Verifies the user's email address.
     * @param {string} token - The email verification token.
     */
    async verifyEmail(token) {
        return this.request("get", `/verify-email/${token}/`);
    }

    /**
     * Logs in a user.
     * @param {string} email - The user's email.
     * @param {string} password - The user's password.
     * @returns {Promise<Object>} The response data.
     */
    async login(email, password) {
        return this.request("post", "/token/", {
            email_or_username: email,
            password: password,
        });
    }

    /**
     * Verifies the one-time password (OTP) for two-factor authentication.
     * @param {string} otp - A one-time password.
     * @param {string} otpToken - A OTP token.
     * @returns {Promise<Object>} JWT refresh and access tokens.
     */
    async verifyOtp(otp, OtpToken) {
        return this.request("post", "2fa/verify-otp/", {
            otp: otp,
            otp_token: OtpToken,
        });
    }


    /**
     * Sets up an authenticator app as two-factor authentication for the authenticated user.
     * @returns {Promise<Object>} A base 64 QR code
     */
    async setupAuthenticator() {
        return this.request("get", "2fa/setup/");
    }
    
    /**
     * Verifies an authenticator app as two-factor authentication for the authenticated user.
     * @param {string} otp - A one-time password.
     * @returns {Promise<Object>} Success message
     */
    async verifyAuthenticatorSetup(otp) {
        return this.request("post", "2fa/verify-setup/", {
            otp: otp,
        });
    }

    /* User lists */

    /**
     * Retrieves a list with all users, along with Friendship data related to the current user.
     */
    async getUsers() {
        return this.request("get", "/users/");
    }

    /**
     * Retrieves a list with online users only.
     */
    async getOnlineUsers() {
        return this.request("get", "/online-users/");
    }

    /**
     * Retrieves a list current the user friends, along with their Game Invitation data related to the current user.
     */
    async getFriends(userId) {
        return this.request("get", `/friends/${userId}/`);
    }

    /* Friends */

    /**
     * Sends a friend request to a user.
     * @param {string} userId - The ID of the user to send a friend request to.
     */
    async friendRequest(userId) {
        return this.request("post", `/friend-request/${userId}`, {});
    }

    /**
     * Accepts a friend request from a user.
     * @param {string} userId - The ID of the user whose friend request is being accepted.
     */
    async friendAccept(userId) {
        return this.request("post", `/friend-accept/${userId}`, {});
    }

    /* Online Status */

    /**
     * Lists all online status objects.
    */
    async getOnlineStatuses() {
        return this.request("get", "/online-status/");
    }

    /* Games */

    /**
     * Invites user to a new game.
     * @param {Object} userId - The ID of the user to send a game request to. 
     * @returns {Promise<Object>} Game invitation id
     */
    async gameRequest(userId) {
        return this.request("post", `/game-invitation/${userId}/`, {});
    }

    /**
     * Accepts a game request from a user.
     * @param {string} gameInviteId - The ID of the game invite to accept.
     * @returns {Promise<Object>} Game url
     */
    async gameAccept(gameInviteId) {
        return this.request("post", `/game-invitation/${gameInviteId}/accept/`, {});
    }

    /**
     * Retrieves a game by ID.
     * @param {string} gameId - The ID of the game.
     * @returns {Promise<Object>} A game object.
    */
    async getGame(gameId) {
        return this.request("get", `/games/${gameId}/`);
    }

    /**
     * Retrieves a list of results of games played by the user specified by userId.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Object>} A list of game results.
    */
    async getMatchHistory(userId) {
        return this.request("get", `/match-history/${userId}/`);
    }

    /* Tournaments */

    /**
     *  Creates a new tournament.
     * @param {string} tournamentName - The name of the tournament.
     * @param {number} participantsAmount - The number of participants in the tournament.
     * @returns {Promise<Object>} A tournament object.
     */
    async createTournament(tournament_name, participants_amount) {
        return this.request("post", "/tournament/", {
                name: tournament_name,
                participants_amount: participants_amount
            });
    }

    /**
     *  Joins an existing tournament.
     * @param {string} tournamentId - The ID of the tournament.
     * @returns {Promise<Object>} A tournament object.
     */
    async joinTournament(tournamentId) {
        return this.request("patch", `/tournament/${tournamentId}/`, {});
    }

    /**
     * Retrieves a tournament by ID.
     * @param {string} tournamentId - The ID of the tournament.
     * @returns {Promise<Object>} A tournament object.
     */
    async getTournament(tournamentId) {
        return this.request("get", `/tournament/${tournamentId}/`);
    }

    /**
     * Retrieves a list of all tournaments.
     * @returns {Promise<Object>} A list of tournaments.
     * */
    async getTournaments() {
        return this.request("get", "/tournaments/");
    }

    /**
     * Retrieves the tournament the current user is participating in.
     * @returns {Promise<Object>} A tournament object.
     * */
    async getCurrentTournament() {
        return this.request("get", "/tournament/current/");
    }

    /* Media */

    /**
     * Uploads an avatar image for the authenticated user.
     * @param {File} file - The avatar image file.
     */
    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append("avatar_upload", file);
        return this.request("patch", "/user", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    }

    /**
     * Fetches the avatar image as a blob object URL.
     * @param {string} path - The path to the avatar image.
     * @returns {Promise<string|null>} The object URL of the avatar image, or null if the request fails.
     */
    fetchAvatarObjectUrl = async (path) => {
        try {
            const response = await this.request("get", `${MEDIA_URL}/${path}`, null, {
                responseType: "blob",
            });
            return URL.createObjectURL(response);
        } catch (error) {
            console.error("Error fetching avatar object URL:", error);
            return null;
        }
    }
}