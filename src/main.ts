export async function route(content: Element) {
    const main = await import("./main.html");
    content.innerHTML = main.default;

    const cardContainer = content.querySelector(".card-container");
    if (!cardContainer) {
        console.error("card-container not found");
        return;
    }

    // Cloud
    const cloudCard = cardContainer.querySelector("#cloud-card");
    if (cloudCard) {
        const cloud = await import("./services/cloud");
        await cloud.default(cloudCard);
    }

    // Jellyfin Server
    const jfCard = cardContainer.querySelector("#jf-card");
    if (jfCard) {
        const jellyfin = await import("./services/jellyfin");
        await jellyfin.default(jfCard);
    }

    // Kiwix
    const kiwixCard = cardContainer.querySelector("#kiwix-card");
    if (kiwixCard) {
        const kiwix = await import("./services/kiwix");
        await kiwix.default(kiwixCard);
    }

    // Ollama
    const ollamaCard = cardContainer.querySelector("#ollama-card");
    if (ollamaCard) {
        const ollama = await import("./apps/ollama");
        await ollama.default(ollamaCard);
    }

    // Remote Portal
    const rpCard = cardContainer.querySelector("#rp-card");
    if (rpCard) {
        const remotePortal = await import("./services/remoteportal");
        await remotePortal.default(rpCard);
    }

    // Immich
    const immichCard = cardContainer.querySelector("#immich-card");
    if (immichCard) {
        const immich = await import("./services/immich");
        await immich.default(immichCard);
    }

    // Uno app
    const unoCard = cardContainer.querySelector("#uno-card");
    if (unoCard) {
        const uno = await import("./apps/uno");
        uno.default(unoCard);
    }
}