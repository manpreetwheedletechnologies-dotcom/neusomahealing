const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  errors?: string[];

  constructor(
    message: string,
    status: number,
    errors?: string[],
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function parseResponse<T>(
  response: Response,
): Promise<T> {
  let data: any = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const rawMessage =
      data?.message;

    const message =
      Array.isArray(
        rawMessage,
      )
        ? rawMessage.join(
            " · ",
          )
        : rawMessage ||
          `Request failed (${response.status})`;

    const errors =
      Array.isArray(
        data?.errors,
      )
        ? data.errors
        : undefined;

    throw new ApiError(
      message,
      response.status,
      errors,
    );
  }

  return data as T;
}

export async function apiRequest<
  T = unknown,
>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers =
    new Headers(
      init.headers,
    );

  if (
    init.body &&
    !(
      init.body instanceof
      FormData
    )
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  try {
    const response =
      await fetch(
        `${API_URL}${path}`,
        {
          ...init,

          headers,

          credentials:
            "include",

          cache:
            "no-store",
        },
      );

    return await parseResponse<T>(
      response,
    );
  } catch (error) {
    if (
      error instanceof
      ApiError
    ) {
      throw error;
    }

    throw new ApiError(
      "Unable to connect to the backend server.",
      0,
    );
  }
}