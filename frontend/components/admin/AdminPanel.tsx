"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Bell,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FilePenLine,
  Gauge,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  MessagesSquare,
  PlaySquare,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import {
  apiRequest,
  ApiError,
} from "@/lib/api";

import {
  EnquiriesSection,
  Enquiry,
  EnquiryStatus,
} from "@/components/admin/EnquiriesSection";

import {
  BookingsSection,
  Booking,
} from "@/components/admin/BookingsSection";

import {
  ChatsSection,
  ChatConversation,
} from "@/components/admin/ChatsSection";

import { AudienceSection } from "@/components/admin/AudienceSection";

/* =========================================================
   TYPES
========================================================= */

type Tab =
  | "dashboard"
  | "coaching"
  | "insights"
  | "videos"
  | "testimonials"
  | "enquiries"
  | "chats"
  | "bookings"
  | "subscribers"
  | "audience"
  | "pages";

type AnyRecord =
  Record<string, any>;

type Field = {
  key: string;
  label: string;

  type?:
    | "text"
    | "textarea"
    | "boolean"
    | "number"
    | "lines";

  required?: boolean;
  placeholder?: string;
};

/*
|--------------------------------------------------------------------------
| API LIST RESPONSE
|--------------------------------------------------------------------------
|
| Some APIs return:
|
| [
|   {...},
|   {...}
| ]
|
| while enquiries API can return:
|
| {
|   success: true,
|   data: [...]
| }
|
| This type safely supports both.
|
*/

type ListApiResponse<T> =
  | T[]
  | {
      success?: boolean;
      data?: T[];
      message?: string;
    };

/* =========================================================
   NAVIGATION
========================================================= */

const nav: {
  key: Tab;
  label: string;
  icon: any;
}[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: Gauge,
  },
  {
    key: "coaching",
    label: "Coaching",
    icon: Sparkles,
  },
  {
    key: "insights",
    label: "Insights",
    icon: BookOpenText,
  },
  {
    key: "videos",
    label: "Videos",
    icon: PlaySquare,
  },
  {
    key: "testimonials",
    label: "Testimonials",
    icon: UsersRound,
  },
  {
    key: "enquiries",
    label: "Enquiries",
    icon: MessageSquareText,
  },
  {
    key: "chats",
    label: "Chat Queries",
    icon: MessagesSquare,
  },
  {
    key: "bookings",
    label: "Bookings",
    icon: CalendarDays,
  },
  {
    key: "subscribers",
    label: "Subscribers",
    icon: Mail,
  },
  {
    key: "audience",
    label: "Audience",
    icon: UsersRound,
  },
  {
    key: "pages",
    label: "Page Content",
    icon: FilePenLine,
  },
];

/* =========================================================
   CRUD CONFIGURATION
========================================================= */

const configs: Partial<
  Record<
    Tab,
    {
      endpoint: string;
      title: string;
      singular: string;
      fields: Field[];
      subtitle: string;
    }
  >
> = {
  coaching: {
    endpoint:
      "/coaching/admin/all",

    title:
      "Coaching Programs",

    singular:
      "Program",

    subtitle:
      "Create and publish coaching paths shown across the website.",

    fields: [
      {
        key: "title",
        label: "Title",
        required: true,
      },

      {
        key: "slug",
        label: "Slug",
        required: true,
        placeholder:
          "example-program",
      },

      {
        key: "tagline",
        label: "Tagline",
        required: true,
      },

      {
        key: "description",
        label:
          "Description",
        type: "textarea",
        required: true,
      },

      {
        key: "details",
        label:
          "Program details (one per line)",
        type: "lines",
        required: true,
      },

      {
        key: "explore",
        label:
          "What users will explore (one per line)",
        type: "lines",
        required: true,
      },

      {
        key: "expect",
        label:
          "What to expect",
        type: "textarea",
        required: true,
      },

      {
        key: "image",
        label:
          "Image URL / public path",
      },

      {
        key: "order",
        label:
          "Display order",
        type: "number",
      },

      {
        key: "published",
        label: "Published",
        type: "boolean",
      },
    ],
  },

  insights: {
    endpoint:
      "/blog/admin/all",

    title: "Insights",

    singular:
      "Insight",

    subtitle:
      "Manage articles, categories and publishing status.",

    fields: [
      {
        key: "title",
        label: "Title",
        required: true,
      },

      {
        key: "slug",
        label: "Slug",
        required: true,
      },

      {
        key: "category",
        label: "Category",
        required: true,
      },

      {
        key: "excerpt",
        label: "Excerpt",
        type: "textarea",
        required: true,
      },

      {
        key: "content",
        label:
          "Article content",
        type: "textarea",
        required: true,
      },

      {
        key:
          "featuredImage",
        label:
          "Featured image URL / public path",
      },

      {
        key: "author",
        label: "Author",
      },

      {
        key: "readTime",
        label:
          "Read time",
        placeholder:
          "6 min read",
      },

      {
        key: "published",
        label: "Published",
        type: "boolean",
      },
    ],
  },

  videos: {
    endpoint:
      "/videos/admin/all",

    title: "Videos",

    singular: "Video",

    subtitle:
      "Manage video resources and homepage featured items.",

    fields: [
      {
        key: "title",
        label: "Title",
        required: true,
      },

      {
        key: "category",
        label: "Category",
        required: true,
      },

      {
        key: "description",
        label:
          "Description",
        type: "textarea",
        required: true,
      },

      {
        key: "url",
        label:
          "Video URL / public path",
        required: true,
      },

      {
        key: "thumbnail",
        label:
          "Thumbnail URL / public path",
      },

      {
        key: "duration",
        label: "Duration",
      },

      {
        key: "featured",
        label:
          "Featured on homepage",
        type: "boolean",
      },

      {
        key: "published",
        label: "Published",
        type: "boolean",
      },
    ],
  },

  testimonials: {
    endpoint:
      "/testimonials/admin/all",

    title:
      "Testimonials",

    singular:
      "Testimonial",

    subtitle:
      "Control client stories and homepage featured testimonials.",

    fields: [
      {
        key: "name",
        label:
          "Client display name",
        required: true,
      },

      {
        key: "type",
        label:
          "Program / client type",
        required: true,
      },

      {
        key: "category",
        label: "Category",
        required: true,
      },

      {
        key: "quote",
        label:
          "Testimonial",
        type: "textarea",
        required: true,
      },

      {
        key: "order",
        label:
          "Display order",
        type: "number",
      },

      {
        key: "featured",
        label:
          "Featured on homepage",
        type: "boolean",
      },

      {
        key: "published",
        label: "Published",
        type: "boolean",
      },
    ],
  },
};

/* =========================================================
   FORM HELPERS
========================================================= */

function emptyForm(
  fields: Field[],
) {
  return Object.fromEntries(
    fields.map(
      (field) => [
        field.key,

        field.type ===
        "boolean"
          ? field.key ===
            "published"
          : field.type ===
              "number"
            ? 0
            : "",
      ],
    ),
  );
}

function normalizeForForm(
  item: AnyRecord,
  fields: Field[],
) {
  const output:
    AnyRecord = {};

  for (const field of fields) {
    const value =
      item[field.key];

    output[field.key] =
      field.type ===
        "lines" &&
      Array.isArray(value)
        ? value.join("\n")
        : value ??
          (field.type ===
          "boolean"
            ? false
            : field.type ===
                "number"
              ? 0
              : "");
  }

  return output;
}

