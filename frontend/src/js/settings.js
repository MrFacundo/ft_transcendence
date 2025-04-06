const EMPTY_AVATAR_URL = "/static/images/empty-avatar.jpg";

const API_URL = "/api";
const MEDIA_URL = "/media";
const WS_URL = `wss://localhost/ws`;

const DEBUG = process.env.NODE_ENV !== 'production';

export const settings = {
    "EMPTY_AVATAR_URL": EMPTY_AVATAR_URL,
    "API_URL": API_URL,
    "MEDIA_URL": MEDIA_URL,
    "WS_URL": WS_URL,
    "DEBUG": DEBUG,
};

if (!DEBUG) {
    console.log = function () {};
    console.warn = function () {};
    console.error = function () {};
}
