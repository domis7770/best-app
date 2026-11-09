export interface ApiFailure {
  error?: { code?: string; message?: string };
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "x-promptly-csrf": "1",
      ...(init.body instanceof FormData ? {} : { "content-type": "application/json" }),
      ...(init.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & ApiFailure;
  if (!res.ok) {
    const message = data?.error?.message ?? "Something went wrong.";
    const error = new Error(message) as Error & { code?: string; status?: number };
    error.code = data?.error?.code;
    error.status = res.status;
    throw error;
  }
  return data;
}

export function post<T>(url: string, body: unknown = {}): Promise<T> {
  return request<T>(url, { method: "POST", body: JSON.stringify(body) });
}

export function upload<T>(url: string, form: FormData): Promise<T> {
  return request<T>(url, { method: "POST", body: form });
}

export function del<T>(url: string): Promise<T> {
  return request<T>(url, { method: "DELETE", body: JSON.stringify({}) });
}
