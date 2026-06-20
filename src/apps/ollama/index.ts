import { navigateTo, showErrorToast } from "../../utils";
import { OllamaClient, type OllamaOptions } from "./backend";
import markdownIt from "markdown-it"
import hljs from "highlight.js";

import main from "./main.html";
import "./style.css";

const client = new OllamaClient();
let selectedModel: string = "";

export async function route(content: Element) {
    const models = await client.models();
    const firstModel = models[0];
    const preferredModel = models.find((model) => model.model === "gemma3:12b");
    if (preferredModel) {
        selectedModel = preferredModel.model;
    } else if (firstModel) {
        selectedModel = firstModel.model;
    } else {
        showErrorToast("There are no usable model avaiable");
        return;
    }

    content.innerHTML = main;

    content.querySelector("#ai-send")?.addEventListener("click", () => {
        sendPrompt(content);
    });

    const modelSelector = content.querySelector<HTMLSelectElement>("#ai-model");
    if (modelSelector) {
        if (models.length === 1) {
            modelSelector.classList.add("hide");
        }

        for (const model of models) {
            const option = document.createElement("option");
            option.text = model.name;
            option.value = model.model;
            modelSelector.appendChild(option);
        }

        modelSelector.selectedIndex = models.findIndex(
            (model) => model.model === selectedModel,
        );

        modelSelector.addEventListener("change", () => {
            const selected = modelSelector.options[modelSelector.selectedIndex];
            if (selected) {
                selectedModel = selected.value;
            } else {
                showErrorToast("Failed to update selected model");
            }
        });
    }

    const actionContainer = content.querySelector("#ai-bottom-bar");
    const responseContainer = content.querySelector("#ai-response");
    const dirBtn = content.querySelector("#ai-dir");
    if (dirBtn && responseContainer) {
        dirBtn.addEventListener("click", () => {
            let dir = responseContainer.attributes.getNamedItem("dir");
            let lang = responseContainer.attributes.getNamedItem("lang");
            if (!dir) {
                dir = document.createAttribute("dir");
            }
            if (!lang) {
                lang = document.createAttribute("lang");
            }
            if (dir.value === "rtl") {
                dir.value = "ltr";
                lang.value = "en";
                dirBtn.innerHTML = "RTL";
            } else {
                dir.value = "rtl";
                lang.value = "fa";
                dirBtn.innerHTML = "LTR";
            }
            responseContainer.attributes.setNamedItem(dir);
            responseContainer.attributes.setNamedItem(lang);
            actionContainer?.attributes.setNamedItem(dir.cloneNode() as Attr);
            actionContainer?.attributes.setNamedItem(lang.cloneNode() as Attr);
        });
    }
}

async function sendPrompt(content: Element) {
    const responseContainer = content.querySelector("#ai-response");
    if (!responseContainer) {
        return;
    }

    const promptInput = content.querySelector<HTMLInputElement>("#ai-prompt");
    if (!promptInput) {
        return;
    }

    const prompt = promptInput.value;
    if (!prompt || prompt.trim().length === 0) {
        showErrorToast("Empty input");
        return;
    }
    promptInput.value = "";

    const promptCard = document.createElement("div");
    promptCard.classList.add("card", "flat", "flex-col", "padded", "selectable");
    promptCard.style.marginLeft = "auto";
    promptCard.innerHTML = prompt;
    responseContainer.appendChild(promptCard);

    const responseCard = document.createElement("div");
    responseCard.classList.add("card", "prime", "flex-col", "padded");
    responseCard.style.marginRight = "auto";

    const responseWaiting = document.createElement("div");
    responseWaiting.id = "ai-waiting";
    responseWaiting.classList.add("center", "gapped");
    responseWaiting.innerHTML = `
    <span class="rotate infinite material-icons">sync</span>
    <span>Waiting for response</span>`;
    responseCard.appendChild(responseWaiting);

    responseContainer.appendChild(responseCard);

    const options: OllamaOptions = {
        model: selectedModel,
        prompt: prompt,
        stream: true,
    };

    console.log(`Sending prompt: ${prompt}`);

    try {
        const md = new markdownIt({
            html: true,
  linkify: true,
  typographer: true,

            highlight: function (str, lang) {
                     if (lang && hljs.getLanguage(lang)) {
                       try {
                         return hljs.highlight(str, {
                            language: lang,
                            ignoreIllegals: true
                         }).value;
                       } catch (__) {}
                     }
                
                     return ''; // use external default escaping
                   }
        });
        const streamResult = client.stream(options);
        let response = "";

        for await (const chunk of streamResult) {
            if (!responseCard.classList.contains("selectable")) {
                responseCard.classList.add("selectable");
            }

            if (chunk.response === "\n") {
                response += "\n";
                continue;
            }

            const lines = chunk.response.split("\n");

            for (const line of lines) {
                if (line === "") {
                    response += "\n";
                    continue;
                }

                response += line;
                responseCard.innerHTML = md.render(response);
            }
        }
    } catch (error) {
        console.error(error);
        const errorText = `${error instanceof Error ? error.message : error}`;
        showErrorToast(errorText);
        const errItem = document.createElement("p");
        errItem.classList.add("flex-row", "center", "gapped");
        errItem.innerHTML = `
        <span class="material-icons">error</span>
        <span>${errorText}</span>`;
        responseCard.removeChild(responseWaiting);
        responseCard.appendChild(errItem);
    }
}

export default async function (card: Element) {
    const owuiBtn = card.querySelector("#owui-button");
    if (owuiBtn) {
        owuiBtn.classList.remove("hide");
        owuiBtn.addEventListener("click", async () => {
            window.location.href = "https://owui.ring.home"
        });
    }
    
    const integrateClientBtn = card.querySelector("#ollama-button");
    if (integrateClientBtn) {
        integrateClientBtn.classList.remove("hide");
        integrateClientBtn.addEventListener("click", async () => {
            navigateTo("/ollama");
        });
    }
}
