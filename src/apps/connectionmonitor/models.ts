export interface Status {
    checker: {
        running: boolean,
        last_run: number | null,
    }
    monitor: {
        interval: boolean,
        last_run: number | null,
        next_run: number | null,
        running: boolean,
        cancelled: boolean,
        checking: boolean
    }
}

export interface Site {
    id: string
    host: string
    port: number
    path: string | null
    mode: "tcp" | "http"
    status: null | "down" | "up" | "partial"
    last_check: number | null
    name: string
}

export interface SitesCollection {
    sites: Site[]
    total: number
    up?: number
    partial?: number
    down?: number
}

export interface Event {
    timestamp: number
    id: number
    site_id: string
    old_status: "down" | "up" | "partial"
    new_status: "down" | "up" | "partial"
    log: string
    site_name: string
}

export interface CheckResult {
    id: string
    message: string
    status: "down" | "up" | "partial"
    timestamp: number
}