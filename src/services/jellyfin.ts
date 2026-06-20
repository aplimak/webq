import { showSuccessToast } from "../utils";
import axios from "axios";

function addCopyBtn(copyBtn: Element, address: string) {
    copyBtn.classList.remove("hide");
    copyBtn.addEventListener("click", async () => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(address);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = address;
                textArea.style.position = "absolute";
                textArea.style.top = "-9999px"; // Hide it off-screen
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
            }
            showSuccessToast("Text Copied", 4000);
            const icon = copyBtn.querySelector(".material-icons");
            if (icon) {
                icon.innerHTML = "check";
                setTimeout(() => {
                    icon.innerHTML = "content_copy";
                }, 3000);
            }
        } catch (e) {
            alert(`Error when trying to copy address: ${e}`);
        }
    });
}

export default async function (card: Element) {
    try {
        const enterBtn = card.querySelector("#jf-stable-client");
        if (!enterBtn) {
            throw Error("Malformed jellyfin card, #jf-stable-client not found");
        }

        const response = await axios.get("https://jf.ring.home/System/Info/Public");
        if (response.status !== 200) {
            throw Error(
                `Jellyfin server respond: ${response.status} (${response.statusText})`
            );
        }
        const json = response.data;
        if (!json.ProductName || json.ProductName !== "Jellyfin Server") {
            throw Error(`Invalid jellyfin server response: ${json}`);
        }

        const titleContainer = card.querySelector(".title-container");
        if (titleContainer) {
            const elem = document.createElement("span");
            elem.classList.add("card-text", "hide-mobile");
            elem.innerHTML = json.Version;
            titleContainer.appendChild(elem);
        }

        enterBtn.classList.remove("hide");
        enterBtn.addEventListener("click", async () => {
            window.location.href = "https://jf.ring.home";
        });

        const copyBtn = card.querySelector("#jf-copy-link");
        if (copyBtn) {
            addCopyBtn(copyBtn, "https://jf.ring.home");
        }
    } catch (e) {
        console.log(`Error on checking jellyfin server: ${e}`);
        const btnContainer = card.querySelector(".button-container");
        if (btnContainer) {
            btnContainer.classList.add("hide");
        }
        const elem = document.createElement("span");
        elem.classList.add("error");
        elem.innerHTML = "This Service is not Avaiable Right now!";
        card.appendChild(elem);
    }
}
