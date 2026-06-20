import { getRelativeTime, isElementHidden, showErrorToast, showInfoToast } from "../../utils";
import * as api from "./api"
import main from "./main.html";
import eventCardHtml from "./event.html";
import siteCardHtml from "./site.html";
import { Event, Site, Status } from "./models";
import "./style.scss";

let cachedStatus: Status | null = null
let cachedLEvent: Event | null = null

export async function route(content: Element) {
    content.innerHTML = main;

    const serviceBtn = content.querySelector("#svc-ctl");
    if (serviceBtn) {
        serviceBtn.addEventListener("click", async () => {
            if (serviceBtn.classList.contains("disabled")) {
                return;
            }

            try {
                if (serviceBtn.getAttribute("data-running") === "false") {
                    await api.service_start();
                } else {
                    await api.service_stop();
                }
            } catch (error) {
                showErrorToast(`${error instanceof Error ? error.message : error}`);
                return;
            }
    
            await refreshStatus(content);
        })
    }

    const runBtn = content.querySelector("#check-run");
    if (runBtn) {
        runBtn.addEventListener("click", async () => {
            if (runBtn.classList.contains("disabled")) {
                return;
            }

            api.check().then(() => {
                refreshStatus(content);
            }).catch(error => {
                showErrorToast(error instanceof Error ? error.message : error);
            })
    
            setTimeout(() => {
                refreshStatus(content);
            }, 50);
        })
    }

    content.querySelector("#refresh-all")?.addEventListener("click", async () => {
        await refresh(content);
    });

    const infoCtlBtn = content.querySelector("#server-info-ctl");
    const infoDiv = content.querySelector("#server-info");
    if (infoCtlBtn && infoDiv) {
        infoCtlBtn.addEventListener("click", () => {
            if (infoDiv.classList.contains("hide-mobile")) {
                infoDiv.classList.remove("hide-mobile");
                infoCtlBtn.setAttribute("data-expanded", "true");
                refreshTimedStatus(content)
            } else {
                infoDiv.classList.add("hide-mobile");
                infoCtlBtn.setAttribute("data-expanded", "false");
            }

            updateInfoCtlBtn(infoCtlBtn);
        });
    }

    const eventsCtlBtn = content.querySelector("#events-ctl");
    const eventContainer = content.querySelector("#events-container");
    if (eventsCtlBtn && eventContainer) {
        eventsCtlBtn.addEventListener("click", () => {
            if (eventContainer.classList.contains("hide-mobile")) {
                eventContainer.classList.remove("hide-mobile");
                eventsCtlBtn.setAttribute("data-expanded", "true");
                refreshEvents(content)
            } else {
                eventContainer.classList.add("hide-mobile");
                eventsCtlBtn.setAttribute("data-expanded", "false");
            }

            updateEventsCtlBtn(eventsCtlBtn);
        });
    }
    
    if (eventContainer) {
        eventContainer.addEventListener("click", async (e) => {
            let target: HTMLElement | null = e.target as HTMLElement;
            let card: Element | null = null;
            if (target) {
                card = target.closest(".card.event")
            }
            if (!card) {
                return;
            }
            const siteId = card.getAttribute("data-site-id");
            if (!siteId) {
                return;
            }
            
            const site = await api.get_site(siteId);

            const siteUrl = assembleSiteAddress(site);
            if (!siteUrl) {
                return;
            }

            window.open(siteUrl, "_blank");
        })
    }

    content.querySelector("#refresh-events")?.addEventListener("click", async () => {
        await refreshEvents(content);
    });

    content.querySelector("#clear-events")?.addEventListener("click", async () => {
        try {
            const confirm = window.confirm("Are you sure to clear all events?");
            if (!confirm) {
                showErrorToast("Cancelled by user");
                return;
            }
            await api.delete_events();
            await refreshEvents(content);
        } catch (e) {
            showErrorToast(`Error: ${e instanceof Error ? e.message : e}`);
            return;
        }
    });

    const siteContainer = content.querySelector("#sites-container");
    const filterBar = content.querySelector("#sites-filter-bar");
    if (siteContainer && filterBar) {
        filterBar.addEventListener("click", (e) => {
            let target: HTMLElement | null = e.target as HTMLElement;
            if (target && !(target instanceof HTMLButtonElement)) {
                target = target.closest("#sites-filter-bar button")
            }
            if (!target) {
                return;
            }
            
            const statusFilter = target.getAttribute("data-site-filter");
            if (!statusFilter || statusFilter === "all") {
                siteContainer.removeAttribute("data-site-filter");
            } else {
                siteContainer.setAttribute("data-site-filter", statusFilter);
            }

            for (const child of filterBar.children) {
                if (child.classList.contains("primary")) {
                    child.classList.add("secondary")
                    child.classList.remove("primary")
                }
            }

            target.classList.remove("secondary")
            target.classList.add("primary")
        })
    }

    if (siteContainer) {
        siteContainer.addEventListener("click", async (e) => {
            let target: HTMLElement | null = e.target as HTMLElement;
            let card: Element | null = null;
            if (target) {
                card = target.closest(".card.site")
            }
            if (!card) {
                return;
            }
            
            const btn = target instanceof HTMLButtonElement ? target : target.closest(".card.site button")
            if (btn) {
                if (btn.classList.contains("disabled")) {
                    return;
                }
                const siteId = card.getAttribute("data-site-id");
                if (!siteId) {
                    return;
                }

                if (btn.id === "site-delete") {
                    try {
                        const confirm = window.confirm("Are you sure to delete the site?");
                        if (!confirm) {
                            showErrorToast("Cancelled by user");
                            return;
                        }
                        await api.delete_site(siteId);
                        await refresh(content);
                    } catch (e) {
                        showErrorToast(`Error: ${e instanceof Error ? e.message : e}`);
                        return;
                    }
                } else if (btn.id === "site-check") {
                    btn.classList.add("disabled");
                    const icon = btn.querySelector("span");
                    if (icon) {
                        icon.innerHTML = "sync";
                    }

                    try {
                        await api.check(siteId);
                    } catch (e) {
                        showErrorToast(`Error: ${e instanceof Error ? e.message : e}`);
                        return;
                    } finally {
                        if (icon) {
                            icon.innerHTML = "play_arrow";
                        }
                        btn.classList.remove("disabled");
                    }

                    refreshSites(content);
                }
            } else {
                // Card clicked
                const siteUrl = card.getAttribute("data-site-addr");
                if (!siteUrl) {
                    return;
                }

                window.open(siteUrl, "_blank");
            }
        })
    }

    content.querySelector("#refresh-sites")?.addEventListener("click", async () => {
        await refreshSites(content);
    });

    content.querySelector("#clear-sites")?.addEventListener("click", async () => {
        try {
            const confirm = window.confirm("Are you sure to clear all sites?");
            if (!confirm) {
                showErrorToast("Cancelled by user");
                return;
            }
            await api.delete_sites();
            await refresh(content);
        } catch (e) {
            showErrorToast(`Error: ${e instanceof Error ? e.message : e}`);
            return;
        }
    });
    
    await refresh(content);

    const statusRefreshTimer = setInterval(() => {
        if (!content.querySelector("#connection-monitor")) {
            clearInterval(statusRefreshTimer);
            return;
        }

        refreshStatus(content);
    }, 5000);

    const timedStatusRefreshTimer = setInterval(() => {
        if (!content.querySelector("#connection-monitor")) {
            clearInterval(timedStatusRefreshTimer);
            return;
        }

        refreshTimedStatus(content);
    }, 1000);
}

