import axios from 'axios';
import type { LoginResponse, Status, User } from './models';
import { getApiKey, saveApiKey } from './utils';

let apiKey: string | null = getApiKey();

export const apiClient = axios.create({
  baseURL: 'https://rp.ring.home/v1',
});
if (apiKey) {
  apiClient.defaults.headers.common.Authorization = apiKey;
}

export async function login(user: User) {
  const { data: response } = await apiClient.post<LoginResponse>('/login', user);
  saveApiKey(response.session_key);
  apiKey = response.session_key;
}

export async function getStatus() {
  const { data: status } = await apiClient.get<Status>('/status');
  return status;
}
