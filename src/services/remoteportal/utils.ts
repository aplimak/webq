import { getLocalItem, StorageCategory, setLocalItem } from "../../utils";

export function getApiKey() {
    return getLocalItem(StorageCategory.remotePortal, "apiKey");
}

export function saveApiKey(apiKey: string) {
    setLocalItem(StorageCategory.remotePortal, "apiKey", apiKey);
}