async function refresh(content: Element) {
    const infoCtlBtn = content.querySelector("#server-info-ctl");
    if (infoCtlBtn) {
        updateInfoCtlBtn(infoCtlBtn);
    }

    const eventsCtlBtn = content.querySelector("#events-ctl");
    if (eventsCtlBtn) {
        updateEventsCtlBtn(eventsCtlBtn);
    }
    
    const tasks = []
    tasks.push(refreshStatus(content, false));
    tasks.push(refreshEvents(content))
    tasks.push(refreshSites(content))

    await Promise.all(tasks)
}

async function refreshStatus(content: Element, updateOnNewEvent=true) {
    const status = cachedStatus = await api.status();
    const lastEvent: Event | undefined = (await api.get_events({
        limit: 1
    }))[0];

    let newEvent = false;

    if (lastEvent) {
        if (cachedLEvent && lastEvent.id !== cachedLEvent.id) {
            newEvent = true;
        }
        cachedLEvent = lastEvent;
    } else {
        cachedLEvent = null;
    }

    refreshTimedStatus(content);

    const serviceBtn = content.querySelector("#svc-ctl");
    if (serviceBtn) {
        updateServiceBtn(serviceBtn, status)
    }

    const runBtn = content.querySelector("#check-run");
    if (runBtn) {
        updateRunBtn(runBtn, status)
    }

    if (updateOnNewEvent && newEvent) {
        refreshEvents(content);
        refreshSites(content)
    }
}

