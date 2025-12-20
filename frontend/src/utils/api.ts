export const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

export async function fetchWithKey(url: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    if (API_KEY) {
        headers.set('x-api-key', API_KEY);
    }
    return fetch(url, { ...options, headers });
}
