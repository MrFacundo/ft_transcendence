export const EMPTY_AVATAR_URL = "/static/images/empty-avatar.jpg";
export const API_URL = "http://localhost:8000/api";
export const MEDIA_URL = "http://localhost:8000/media";
export const WS_URL = "ws://localhost:8000/ws";
export const DEBUG = process.env.DEBUG !== 'False';

export function logSettings() {
    const settings = {
        "EMPTY_AVATAR_URL": EMPTY_AVATAR_URL,
        "API_URL": API_URL,
        "MEDIA_URL": MEDIA_URL,
        "WS_URL": WS_URL,
        "DEBUG": DEBUG,
    }
    console.log("Settings:");
    console.log(settings);
}