function refreshTimedStatus(content: Element) {
    const infoDiv = content.querySelector("#server-info");
    if (!(infoDiv instanceof HTMLDivElement) || isElementHidden(infoDiv)) {
        return;
    }

    if (cachedStatus) {
        const checkLastRun = content.querySelector("#check-last-run");
        if (checkLastRun) {
            if (cachedStatus.checker.running) {
                checkLastRun.innerHTML = "Running";
            } else if (!cachedStatus.checker.last_run) {
                checkLastRun.innerHTML = "N/A";
            } else {
                checkLastRun.innerHTML = getRelativeTime(cachedStatus.checker.last_run);
            }
        }

        const serviceLastRun = content.querySelector("#svc-last-run");
        if (serviceLastRun) {
            if (cachedStatus.monitor.checking) {
                serviceLastRun.innerHTML = "Running";
            } else if (!cachedStatus.monitor.last_run) {
                serviceLastRun.innerHTML = "N/A";
            } else {
                serviceLastRun.innerHTML = getRelativeTime(cachedStatus.monitor.last_run);
            }
        }

        const serviceNextRun = content.querySelector("#svc-next-run");
        if (serviceNextRun) {
            if (cachedStatus.monitor.checking) {
                serviceNextRun.innerHTML = "Running";
            } else if (!cachedStatus.monitor.next_run) {
                serviceNextRun.innerHTML = "Stopped";
            } else {
                serviceNextRun.innerHTML = getRelativeTime(cachedStatus.monitor.next_run);
            }
        }
    }

    const lastEventElem = content.querySelector("#last-event");
    if (lastEventElem) {
        if (cachedLEvent) {
            lastEventElem.innerHTML = getRelativeTime(cachedLEvent.timestamp);
        } else {
            lastEventElem.innerHTML = "Nothing";
        }
    }
}

async function refreshEvents(content: Element) {
    const container = content.querySelector("#events-container");
    if (!(container instanceof HTMLDivElement) || isElementHidden(container)) {
        return;
    }

    const events = await api.get_events({
        limit: 25
    });

    container.innerHTML = "";

    for (const event of events) {
        const card = createEventCard(event);
        container.appendChild(card);
    }
}

async function refreshSites(content: Element) {
    const container = content.querySelector("#sites-container");
    if (!container) {
        return;
    }

    const sites = await api.get_sites();

    container.innerHTML = "";

    for (const site of sites.sites) {
        const card = createSiteCard(site);
        container.appendChild(card);
    }
}

function updateServiceBtn(btn: Element, status: Status) {
    const icon = btn.querySelector("span:nth-child(1)")
    const label = btn.querySelector("span:nth-child(2)")
    if (!icon || !label) {
        return
    }

    icon.classList.remove("rotate")
    btn.classList.add("primary")
    btn.classList.remove("disabled")

    if (!status.monitor.running) {
        icon.innerHTML = "play_circle_outline"
        label.innerHTML = "Start"
        btn.setAttribute("data-running", "false")
    } else {
        if (status.monitor.cancelled) {
            icon.innerHTML = "sync"
            icon.classList.add("rotate", "infinite")
            btn.classList.remove("primary")
            btn.classList.add("disabled")
            label.innerHTML = "Waiting"
        } else {
            icon.innerHTML = "pause_circle_outline"
            label.innerHTML = "Stop"
            btn.setAttribute("data-running", "true")
        }
    }
}

function updateRunBtn(btn: Element, status: Status) {
    const icon = btn.querySelector("span:nth-child(1)")
    const label = btn.querySelector("span:nth-child(2)")
    if (!icon || !label) {
        return
    }

    icon.classList.remove("rotate")
    btn.classList.add("primary")
    btn.classList.remove("disabled")

    if (!status.checker.running) {
        icon.innerHTML = "play_arrow"
        label.innerHTML = "Run"
        btn.setAttribute("data-running", "false");
    } else {
        icon.innerHTML = "sync"
        icon.classList.add("rotate", "infinite")
        btn.classList.remove("primary")
        btn.classList.add("disabled")
        label.innerHTML = "Running"
        btn.setAttribute("data-running", "true");
    }
}

