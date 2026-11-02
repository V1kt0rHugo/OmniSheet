/** Chamada JSON à API; erros da API viram `Error` com a mensagem que ela mandou. */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      const m = Array.isArray(body.message) ? body.message.join('; ') : body.message;
      if (m) msg = m;
    } catch { /* corpo sem JSON */ }
    throw new Error(msg);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