function normalizePayload(
  form: AnyRecord,
  fields: Field[],
) {
  const payload:
    AnyRecord = {};

  for (const field of fields) {
    const value =
      form[field.key];

    payload[field.key] =
      field.type ===
      "lines"
        ? String(
            value || "",
          )
            .split("\n")
            .map((value) =>
              value.trim(),
            )
            .filter(Boolean)
        : field.type ===
            "number"
          ? Number(
              value || 0,
            )
          : value;
  }

  return payload;
}

/* =========================================================
   API RESPONSE HELPER
========================================================= */

function getApiList<T>(
  response:
    ListApiResponse<T>,
): T[] {
  /*
   * Endpoint directly returned
   * an array.
   */

  if (
    Array.isArray(
      response,
    )
  ) {
    return response;
  }

  /*
   * Endpoint returned:
   *
   * {
   *   success: true,
   *   data: [...]
   * }
   */

  if (
    response &&
    Array.isArray(
      response.data,
    )
  ) {
    return response.data;
  }

  /*
   * Invalid/unexpected
   * backend response.
   */

  return [];
}

/* =========================================================
   ADMIN PANEL
========================================================= */

export function AdminPanel() {
  const router =
    useRouter();

  const [
    tab,
    setTab,
  ] =
    useState<Tab>(
      "dashboard",
    );

  const [
    sidebar,
    setSidebar,
  ] =
    useState(false);

  const [
    admin,
    setAdmin,
  ] = useState<{
    name: string;
    email: string;
  } | null>(null);

  const [
    dashboard,
    setDashboard,
  ] =
    useState<AnyRecord>(
      {},
    );

  const [
    items,
    setItems,
  ] = useState<
    AnyRecord[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  /*
   * Used so only the
   * enquiry whose status is
   * changing becomes disabled.
   */

  const [
    updatingStatusId,
    setUpdatingStatusId,
  ] = useState<
    string | null
  >(null);

  const [
    modal,
    setModal,
  ] = useState<{
    item?: AnyRecord;
  } | null>(null);

  const [
    contentKeys,
    setContentKeys,
  ] = useState<
    AnyRecord[]
  >([]);

  const [
    activeContentKey,
    setActiveContentKey,
  ] =
    useState("home");

  const [
    contentJson,
    setContentJson,
  ] = useState("{}");

  const [
    savingContent,
    setSavingContent,
  ] = useState(false);

  /* =======================================================
     AUTH ERROR HANDLER
  ======================================================= */

  const handleAuthError =
    useCallback(
      (
        err: unknown,
      ) => {
        if (
          err instanceof
            ApiError &&
          err.status === 401
        ) {
          router.replace(
            "/admin/login",
          );

          return true;
        }

        return false;
      },
      [router],
    );

  /* =======================================================
     DASHBOARD
  ======================================================= */

  const loadDashboard =
    useCallback(
      async () => {
        const [
          me,
          summary,
        ] =
          await Promise.all(
            [
              apiRequest<any>(
                "/auth/admin/me",
              ),

              apiRequest<any>(
                "/admin/dashboard",
              ),
            ],
          );

        setAdmin(
          me.admin,
        );

        setDashboard(
          summary,
        );
      },
      [],
    );

  /* =======================================================
     LOAD CURRENT TAB
  ======================================================= */

  const loadTab =
    useCallback(
      async (
        target: Tab,
      ) => {
        setLoading(true);
        setError("");
        setItems([]);

        try {
          /* =========================
             DASHBOARD
          ========================= */

          if (
            target ===
            "dashboard"
          ) {
            await loadDashboard();

            setItems([]);
          }

          /* =========================
             STANDARD CRUD MODULES
          ========================= */

          else if (
            configs[target]
          ) {
            const response =
              await apiRequest<
                AnyRecord[]
              >(
                configs[
                  target
                ]!.endpoint,
              );

            setItems(
              Array.isArray(
                response,
              )
                ? response
                : [],
            );
          }

          /* =========================
             CONTACT ENQUIRIES
          ========================= */

          else if (
            target ===
            "enquiries"
          ) {
            const response =
              await apiRequest<
                ListApiResponse<Enquiry>
              >(
                "/enquiries",
              );

            const enquiries =
              getApiList(
                response,
              );

            setItems(
              enquiries,
            );
          }

          /* =========================
             BOOKINGS
          ========================= */

          else if (
            target ===
            "bookings"
          ) {
            const response =
              await apiRequest<
                AnyRecord[]
              >(
                "/bookings",
              );

            setItems(
              Array.isArray(
                response,
              )
                ? response
                : [],
            );
          }

          /* =========================
             CHAT QUERIES
          ========================= */

          else if (
            target ===
            "chats"
          ) {
            const response =
              await apiRequest<
                AnyRecord[]
              >(
                "/chat/admin/all",
              );

            setItems(
              Array.isArray(
                response,
              )
                ? response
                : [],
            );
          }

          /* =========================
             SUBSCRIBERS
          ========================= */

          else if (
            target ===
            "subscribers"
          ) {
            const response =
              await apiRequest<
                AnyRecord[]
              >(
                "/subscribers",
              );

            setItems(
              Array.isArray(
                response,
              )
                ? response
                : [],
            );
          }

          /* =========================
             PAGE CONTENT
          ========================= */

          else if (
            target ===
            "pages"
          ) {
            const content =
              await apiRequest<
                AnyRecord[]
              >(
                "/content",
              );

            const safeContent =
              Array.isArray(
                content,
              )
                ? content
                : [];

            setContentKeys(
              safeContent,
            );

            const selected =
              safeContent.find(
                (
                  entry,
                ) =>
                  entry.key ===
                  activeContentKey,
              ) ||
              safeContent[0];

            if (selected) {
              setActiveContentKey(
                selected.key,
              );

              setContentJson(
                JSON.stringify(
                  selected.data,
                  null,
                  2,
                ),
              );
            }
          }
        } catch (err) {
          if (
            !handleAuthError(
              err,
            )
          ) {
            setError(
              err instanceof
                Error
                ? err.message
                : "Unable to load data.",
            );
          }

          /*
           * Important:
           *
           * If request fails we make
           * sure stale enquiry data is
           * not displayed.
           */

         
            setItems([]);
          
        } finally {
          setLoading(
            false,
          );
        }
      },
      [
        activeContentKey,
        handleAuthError,
        loadDashboard,
      ],
    );

  /* =======================================================
     LOAD TAB WHEN TAB CHANGES
  ======================================================= */

  useEffect(() => {
    loadTab(tab);
  }, [tab, loadTab]);

  /* =======================================================
     GENERIC SEARCH
  ======================================================= */

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return items;
      }

      return items.filter(
        (item) =>
          JSON.stringify(
            item,
          )
            .toLowerCase()
            .includes(
              query,
            ),
      );
    }, [items, search]);

  /* =======================================================
     LOGOUT
  ======================================================= */

  async function logout() {
    try {
      await apiRequest(
        "/auth/admin/logout",
        {
          method:
            "POST",
        },
      );
    } catch {
      /*
       * Even if backend logout
       * request fails, redirect
       * admin away from panel.
       */
    } finally {
      router.replace(
        "/admin/login",
      );
    }
  }

  /* =======================================================
     DELETE CRUD ITEM
  ======================================================= */

  async function removeItem(
    id: string,
  ) {
    const config =
      configs[tab];

    if (!config) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this item permanently?",
      );

    if (!confirmed) {
      return;
    }

    const publicEndpoint =
      config.endpoint.replace(
        "/admin/all",
        "",
      );

    setError("");

    try {
      await apiRequest(
        `${publicEndpoint}/${id}`,
        {
          method:
            "DELETE",
        },
      );

      await loadTab(
        tab,
      );
    } catch (err) {
      if (
        !handleAuthError(
          err,
        )
      ) {
        setError(
          err instanceof
            Error
            ? err.message
            : "Delete failed.",
        );
      }
    }
  }

  /* =======================================================
     UPDATE ENQUIRY / BOOKING STATUS
  ======================================================= */

  async function updateStatus(
    id: string,
    status:
      | EnquiryStatus
      | string,
  ): Promise<void> {
    if (!id) {
      setError(
        "Unable to update status because the record ID is missing.",
      );

      return;
    }

    setError("");

    setUpdatingStatusId(
      id,
    );

    const endpoint =
      tab ===
      "bookings"
        ? `/bookings/${id}/status`
        : tab ===
          "chats"
          ? `/chat/admin/${id}/status`
          : `/enquiries/${id}/status`;

    try {
      await apiRequest(
        endpoint,
        {
          method:
            "PATCH",

          body:
            JSON.stringify(
              {
                status,
              },
            ),
        },
      );

      /*
       * Update UI locally.
       *
       * This prevents entire page
       * loader/flicker after selecting
       * a new enquiry status.
       */

      setItems(
        (
          currentItems,
        ) =>
          currentItems.map(
            (item) =>
              item._id ===
              id
                ? {
                    ...item,
                    status,
                  }
                : item,
          ),
      );
    } catch (err) {
      if (
        !handleAuthError(
          err,
        )
      ) {
        setError(
          err instanceof
            ApiError
            ? err.errors
                ?.length
              ? err.errors.join(
                  " · ",
                )
              : err.message
            : err instanceof
                Error
              ? err.message
              : "Status update failed.",
        );
      }

      /*
       * Rethrow intentionally.
       *
       * Enquiry detail modal should
       * not locally change its status
       * when backend update failed.
       */

      throw err;
    } finally {
      setUpdatingStatusId(
        null,
      );
    }
  }

  /* =======================================================
     UPDATE SUBSCRIBER
  ======================================================= */

  async function updateSubscriber(
    id: string,
    active: boolean,
  ) {
    setError("");

    try {
      await apiRequest(
        `/subscribers/${id}`,
        {
          method:
            "PATCH",

          body:
            JSON.stringify(
              {
                active,
              },
            ),
        },
      );

      await loadTab(
        "subscribers",
      );
    } catch (err) {
      if (
        !handleAuthError(
          err,
        )
      ) {
        setError(
          err instanceof
            Error
            ? err.message
            : "Subscriber update failed.",
        );
      }
    }
  }

  /* =======================================================
     SELECT CONTENT PAGE
  ======================================================= */

  function selectContent(
    key: string,
  ) {
    setActiveContentKey(
      key,
    );

    const item =
      contentKeys.find(
        (entry) =>
          entry.key ===
          key,
      );

    setContentJson(
      JSON.stringify(
        item?.data ||
          {},
        null,
        2,
      ),
    );
  }

  /* =======================================================
     SAVE PAGE CONTENT
  ======================================================= */

  async function saveContent() {
    setError("");

    setSavingContent(
      true,
    );

    try {
      const data =
        JSON.parse(
          contentJson,
        );

      await apiRequest(
        `/content/${activeContentKey}`,
        {
          method: "PUT",

          body:
            JSON.stringify(
              {
                data,
              },
            ),
        },
      );

      await loadTab(
        "pages",
      );
    } catch (err) {
      setError(
        err instanceof
          SyntaxError
          ? "Invalid JSON. Please correct the syntax before saving."
          : err instanceof
              Error
            ? err.message
            : "Save failed.",
      );
    } finally {
      setSavingContent(
        false,
      );
    }
  }

  /* =======================================================
     PAGE TITLE
  ======================================================= */

  const title =
    configs[tab]
      ?.title ||
    nav.find(
      (item) =>
        item.key === tab,
    )?.label ||
    "Dashboard";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#eef0ec] font-sans text-[#172420]">

      {/* ===================================================
          SIDEBAR
      =================================================== */}

