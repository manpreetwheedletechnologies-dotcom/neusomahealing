export type AdminUser = {
  id: string;
  name: string;
  email: string;

  role:
    | 'admin'
    | 'superadmin';

  lastLogin:
    | string
    | null;
};

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL
    ?.replace(/\/$/, '') ||
  'http://localhost:4000';

async function parseResponse(
  response: Response,
) {
  const payload =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    const rawMessage =
      payload?.message;

    const message =
      Array.isArray(rawMessage)
        ? rawMessage.join(' ')
        : rawMessage ||
          'Something went wrong. Please try again.';

    throw new Error(
      message,
    );
  }

  return payload;
}

export async function adminLogin(
  email: string,
  password: string,
) {
  const response =
    await fetch(
      `${API_URL}/auth/admin/login`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        credentials:
          'include',

        body: JSON.stringify({
          email,
          password,
        }),
      },
    );

  return parseResponse(
    response,
  ) as Promise<{
    success: true;

    message: string;

    data: {
      admin: AdminUser;
    };
  }>;
}

export async function getCurrentAdmin() {
  const response =
    await fetch(
      `${API_URL}/auth/admin/me`,
      {
        method: 'GET',

        credentials:
          'include',

        cache: 'no-store',
      },
    );

  return parseResponse(
    response,
  ) as Promise<{
    success: true;

    data: {
      admin: AdminUser;
    };
  }>;
}

export async function adminLogout() {
  const response =
    await fetch(
      `${API_URL}/auth/admin/logout`,
      {
        method: 'POST',

        credentials:
          'include',
      },
    );

  return parseResponse(
    response,
  ) as Promise<{
    success: true;
    message: string;
  }>;
}