function updateInfoCtlBtn(btn: Element) {
    const label = btn.querySelector("span:nth-child(1)")
    const icon = btn.querySelector("span:nth-child(2)")
    if (!icon || !label) {
        return
    }

    if (btn.getAttribute("data-expanded") === "true") {
        label.innerHTML = "Less Info";
        icon.innerHTML = "keyboard_arrow_up";
    } else {
        label.innerHTML = "More Info";
        icon.innerHTML = "keyboard_arrow_down";
    }
}

function updateEventsCtlBtn(btn: Element) {
    if (btn.getAttribute("data-expanded") === "true") {
        btn.innerHTML = "keyboard_arrow_up";
    } else {
        btn.innerHTML = "keyboard_arrow_down";
    }
}

function createEventCard(event: Event) {
    const div = document.createElement("div");
    div.id = `events-${event.id}`;
    div.classList.add("card", "event", "flat", "flex-col", "gapped");
    div.setAttribute("data-site-id", event.site_id);
    div.setAttribute("data-status", event.new_status);
    div.setAttribute("data-timestamp", event.timestamp.toString());

    const log = parseEventLog(event.log)

    const html = eventCardHtml.replaceAll("$timestamp$", getRelativeTime(event.timestamp, true))
                              .replaceAll("$name$", event.site_name)
                              .replaceAll("$log$", log)
                              .replaceAll("$olog$", event.log)
                              .replaceAll("$old_status$", event.old_status.toUpperCase())
                              .replaceAll("$new_status$", event.new_status.toUpperCase());
    
    div.innerHTML = html;
    return div;
}

function parseEventLog(log: string) {
    const regex = /^(http|tcp)-(ok|fail)(-(\d+))*(-(.+))*$/;
    const match = log.match(regex);
    if (match) {
        const result = {
            proto: match[1],
            status: match[2],
            http_code: match[4],
            extra: match[6]
        }

        let http_code: number | null = null;
        const _hcn = Number.parseInt(result.http_code, 10);
        if (!Number.isNaN(_hcn)) {
            http_code = _hcn;
        }

        if (result.status === "ok") {
            return "OK";
        }

        if (result.proto === "tcp") {
            if (result.status === "fail") {
                return "TCP FAIL";
            }
        } else if (result.status === "fail" && http_code) {
            if (http_code < 600) {
                return `HTTP ${http_code}`;
            } else {
                if (result.extra === "timeout") {
                    return "TIMEOUT";
                } else if (result.extra === "smallbody") {
                    return "SMALL BODY";
                } else {
                    return result.extra;
                }
            }
        }
    }

    // Old logs
    if (log === "tcp-failed") {
        return "TCP FAIL";
    }
    if (log === "tcp-ok") {
        return "OK";
    }

    const oldHttpRegex = /^(bad-)?status=(\d+)$/;
    const oldHttpMatch = log.match(oldHttpRegex);
    const httpCode = oldHttpMatch && oldHttpMatch[2] ? Number.parseInt(oldHttpMatch[2], 10) : NaN;
    if (!Number.isNaN(httpCode)) {
        if (httpCode >= 200 && httpCode < 400) {
            return "OK";
        } else {
            return `HTTP ${httpCode}`;
        }
    }
    

    return log;
}

function createSiteCard(site: Site) {
    const div = document.createElement("div");
    div.id = `sites-${site.id}`;
    div.classList.add("card", "site", "flat", "padded", "gapped", "flex-row", "spaced");
    div.setAttribute("data-site-id", site.id);
    div.setAttribute("data-mode", site.mode);
    
    const addr = assembleSiteAddress(site);
    if (addr) {
        div.setAttribute("data-site-addr", addr);
    }

    const displayPath = !site.path || site.path === "/" ? "" : site.path;
    const displayAddr = `${site.host}${![80,443].includes(site.port) ? `:${site.port}` : ""}${displayPath}`
    
    let status = ""
    if (site.status) {
        status = site.status.toUpperCase();
        div.setAttribute("data-status", site.status);
    }

    let lastCheck = ""
    if (site.last_check) {
        lastCheck = getRelativeTime(site.last_check, true);
    }

    const html = siteCardHtml.replaceAll("$name$", site.name)
                             .replaceAll("$mode$", site.mode.toUpperCase())
                             .replaceAll("$addr$", displayAddr)
                             .replaceAll("$status$", status)
                             .replaceAll("$last_check$", lastCheck)
    
    div.innerHTML = html;
    return div;
}
function assembleSiteAddress(site: Site) {
    if (site.mode === "http") {
        return `${site.port === 443 ? "https" : "http"}://${site.host}${![80, 443].includes(site.port) ? `:${site.port}` : ""}${site.path}`;
    }
    return null;
}

