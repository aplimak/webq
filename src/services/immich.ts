export default async function (card: Element) {
    const enterBtn = card.querySelector("#immich-button");
    if (enterBtn) {
        enterBtn.classList.remove("hide");
        enterBtn.addEventListener("click", async () => {
            window.location.href = "https://immich.ring.home";
        });
    }
}