<aside
  className={`fixed left-0 top-0 z-50 flex h-screen w-[270px] flex-col overflow-hidden border-r border-white/10 bg-[#082f2d] p-5 text-white transition-transform min-[901px]:translate-x-0 ${
    sidebar
      ? "translate-x-0"
      : "max-[900px]:-translate-x-full"
  }`}
>

        <div className="flex shrink-0 items-center justify-between">

          <a href="/">
            <img
              src="/logo_mw.png"
              alt="NeusomaHealing"
              className="w-46"
            />
          </a>

          <button
            type="button"
            aria-label="Close sidebar"
            className="min-[901px]:hidden"
            onClick={() =>
              setSidebar(
                false,
              )
            }
          >
            <X size={20} />
          </button>

        </div>

       <p className="mt-7 shrink-0 px-3 text-[9px] font-semibold uppercase tracking-[.22em] text-[#82a29a]">
  Administration
</p>

        <nav className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1 pb-3">

          {nav.map(
            ({
              key,
              label,
              icon: Icon,
            }) => (
              <button
                type="button"
                key={key}
                onClick={() => {
                  setTab(
                    key,
                  );

                  setSidebar(
                    false,
                  );

                  setSearch(
                    "",
                  );

                  setError(
                    "",
                  );
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  tab === key
                    ? "bg-[#c28b4d] text-white shadow-lg"
                    : "text-[#bfd0cb] hover:bg-white/5 hover:text-white"
                }`}
              >

                <Icon
                  size={
                    17
                  }
                />

                <span className="flex-1">
                  {label}
                </span>

                {tab ===
                  key && (
                  <ChevronRight
                    size={
                      14
                    }
                  />
                )}

              </button>
            ),
          )}

        </nav>

        {/* ADMIN PROFILE */}

       <div className="mt-3 shrink-0 rounded-2xl border border-white/10 bg-white/[.04] p-4">

          <p className="truncate text-xs font-semibold">
            {admin?.name ||
              "Administrator"}
          </p>

          <p className="mt-1 truncate text-[10px] text-[#8da7a0]">
            {admin?.email ||
              ""}
          </p>

          <button
            type="button"
            onClick={
              logout
            }
            className="mt-4 flex items-center gap-2 text-xs text-[#d7b98f] transition hover:text-white"
          >
            <LogOut
              size={
                14
              }
            />

            Sign out
          </button>

        </div>

      </aside>

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <section className="min-h-screen pl-[270px] max-[900px]:pl-0">

        {/* HEADER */}

        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#dce1dc] bg-[#f7f8f5]/90 px-8 backdrop-blur-xl max-[600px]:px-5">

          <div className="flex items-center gap-4">

            <button
              type="button"
              aria-label="Open sidebar"
              className="rounded-lg border border-[#d9dfda] p-2 min-[901px]:hidden"
              onClick={() =>
                setSidebar(
                  true,
                )
              }
            >
              <Menu
                size={
                  18
                }
              />
            </button>

            <p className="font-serif text-lg italic text-[#4b5a53] max-[700px]:hidden">
              More Healing. More Clarity. More You.
            </p>

          </div>

          <div className="flex items-center gap-5">

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[#ccd5cf] px-4 py-2 text-xs font-semibold text-[#29433c] transition hover:bg-white max-[700px]:hidden"
            >
              View website ↗
            </a>

            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-full border border-[#d9dfda] bg-white p-2.5 text-[#29433c] transition hover:bg-[#f3f6f3]"
            >
              <Bell size={17} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#c0392b]" />
            </button>

            <div className="flex items-center gap-2.5 rounded-full border border-[#d9dfda] bg-white py-1.5 pl-1.5 pr-3">

              <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[#0b3b38] text-xs font-bold text-white">
                {(admin?.name || "Admin")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="leading-tight max-[500px]:hidden">
                <p className="text-xs font-semibold text-[#172420]">
                  {admin?.name?.split(" ")[0] || "Admin"}
                </p>
                <p className="text-[10px] text-[#74807a]">
                  Administrator
                </p>
              </div>

              <ChevronDown size={14} className="text-[#89948f]" />

            </div>

          </div>

        </header>

        {/* CONTENT */}

        <div className="p-8 max-[600px]:p-5">

          {/* ERROR */}

          {error && (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">

              <span>
                {error}
              </span>

              <button
                type="button"
                aria-label="Dismiss error"
                onClick={() =>
                  setError(
                    "",
                  )
                }
              >
                <X
                  size={
                    14
                  }
                />
              </button>

            </div>
          )}

          {/* ===============================================
              MODULE RENDERING
          =============================================== */}

          {loading ? (
            <Loading />
          ) : tab ===
            "dashboard" ? (
            <Dashboard
              data={
                dashboard
              }
              adminName={
                admin?.name
              }
              onNavigate={(
                target,
              ) =>
                setTab(
                  target,
                )
              }
            />
          ) : tab ===
            "pages" ? (
            <PagesEditor
              keys={
                contentKeys
              }
              activeKey={
                activeContentKey
              }
              json={
                contentJson
              }
              setJson={
                setContentJson
              }
              selectKey={
                selectContent
              }
              save={
                saveContent
              }
              saving={
                savingContent
              }
            />
          ) : tab ===
            "audience" ? (
            <AudienceSection />
          ) : tab ===
            "subscribers" ? (
            <SubscribersSection
              items={
                filtered
              }
              search={
                search
              }
              setSearch={
                setSearch
              }
              updateSubscriber={
                updateSubscriber
              }
            />
          ) : tab ===
            "enquiries" ? (
            /*
             * CONTACT FORM SUBMISSIONS
             *
             * Separate professional
             * enquiry management UI.
             */
            <EnquiriesSection
              items={
                items as Enquiry[]
              }
              search={
                search
              }
              setSearch={
                setSearch
              }
              updateStatus={
                updateStatus
              }
              updatingStatusId={
                updatingStatusId
              }
            />
          ) : tab ===
            "chats" ? (
            <ChatsSection
              items={
                items as ChatConversation[]
              }
              search={
                search
              }
              setSearch={
                setSearch
              }
              updateStatus={
                updateStatus
              }
              updatingStatusId={
                updatingStatusId
              }
            />
         ) : tab ===
  "bookings" ? (
  <BookingsSection
    items={items as Booking[]}
    search={search}
    setSearch={setSearch}
    updateStatus={updateStatus}
    updatingStatusId={updatingStatusId}
    onRefresh={() => loadTab("bookings")}
  />
) : (
            <CrudTable
              tab={tab}
              items={
                filtered
              }
              search={
                search
              }
              setSearch={
                setSearch
              }
              onAdd={() =>
                setModal(
                  {},
                )
              }
              onEdit={(
                item,
              ) =>
                setModal({
                  item,
                })
              }
              onDelete={
                removeItem
              }
            />
          )}

        </div>

      </section>

      {/* ===================================================
          CRUD EDITOR MODAL
      =================================================== */}

      {modal &&
        configs[tab] && (
          <EditorModal
            config={
              configs[
                tab
              ]!
            }
            item={
              modal.item
            }
            onClose={() =>
              setModal(
                null,
              )
            }
            onSaved={async () => {
              setModal(
                null,
              );

              await loadTab(
                tab,
              );
            }}
            setError={
              setError
            }
          />
        )}

    </main>
  );
}

/* =========================================================
   LOADING
========================================================= */

function Loading() {
  return (
    <div className="grid min-h-[360px] place-items-center">

      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#0d413d] border-t-transparent" />

    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  data,
  adminName,
  onNavigate,
}: {
  data: AnyRecord;
  adminName?: string;
  onNavigate?: (
    tab: Tab,
  ) => void;
}) {
  const firstName =
    adminName
      ?.trim()
      .split(" ")[0];

  const greeting =
    useMemo(() => {
      const hour =
        new Date().getHours();
      if (hour < 12)
        return "Good morning";
      if (hour < 17)
        return "Good afternoon";
      return "Good evening";
    }, []);

  const today =
    useMemo(
      () =>
        new Date().toLocaleDateString(
          "en-IN",
          {
            weekday:
              "long",
            day: "numeric",
            month:
              "long",
          },
        ),
      [],
    );

  const leadCards: {
    label: string;
    value: number;
    icon: any;
    tab: Tab;
    accent: string;
    bar: string;
  }[] = [
    {
      label:
        "New enquiries",
      value:
        data.newEnquiries ||
        0,
      icon: MessageSquareText,
      tab: "enquiries",
      accent:
        "bg-[#fbeee4] text-[#a5622a]",
      bar: "bg-[#e8a165]",
    },

    {
      label:
        "New chat queries",
      value:
        data.newChats ||
        0,
      icon: MessagesSquare,
      tab: "chats",
      accent:
        "bg-[#eaf1fb] text-[#2d5e94]",
      bar: "bg-[#5c8fc9]",
    },

    {
      label:
        "New bookings",
      value:
        data.newBookings ||
        0,
      icon: CalendarDays,
      tab: "bookings",
      accent:
        "bg-[#eef5ee] text-[#3b7a4f]",
      bar: "bg-[#5fa878]",
    },
  ];

  const contentCards: {
    label: string;
    value: number;
    icon: any;
    tab: Tab;
    accent: string;
  }[] = [
    {
      label:
        "Subscribers",
      value:
        data.subscribers ||
        0,
      icon: Mail,
      tab: "subscribers",
      accent:
        "bg-[#f3eefb] text-[#6b4a9c]",
    },

    {
      label: "Insights",
      value:
        data.posts || 0,
      icon: BookOpenText,
      tab: "insights",
      accent:
        "bg-[#eef5f1] text-[#0d4a44]",
    },

    {
      label: "Videos",
      value:
        data.videos || 0,
      icon: PlaySquare,
      tab: "videos",
      accent:
        "bg-[#fdf0ee] text-[#b0503f]",
    },

    {
      label:
        "Coaching programs",
      value:
        data.coaching ||
        0,
      icon: Sparkles,
      tab: "coaching",
      accent:
        "bg-[#fdf6e6] text-[#9a752b]",
    },

    {
      label:
        "Testimonials",
      value:
        data.testimonials ||
        0,
      icon: UsersRound,
      tab: "testimonials",
      accent:
        "bg-[#eafaf5] text-[#1f8a6f]",
    },
  ];

  const maxContentValue =
    Math.max(
      1,
      ...contentCards.map(
        (c) => c.value,
      ),
    );

  const totalEnquiries =
    data.totalEnquiries ||
    0;

  const totalBookings =
    data.totalBookings ||
    0;

  const pipelineTotal =
    Math.max(
      totalEnquiries +
        totalBookings,
      1,
    );

  const enquiryShare =
    Math.round(
      (totalEnquiries /
        pipelineTotal) *
        100,
    );

  const publishables:
    {
      label: string;
      tab: Tab;
      count: number;
    }[] = [
    {
      label: "Insights",
      tab: "insights",
      count:
        data.posts || 0,
    },
    {
      label: "Videos",
      tab: "videos",
      count:
        data.videos || 0,
    },
    {
      label: "Coaching",
      tab: "coaching",
      count:
        data.coaching ||
        0,
    },
  ];

  const quickActions: {
    label: string;
    tab: Tab;
    icon: any;
  }[] = [
    {
      label:
        "Add an Insight",
      tab: "insights",
      icon: BookOpenText,
    },
    {
      label: "Add a Video",
      tab: "videos",
      icon: PlaySquare,
    },
    {
      label:
        "Add a Coaching program",
      tab: "coaching",
      icon: Sparkles,
    },
    {
      label:
        "Review enquiries",
      tab: "enquiries",
      icon: MessageSquareText,
    },
  ];

  return (
    <>

      {/* HERO */}

      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0b3a37] via-[#0d4a44] to-[#123f3a] p-8 text-white max-[600px]:p-6">

        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c28b4d]/20 blur-3xl"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-white/5 blur-3xl"
        />

        <div className="relative flex flex-wrap items-center justify-between gap-3">

          <p className="text-[10px] uppercase tracking-[.22em] text-[#d2a873]">
            {greeting}
            {firstName
              ? `, ${firstName}`
              : ""}
          </p>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold text-[#cfe0d8] backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7fe3ab]" />
            {today}
          </span>

        </div>

        <h2 className="relative mt-3 max-w-[640px] font-serif text-[clamp(28px,4vw,46px)] leading-[1.08]">
          {firstName
            ? "Here's what's happening on the site."
            : "Everything you need to keep the website current."}
        </h2>

        <p className="relative mt-4 max-w-[600px] text-sm leading-7 text-[#afc2bc]">
          Content changes
          made here are read
          by the public
          website through
          the NestJS API and
          MongoDB — publish
          or draft anything,
          anytime.
        </p>

        {onNavigate && (
          <div className="relative mt-6 flex flex-wrap gap-2.5">

            {quickActions.map(
              (
                action,
              ) => (
                <button
                  key={
                    action.label
                  }
                  type="button"
                  onClick={() =>
                    onNavigate(
                      action.tab,
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <action.icon
                    size={
                      14
                    }
                  />
                  {
                    action.label
                  }
                </button>
              ),
            )}

          </div>
        )}

      </section>

      {/* TODAY AT A GLANCE */}

      <div className="mt-8 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5e6b65]">
          Today at a glance
        </p>
        <p className="text-[11px] text-[#9aa39d]">
          New &amp; unread
          activity
        </p>
      </div>

      <section className="mt-3 grid grid-cols-3 gap-4 max-[750px]:grid-cols-1">

        {leadCards.map(
          (card) => (
            <button
              type="button"
              key={
                card.label
              }
              onClick={() =>
                onNavigate?.(
                  card.tab,
                )
              }
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-[#dce1dc] bg-white p-5 text-left shadow-[0_8px_30px_rgba(37,56,49,.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(37,56,49,.1)]"
            >

              <span
                className={`absolute left-0 top-0 h-full w-1 ${card.bar}`}
              />

              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${card.accent}`}
              >
                <card.icon
                  size={
                    20
                  }
                />
              </div>

              <div className="min-w-0">
                <span className="block font-serif text-3xl leading-none text-[#172420]">
                  {
                    card.value
                  }
                </span>

                <p className="mt-1.5 truncate text-xs font-semibold text-[#5e6b65]">
                  {
                    card.label
                  }
                </p>
              </div>

              {card.value >
                0 && (
                <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[#c0392b]" />
              )}

              <ChevronRight
                size={
                  15
                }
                className="ml-auto shrink-0 text-[#c7cec9] opacity-0 transition group-hover:opacity-100"
              />

            </button>
          ),
        )}

      </section>

      {/* CONTENT LIBRARY */}

      <div className="mt-8 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5e6b65]">
          Content library
        </p>
        <p className="text-[11px] text-[#9aa39d]">
          Everything
          published on the
          site
        </p>
      </div>

      <section className="mt-3 grid grid-cols-5 gap-4 max-[1150px]:grid-cols-3 max-[650px]:grid-cols-2 max-[420px]:grid-cols-1">

        {contentCards.map(
          (card) => (
            <button
              type="button"
              key={
                card.label
              }
              onClick={() =>
                onNavigate?.(
                  card.tab,
                )
              }
              className="group relative overflow-hidden rounded-2xl border border-[#dce1dc] bg-white p-5 text-left shadow-[0_8px_30px_rgba(37,56,49,.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(37,56,49,.1)]"
            >

              <div
                className={`grid h-10 w-10 place-items-center rounded-xl ${card.accent}`}
              >
                <card.icon
                  size={
                    18
                  }
                />
              </div>

              <span className="mt-5 block font-serif text-3xl text-[#172420]">
                {
                  card.value
                }
              </span>

              <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-[#5e6b65]">
                {
                  card.label
                }

                <ChevronRight
                  size={
                    12
                  }
                  className="opacity-0 transition group-hover:opacity-100"
                />
              </p>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#f0f2ef]">
                <div
                  className="h-full rounded-full bg-[#0d4a44]/70 transition-all group-hover:bg-[#0d4a44]"
                  style={{
                    width: `${Math.max(
                      6,
                      Math.round(
                        (card.value /
                          maxContentValue) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>

            </button>
          ),
        )}

      </section>

      {/* DASHBOARD LOWER CARDS */}

      <section className="mt-8 grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">

        <article className="rounded-2xl border border-[#dce1dc] bg-white p-6">

          <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#5e6b65]">
            Lead pipeline
          </p>

          <div className="mt-5 flex items-center gap-5">

            <div
              className="relative grid h-[104px] w-[104px] shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#c28b4d 0% ${enquiryShare}%, #0d4a44 ${enquiryShare}% 100%)`,
              }}
            >

              <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-white text-center">
                <span>
                  <span className="block font-serif text-xl leading-none text-[#172420]">
                    {totalEnquiries +
                      totalBookings}
                  </span>
                  <span className="mt-1 block text-[9px] uppercase tracking-wide text-[#9aa39d]">
                    Total leads
                  </span>
                </span>
              </div>

            </div>

            <div className="space-y-3">

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#c28b4d]" />
                <span className="text-sm font-semibold text-[#172420]">
                  {
                    totalEnquiries
                  }
                </span>
                <span className="text-[11px] text-[#87908c]">
                  Enquiries
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#0d4a44]" />
                <span className="text-sm font-semibold text-[#172420]">
                  {
                    totalBookings
                  }
                </span>
                <span className="text-[11px] text-[#87908c]">
                  Bookings
                </span>
              </div>

            </div>

          </div>

          <p className="mt-4 text-[10px] text-[#87908c]">
            Enquiries make up{" "}
            {
              enquiryShare
            }
            % of total lead
            volume.
          </p>

        </article>

        <article className="rounded-2xl border border-[#dce1dc] bg-white p-6">

          <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#5e6b65]">
            Publishing
            workflow
          </p>

          <p className="mt-3 text-[11px] leading-5 text-[#87908c]">
            Live content
            currently published
            to the public
            website.
          </p>

          <div className="mt-4 space-y-3">

            {publishables.map(
              (
                item,
              ) => (
                <button
                  type="button"
                  key={
                    item.label
                  }
                  onClick={() =>
                    onNavigate?.(
                      item.tab,
                    )
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-[#eceee9] px-3.5 py-2.5 text-left transition hover:border-[#dce1dc] hover:bg-[#f7f9f6]"
                >
                  <span className="text-xs font-semibold text-[#3a453f]">
                    {
                      item.label
                    }
                  </span>

                  <span className="rounded-full bg-[#eef5f1] px-2.5 py-1 text-[10px] font-semibold text-[#0d4a44]">
                    {
                      item.count
                    }{" "}
                    items
                  </span>
                </button>
              ),
            )}

          </div>

        </article>

        <article className="rounded-2xl border border-[#dce1dc] bg-white p-6">

          <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#5e6b65]">
            Quick actions
          </p>

          <p className="mt-3 text-[11px] leading-5 text-[#87908c]">
            Jump straight into
            the module you
            need.
          </p>

          <div className="mt-4 space-y-2">

            {quickActions.map(
              (
                action,
              ) => (
                <button
                  type="button"
                  key={
                    action.label
                  }
                  onClick={() =>
                    onNavigate?.(
                      action.tab,
                    )
                  }
                  className="flex w-full items-center gap-2.5 rounded-xl border border-[#eceee9] px-3.5 py-2.5 text-left text-xs font-semibold text-[#3a453f] transition hover:border-[#dce1dc] hover:bg-[#f7f9f6]"
                >
                  <action.icon
                    size={
                      14
                    }
                    className="text-[#0d4a44]"
                  />
                  {
                    action.label
                  }
                </button>
              ),
            )}

          </div>

        </article>

      </section>

    </>
  );
}

/* =========================================================
   GENERIC CRUD TABLE
========================================================= */

/* =========================================================
   VIDEO FRAME PREVIEW

   For videos that don't have a manually uploaded thumbnail,
   this pulls the actual first frame out of the video file
   itself so the list still shows something real instead of
   a blank/generic placeholder.
========================================================= */

function VideoFramePreview({
  src,
}: {
  src: string;
}) {
  const videoRef =
    useRef<HTMLVideoElement>(
      null,
    );

  const [
    failed,
    setFailed,
  ] = useState(false);

  if (failed) {
    return (
      <div className="grid h-12 w-16 shrink-0 place-items-center rounded-lg border border-dashed border-[#d4dbd6] bg-[#f4f6f3] text-[#a7b0aa]">
        <PlaySquare
          size={16}
        />
      </div>
    );
  }

  return (
    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-[#e7ebe6] bg-black">

      <video
        ref={
          videoRef
        }
        src={src}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        onLoadedMetadata={() => {
          // Seeking a hair past 0 forces most browsers to
          // paint a real frame instead of staying black.
          const el =
            videoRef.current;
          if (el) {
            try {
              el.currentTime = Math.min(
                0.1,
                el.duration ||
                  0.1,
              );
            } catch {
              // Ignore — some formats
              // reject seeking before
              // enough data has loaded.
            }
          }
        }}
        onError={() =>
          setFailed(
            true,
          )
        }
      />

      <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/10">
        <PlaySquare
          size={14}
          className="text-white drop-shadow"
        />
      </div>

    </div>
  );
}

function CrudTable({
  tab,
  items,
  search,
  setSearch,
  onAdd,
  onEdit,
  onDelete,
}: {
  tab: Tab;

  items:
    AnyRecord[];

  search:
    string;

  setSearch: (
    value: string,
  ) => void;

  onAdd:
    () => void;

  onEdit: (
    item: AnyRecord,
  ) => void;

  onDelete: (
    id: string,
  ) => void;
}) {
  const config =
    configs[tab]!;

  return (
    <section>

      <div className="flex items-end justify-between gap-4 max-[700px]:flex-col max-[700px]:items-stretch">

        <div>

          <h2 className="font-serif text-3xl">
            {
              config.title
            }
          </h2>

          <p className="mt-1 text-sm text-[#74807a]">
            {
              config.subtitle
            }
          </p>

        </div>

        <button
          type="button"
          onClick={
            onAdd
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b3b38] px-5 py-3 text-xs font-semibold text-white hover:bg-[#124b47]"
        >
          <Plus
            size={15}
          />

          Add{" "}
          {
            config.singular
          }
        </button>

      </div>

      <SearchBox
        value={
          search
        }
        setValue={
          setSearch
        }
      />

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#dce1dc] bg-white">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[760px] text-left">

            <thead className="bg-[#f5f7f4] text-[10px] uppercase tracking-[.14em] text-[#7b8580]">

              <tr>

                <th className="px-5 py-4">
                  Content
                </th>

                <th className="px-5 py-4">
                  Category /
                  Slug
                </th>

                <th className="px-5 py-4">
                  Status
                </th>

                <th className="px-5 py-4 text-right">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-[#edf0ed]">

              {items.map(
                (item) => {
                  const thumbnail =
                    item.thumbnail ||
                    item.featuredImage ||
                    item.image;

                  return (
                  <tr
                    key={
                      item._id
                    }
                    className="hover:bg-[#fbfcfa]"
                  >

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        {thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              thumbnail
                            }
                            alt=""
                            className="h-12 w-16 shrink-0 rounded-lg border border-[#e7ebe6] object-cover"
                          />
                        ) : tab ===
                            "videos" &&
                          item.url ? (
                          <VideoFramePreview
                            src={
                              item.url
                            }
                          />
                        ) : tab ===
                          "videos" ? (
                          <div className="grid h-12 w-16 shrink-0 place-items-center rounded-lg border border-dashed border-[#d4dbd6] bg-[#f4f6f3] text-[#a7b0aa]">
                            <PlaySquare
                              size={
                                16
                              }
                            />
                          </div>
                        ) : null}

                        <div className="min-w-0">

                          <p className="max-w-[360px] truncate text-sm font-semibold">
                            {item.title ||
                              item.name}
                          </p>

                          <p className="mt-1 max-w-[440px] truncate text-[11px] text-[#818b86]">
                            {item.description ||
                              item.excerpt ||
                              item.quote ||
                              item.tagline}
                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="px-5 py-4 text-xs text-[#65716b]">
                      {item.category ||
                        item.slug ||
                        item.type ||
                        "—"}
                    </td>


                    <td className="px-5 py-4">

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          item.published ===
                          false
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {item.published ===
                        false
                          ? "Draft"
                          : "Published"}
                      </span>

                      {item.featured && (
                        <span className="ml-2 rounded-full bg-[#f6eee4] px-2.5 py-1 text-[10px] text-[#986833]">
                          Featured
                        </span>
                      )}

                    </td>

                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            onEdit(
                              item,
                            )
                          }
                          className="rounded-lg border border-[#d9dfda] px-3 py-2 text-xs hover:bg-[#f5f7f4]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDelete(
                              item._id,
                            )
                          }
                          className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2
                            size={
                              14
                            }
                          />
                        </button>

                      </div>

                    </td>

                  </tr>
                  );
                },
              )}

            </tbody>

          </table>

        </div>

        {items.length ===
          0 && (
          <p className="p-8 text-center text-sm text-[#7a8580]">
            No records
            found.
          </p>
        )}

      </div>

    </section>
  );
}

/* =========================================================
   SUBSCRIBERS
========================================================= */

function SubscribersSection({
  items,
  search,
  setSearch,
  updateSubscriber,
}: {
  items:
    AnyRecord[];

  search:
    string;

  setSearch: (
    value: string,
  ) => void;

  updateSubscriber: (
    id: string,
    active: boolean,
  ) => void;
}) {
  return (
    <section>

      <h2 className="font-serif text-3xl">
        Newsletter
        Subscribers
      </h2>

      <p className="mt-1 text-sm text-[#74807a]">
        Review newsletter
        signups and activate
        or deactivate
        subscriptions.
      </p>

      <SearchBox
        value={
          search
        }
        setValue={
          setSearch
        }
      />

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#dce1dc] bg-white">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[680px] text-left">

            <thead className="bg-[#f5f7f4] text-[10px] uppercase tracking-[.14em] text-[#7b8580]">

              <tr>
                <th className="px-5 py-4">
                  Email
                </th>

                <th className="px-5 py-4">
                  Source
                </th>

                <th className="px-5 py-4">
                  Status
                </th>

                <th className="px-5 py-4">
                  Joined
                </th>
              </tr>

            </thead>

            <tbody className="divide-y divide-[#edf0ed]">

              {items.map(
                (item) => (
                  <tr
                    key={
                      item._id
                    }
                    className="hover:bg-[#fbfcfa]"
                  >

                    <td className="px-5 py-4 text-sm font-semibold">
                      {
                        item.email
                      }
                    </td>

                    <td className="px-5 py-4 text-xs text-[#65716b]">
                      {item.source ||
                        "website"}
                    </td>

                    <td className="px-5 py-4">

                      <select
                        value={
                          item.active
                            ? "active"
                            : "inactive"
                        }
                        onChange={(
                          event,
                        ) =>
                          updateSubscriber(
                            item._id,
                            event
                              .target
                              .value ===
                              "active",
                          )
                        }
                        className="rounded-lg border border-[#d9dfda] bg-[#f7f8f5] px-3 py-2 text-xs outline-none"
                      >

                        <option value="active">
                          Active
                        </option>

                        <option value="inactive">
                          Inactive
                        </option>

                      </select>

                    </td>

                    <td className="px-5 py-4 text-xs text-[#65716b]">
                      {item.createdAt
                        ? new Date(
                            item.createdAt,
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                  </tr>
                ),
              )}

            </tbody>

          </table>

        </div>

        {items.length ===
          0 && (
          <p className="p-8 text-center text-sm text-[#7a8580]">
            No subscribers
            found.
          </p>
        )}

      </div>

    </section>
  );
}

/* =========================================================
   SEARCH BOX
========================================================= */

function SearchBox({
  value,
  setValue,
}: {
  value: string;

  setValue: (
    value: string,
  ) => void;
}) {
  return (
    <div className="mt-6 flex max-w-[460px] items-center gap-3 rounded-xl border border-[#d9dfda] bg-white px-4">

      <Search
        size={16}
        className="text-[#84908a]"
      />

      <input
        value={
          value
        }
        onChange={(
          event,
        ) =>
          setValue(
            event.target
              .value,
          )
        }
        placeholder="Search records…"
        className="w-full bg-transparent py-3 text-sm outline-none"
      />

    </div>
  );
}

/* =========================================================
   EDITOR MODAL
========================================================= */

function EditorModal({
  config,
  item,
  onClose,
  onSaved,
  setError,
}: {
  config:
    NonNullable<
      (typeof configs)[Tab]
    >;

  item?:
    AnyRecord;

  onClose:
    () => void;

  onSaved:
    () => void;

  setError: (
    value: string,
  ) => void;
}) {
  const [
    form,
    setForm,
  ] = useState(() =>
    item
      ? normalizeForForm(
          item,
          config.fields,
        )
      : emptyForm(
          config.fields,
        ),
  );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const publicEndpoint =
    config.endpoint.replace(
      "/admin/all",
      "",
    );

  async function submit(
    event:
      FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const payload =
        normalizePayload(
          form,
          config.fields,
        );

      await apiRequest(
        item?._id
          ? `${publicEndpoint}/${item._id}`
          : publicEndpoint,
        {
          method:
            item?._id
              ? "PATCH"
              : "POST",

          body:
            JSON.stringify(
              payload,
            ),
        },
      );

      onSaved();
    } catch (err) {
      setError(
        err instanceof
          ApiError
          ? err.errors
              ?.join(
                " · ",
              ) ||
              err.message
          : err instanceof
              Error
            ? err.message
            : "Save failed.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#031715]/70 p-5 backdrop-blur-sm">

      <form
        onSubmit={
          submit
        }
        className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[24px] bg-[#f8f7f3] shadow-2xl"
      >

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dfe3df] bg-[#f8f7f3]/95 px-6 py-5 backdrop-blur">

          <div>

            <p className="text-[10px] uppercase tracking-[.18em] text-[#9a6d3b]">
              {item
                ? "Edit"
                : "Create"}
            </p>

            <h3 className="font-serif text-2xl">
              {
                config.singular
              }
            </h3>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-lg border border-[#d9dfda] p-2"
          >
            <X
              size={
                17
              }
            />
          </button>

        </div>

        <div className="grid grid-cols-2 gap-5 p-6 max-[650px]:grid-cols-1">

          {config.fields.map(
            (
              field,
            ) => (
              <FieldEditor
                key={
                  field.key
                }
                field={
                  field
                }
                value={
                  form[
                    field
                      .key
                  ]
                }
                onChange={(
                  value,
                ) =>
                  setForm(
                    {
                      ...form,

                      [field.key]:
                        value,
                    },
                  )
                }
              />
            ),
          )}

        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#dfe3df] bg-[#f8f7f3]/95 px-6 py-4 backdrop-blur">

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl border border-[#d5dbd6] px-5 py-3 text-xs font-semibold"
          >
            Cancel
          </button>

          <button
            disabled={
              saving
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#0b3b38] px-5 py-3 text-xs font-semibold text-white disabled:opacity-60"
          >
            <Save
              size={
                14
              }
            />

            {saving
              ? "Saving…"
              : "Save changes"}
          </button>

        </div>

      </form>

    </div>
  );
}

/* =========================================================
   FIELD EDITOR
========================================================= */

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field:
    Field;

  value: any;

  onChange: (
    value: any,
  ) => void;
}) {
  const [
    uploading,
    setUploading,
  ] =
    useState(false);

  const [
    uploadError,
    setUploadError,
  ] = useState("");

  const [
    showLinkInput,
    setShowLinkInput,
  ] = useState(false);

  const isImageField =
    [
      "image",
      "featuredImage",
      "thumbnail",
    ].includes(
      field.key,
    );

  // The "url" field is only used by the Videos config for the
  // actual video file, so it gets the same upload treatment.
  const isVideoField =
    field.key === "url";

  const mediaField =
    isImageField ||
    isVideoField;

  async function upload(
    file?: File,
  ) {
    if (!file) {
      return;
    }

    setUploading(
      true,
    );

    setUploadError(
      "",
    );

    try {
      const data =
        new FormData();

      data.append(
        "file",
        file,
      );

      const result =
        await apiRequest<{
          url: string;
        }>(
          "/admin/uploads",
          {
            method:
              "POST",

            body: data,
          },
        );

      onChange(
        result.url,
      );

      setShowLinkInput(
        false,
      );
    } catch (error) {
      setUploadError(
        error instanceof
          Error
          ? error.message
          : "Upload failed.",
      );
    } finally {
      setUploading(
        false,
      );
    }
  }

  return (
    <label
      className={`${
        field.type ===
          "textarea" ||
        field.type ===
          "lines" ||
        mediaField
          ? "col-span-2 max-[650px]:col-span-1"
          : ""
      } block`}
    >

      <span className="mb-2 block text-xs font-semibold text-[#46534e]">
        {field.label}
      </span>

      {field.type ===
      "boolean" ? (
        <input
          type="checkbox"
          checked={
            Boolean(
              value,
            )
          }
          onChange={(
            event,
          ) =>
            onChange(
              event
                .target
                .checked,
            )
          }
          className="h-5 w-5 accent-[#0d4a44]"
        />
      ) : field.type ===
          "textarea" ||
        field.type ===
          "lines" ? (
        <textarea
          required={
            field.required
          }
          value={
            value
          }
          onChange={(
            event,
          ) =>
            onChange(
              event
                .target
                .value,
            )
          }
          className="h-28 w-full rounded-xl border border-[#d8ddd9] bg-white px-4 py-3 text-sm outline-none focus:border-[#a87843]"
          placeholder={
            field.placeholder
          }
        />
      ) : mediaField ? (
        <MediaFieldUploader
          isVideo={
            isVideoField
          }
          value={value}
          uploading={
            uploading
          }
          uploadError={
            uploadError
          }
          showLinkInput={
            showLinkInput
          }
          setShowLinkInput={
            setShowLinkInput
          }
          onUpload={upload}
          onChange={
            onChange
          }
          required={
            field.required
          }
        />
      ) : (
        <input
          required={
            field.required
          }
          type={
            field.type ===
            "number"
              ? "number"
              : "text"
          }
          value={
            value
          }
          onChange={(
            event,
          ) =>
            onChange(
              event
                .target
                .value,
            )
          }
          className="w-full rounded-xl border border-[#d8ddd9] bg-white px-4 py-3 text-sm outline-none focus:border-[#a87843]"
          placeholder={
            field.placeholder
          }
        />
      )}

    </label>
  );
}

/* =========================================================
   MEDIA UPLOADER (IMAGE / VIDEO)

   Shows an actual preview of the uploaded image or video
   instead of the raw file path/URL. Uploading is the primary
   action; a small "paste a link instead" toggle stays available
   for cases where the media already lives elsewhere.
========================================================= */

function MediaFieldUploader({
  isVideo,
  value,
  uploading,
  uploadError,
  showLinkInput,
  setShowLinkInput,
  onUpload,
  onChange,
  required,
}: {
  isVideo: boolean;
  value: any;
  uploading: boolean;
  uploadError: string;
  showLinkInput: boolean;
  setShowLinkInput: (
    value: boolean,
  ) => void;
  onUpload: (
    file?: File,
  ) => void;
  onChange: (
    value: any,
  ) => void;
  required?: boolean;
}) {
  const hasValue =
    Boolean(
      value &&
        String(value).trim(),
    );

  return (
    <div>

      <div
        className={`overflow-hidden rounded-xl border ${
          hasValue
            ? "border-[#d8ddd9] bg-white"
            : "border-dashed border-[#c7cfc9] bg-[#f4f6f3]"
        }`}
      >

        {hasValue ? (
          <div className="relative">

            {isVideo ? (
              <video
                key={value}
                src={value}
                controls
                className="max-h-[220px] w-full bg-black object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt="Preview"
                className="max-h-[220px] w-full object-cover"
              />
            )}

            <div className="flex items-center justify-between gap-2 border-t border-[#e7ebe6] bg-[#fbfcfa] px-3 py-2">

              <label className="relative inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#d4dbd6] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#52605a] hover:bg-[#f2f5f2]">
                {uploading
                  ? "Uploading…"
                  : "Replace"}

                <input
                  disabled={
                    uploading
                  }
                  type="file"
                  accept={
                    isVideo
                      ? "video/mp4,video/webm,video/quicktime"
                      : "image/jpeg,image/png,image/webp,image/gif"
                  }
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(
                    event,
                  ) =>
                    onUpload(
                      event
                        .target
                        .files?.[0],
                    )
                  }
                />
              </label>

              <button
                type="button"
                onClick={() =>
                  onChange("")
                }
                className="rounded-lg border border-red-100 px-3 py-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-50"
              >
                Remove
              </button>

            </div>

          </div>
        ) : (
          <label className="relative flex cursor-pointer flex-col items-center justify-center gap-2 px-4 py-8 text-center">

            <span className="text-xs font-semibold text-[#52605a]">
              {uploading
                ? "Uploading…"
                : `Upload ${
                    isVideo
                      ? "a video"
                      : "an image"
                  }`}
            </span>

            <span className="text-[10px] text-[#8b948e]">
              {isVideo
                ? "MP4, WEBM or MOV"
                : "JPEG, PNG, WEBP or GIF"}
            </span>

            <input
              required={
                required &&
                !hasValue
              }
              disabled={
                uploading
              }
              type="file"
              accept={
                isVideo
                  ? "video/mp4,video/webm,video/quicktime"
                  : "image/jpeg,image/png,image/webp,image/gif"
              }
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(
                event,
              ) =>
                onUpload(
                  event
                    .target
                    .files?.[0],
                )
              }
            />

          </label>
        )}

      </div>

      {uploadError && (
        <span className="mt-1.5 block text-[10px] text-red-600">
          {uploadError}
        </span>
      )}

      <button
        type="button"
        onClick={() =>
          setShowLinkInput(
            !showLinkInput,
          )
        }
        className="mt-1.5 text-[10px] font-semibold text-[#8b6a3f] underline-offset-2 hover:underline"
      >
        {showLinkInput
          ? "Hide link field"
          : "Paste a link instead"}
      </button>

      {showLinkInput && (
        <input
          type="text"
          value={
            value || ""
          }
          onChange={(
            event,
          ) =>
            onChange(
              event
                .target
                .value,
            )
          }
          placeholder={
            isVideo
              ? "https://... or /videos/example.mp4"
              : "https://... or /images/example.jpg"
          }
          className="mt-2 w-full rounded-xl border border-[#d8ddd9] bg-white px-4 py-2.5 text-xs outline-none focus:border-[#a87843]"
        />
      )}

    </div>
  );
}

/* =========================================================
   PAGE CONTENT EDITOR
========================================================= */

function PagesEditor({
  keys,
  activeKey,
  json,
  setJson,
  selectKey,
  save,
  saving,
}: {
  keys:
    AnyRecord[];

  activeKey:
    string;

  json:
    string;

  setJson: (
    value: string,
  ) => void;

  selectKey: (
    value: string,
  ) => void;

  save:
    () => void;

  saving:
    boolean;
}) {
  return (
    <section>

      <div className="flex items-end justify-between gap-4 max-[700px]:flex-col max-[700px]:items-stretch">

        <div>

          <h2 className="font-serif text-3xl">
            Page Content
          </h2>

          <p className="mt-1 text-sm text-[#74807a]">
            Advanced
            structured content
            editor. Existing
            keys are seeded
            automatically.
          </p>

        </div>

        <button
          type="button"
          onClick={
            save
          }
          disabled={
            saving
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b3b38] px-5 py-3 text-xs font-semibold text-white disabled:opacity-60"
        >
          <Save
            size={
              14
            }
          />

          {saving
            ? "Saving…"
            : "Save content"}
        </button>

      </div>

      <div className="mt-6 grid grid-cols-[220px_1fr] gap-4 max-[750px]:grid-cols-1">

        <aside className="rounded-2xl border border-[#dce1dc] bg-white p-3">

          {keys.map(
            (
              item,
            ) => (
              <button
                type="button"
                key={
                  item.key
                }
                onClick={() =>
                  selectKey(
                    item.key,
                  )
                }
                className={`mb-1 block w-full rounded-lg px-3 py-2.5 text-left text-xs capitalize ${
                  activeKey ===
                  item.key
                    ? "bg-[#0d413d] text-white"
                    : "hover:bg-[#f2f5f2]"
                }`}
              >
                {
                  item.key
                }
              </button>
            ),
          )}

        </aside>

        <div>

          <textarea
            spellCheck={
              false
            }
            value={
              json
            }
            onChange={(
              event,
            ) =>
              setJson(
                event
                  .target
                  .value,
              )
            }
            className="min-h-[620px] w-full rounded-2xl border border-[#dce1dc] bg-[#0c211f] p-5 font-mono text-xs leading-6 text-[#d9e8e3] outline-none focus:border-[#b47c40]"
          />

          <p className="mt-2 text-[11px] text-[#7a8580]">
            Tip: keep the
            same object
            structure unless
            you are also
            updating the
            corresponding
            frontend
            component.
          </p>

        </div>

      </div>

    </section>
  );
}