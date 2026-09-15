export type CreateEnquiryPayload = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};

export type CreateEnquiryResponse = {
  success: true;
  message: string;

  data: {
    id: string;
    status: "new";
  };
};

export class ContactApiError extends Error {
  status?: number;

  constructor(
    message: string,
    status?: number,
  ) {
    super(message);

    this.name = "ContactApiError";
    this.status = status;
  }
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(
    /\/$/,
    "",
  ) || "http://localhost:4000";

function normaliseMessage(
  payload: unknown,
): string {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return "Something went wrong. Please try again.";
  }

  const value = (
    payload as {
      message?: unknown;
    }
  ).message;

  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string =>
          typeof item === "string",
      )
      .join(" ");
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value;
  }

  return "Something went wrong. Please try again.";
}

export async function createEnquiry(
  payload: CreateEnquiryPayload,
): Promise<CreateEnquiryResponse> {
  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/enquiries`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          payload,
        ),
      },
    );
  } catch {
    throw new ContactApiError(
      "Unable to reach the server. Please check your connection and try again.",
    );
  }

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new ContactApiError(
      normaliseMessage(data),
      response.status,
    );
  }

  return data as CreateEnquiryResponse;
}