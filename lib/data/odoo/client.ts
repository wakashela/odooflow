export interface OdooCallParams {
  model: string;
  method: string;
  args: unknown[];
  kwargs: Record<string, unknown>;
}

export interface OdooCallResult<T> {
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: {
      name: string;
      message: string;
      debug: string;
      arguments: string[];
    };
  };
}

export async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
  context?: Record<string, unknown>
): Promise<T> {
  const res = await fetch("/api/odoo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, method, args, kwargs, context }),
  });

  const data: OdooCallResult<T> = await res.json();

  if (data.error) {
    const msg =
      data.error.data?.message ||
      data.error.message ||
      "An unknown Odoo error occurred";
    throw new Error(msg);
  }

  return data.result as T;
}
