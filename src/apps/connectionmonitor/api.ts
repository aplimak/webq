import { apiClient } from '../../services/remoteportal/api';
import { CheckResult, Event, Site, SitesCollection, Status } from './models';

const client = apiClient.create({
  baseURL: `${apiClient.defaults.baseURL}/monitor`,
});

export async function status(): Promise<Status> {
  const req = await client.get('status');
  if (req.status === 200) {
    return req.data;
  } else {
    throw Error(req.data.error);
  }
}

interface GetSitesOptions {
  siteId?: string;
  mode?: 'tcp' | 'http';
  status?: 'down' | 'up' | 'partial';
}

export async function get_sites(options?: GetSitesOptions): Promise<SitesCollection> {
  let path = 'sites';
  let params = '?';
  const paramArr: string[] = [];
  if (options?.siteId) {
    paramArr.push(`id=${options.siteId}`);
  }
  if (options?.status) {
    paramArr.push(`status=${options.status}`);
  }
  if (options?.mode) {
    paramArr.push(`mode=${options.mode}`);
  }
  if (paramArr.length > 0) {
    params += paramArr.join('&');
  } else {
    params = '';
  }
  const req = await client.get(`${path}${params}`);
  if (req.status === 200) {
    return req.data;
  } else {
    throw Error(req.data.error);
  }
}

export async function post_sites(data: Site | Site[] | SitesCollection) {
  let json: string;
  if ('sites' in data) {
    json = JSON.stringify(data.sites);
  } else {
    json = JSON.stringify(data);
  }

  const req = await client.post(`sites`, json);
  if (req.status !== 201) {
    throw Error(req.data.error);
  }
}

export async function get_site(id: string): Promise<Site> {
  const req = await client.get(`sites/${id}`);
  if (req.status === 200) {
    return req.data;
  } else {
    throw Error(req.data.error);
  }
}

export async function delete_site(id: string) {
  const req = await client.delete(`sites/${id}`);
  if (req.status !== 200) {
    throw Error(req.data.error);
  }
}

export async function delete_sites() {
  const req = await client.delete(`sites`);
  if (req.status !== 200) {
    throw Error(req.data.error);
  }
}

export async function delete_events() {
  const req = await client.delete(`events`);
  if (req.status !== 200) {
    throw Error(req.data.error);
  }
}

export async function check(id?: string): Promise<CheckResult[]> {
  let path = 'check';
  if (id) {
    path = `sites/${id}/${path}`;
  }
  const req = await client.post(path);
  if (req.status === 200) {
    const data = req.data;
    if (Array.isArray(data)) {
      return data;
    } else {
      return [data];
    }
  } else {
    throw Error(req.data.error);
  }
}

interface GetEventsOptions {
  siteId?: string;
  limit?: number;
  offset?: number;
  status?: 'down' | 'up' | 'partial';
  from_id?: number;
  to_id?: number;
  from_time?: number;
  to_time?: number;
}

export async function get_events(options?: GetEventsOptions): Promise<Event[]> {
  let path = 'events';
  if (options?.siteId) {
    path = `sites/${options.siteId}/${path}`;
  }
  let params = '?';
  const paramArr: string[] = [];
  if (options?.status) {
    paramArr.push(`status=${options.status}`);
  }
  if (options?.limit) {
    paramArr.push(`limit=${options.limit}`);
  }
  if (options?.offset) {
    paramArr.push(`offset=${options.offset}`);
  }
  if (options?.from_id) {
    paramArr.push(`from=${options.from_id}`);
  }
  if (options?.to_id) {
    paramArr.push(`to=${options.to_id}`);
  }
  if (options?.from_time) {
    paramArr.push(`from_time=${options.from_time}`);
  }
  if (options?.to_time) {
    paramArr.push(`to_time=${options.to_time}`);
  }
  if (paramArr.length > 0) {
    params += paramArr.join('&');
  } else {
    params = '';
  }
  const req = await client.get(`${path}${params}`);
  if (req.status === 200) {
    return req.data;
  } else {
    throw Error(req.data.error);
  }
}

export async function service_start() {
  const req = await client.post(`start`);
  if (req.status !== 200) {
    throw Error(req.data.error);
  }
}

export async function service_stop() {
  const req = await client.post(`stop`);
  if (req.status !== 200) {
    throw Error(req.data.error);
  }
}
