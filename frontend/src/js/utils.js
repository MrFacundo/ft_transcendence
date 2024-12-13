export function capitalizeFirstLetter(message) {
	return message.charAt(0).toUpperCase() + message.slice(1);
}

export function showMessage(message) {
    if (!message) return;
    const messagePopup = document.createElement('div');
    messagePopup.className = 'message-popup position-fixed start-50 translate-middle-x bg-warning text-white p-2 rounded opacity-0 transition-opacity';
    messagePopup.textContent = message;
    document.body.appendChild(messagePopup);

    setTimeout(() => {
        messagePopup.classList.add('opacity-100');
    }, 10);

    setTimeout(() => {
        messagePopup.classList.remove('opacity-100');
        setTimeout(() => {
            document.body.removeChild(messagePopup);
        }, 500);
    }, 3000);
}

export function parsePath(path, pages) {
    const requestedPath = path.replace(/\/+$/, "");

    return Object.values(pages).reduce((match, page) => {
        if (match) return match; // If a match is found, skip further processing
        const pagePath = page.url.replace(/\/+$/, "");
        const pageParts = pagePath.split("/").filter(Boolean);
        const requestedParts = requestedPath.split("/").filter(Boolean);

        if (pageParts.length !== requestedParts.length) return null;

        const params = {};
        const isMatch = pageParts.every((part, i) => {
            if (part.startsWith(":")) {
                params[part.slice(1)] = requestedParts[i];
                return true;
            }
            return part === requestedParts[i];
        });
        const queryParams = requestedPath.split("?")[1];
        return isMatch ? { page, params } : null;
    }, null);
}