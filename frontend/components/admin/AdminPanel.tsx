"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  BookOpenText,
  CalendarDays,
  ChevronRight,
  FilePenLine,
  Gauge,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
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
  | "bookings"
  | "subscribers"
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

          if (
            target ===
              "enquiries" ||
            target ===
              "bookings" ||
            target ===
              "subscribers"
          ) {
            setItems([]);
          }
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
  className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[270px] flex-col overflow-hidden border-r border-white/10 bg-[#082f2d] p-5 text-white transition-transform min-[901px]:translate-x-0 ${
    sidebar
      ? "translate-x-0"
      : "max-[900px]:-translate-x-full"
  }`}
>

        <div className="flex shrink-0 items-center justify-between">

          <a href="/">
            <img
              src="/no_bg_neusomalogo_1.png"
              alt="NeusomaHealing"
              className="w-28 object-contain"
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

            <div>

              <h1 className="font-serif text-2xl">
                {title}
              </h1>

              <p className="text-[11px] text-[#74807a]">
                NeusomaHealing
                content
                management
              </p>

            </div>

          </div>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#ccd5cf] px-4 py-2 text-xs font-semibold text-[#29433c] transition hover:bg-white"
          >
            View website ↗
          </a>

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
  "bookings" ? (
  <BookingsSection
    items={items as Booking[]}
    search={search}
    setSearch={setSearch}
    updateStatus={updateStatus}
    updatingStatusId={updatingStatusId}
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
}: {
  data: AnyRecord;
}) {
  const cards = [
    [
      "New enquiries",
      data.newEnquiries ||
        0,
      MessageSquareText,
    ],

    [
      "New bookings",
      data.newBookings ||
        0,
      CalendarDays,
    ],

    [
      "Subscribers",
      data.subscribers ||
        0,
      Mail,
    ],

    [
      "Insights",
      data.posts || 0,
      BookOpenText,
    ],

    [
      "Videos",
      data.videos || 0,
      PlaySquare,
    ],

    [
      "Coaching programs",
      data.coaching ||
        0,
      Sparkles,
    ],

    [
      "Testimonials",
      data.testimonials ||
        0,
      UsersRound,
    ],
  ];

  return (
    <>

      <section className="overflow-hidden rounded-[26px] bg-[#0b3a37] p-8 text-white">

        <p className="text-[10px] uppercase tracking-[.22em] text-[#d2a873]">
          Overview
        </p>

        <h2 className="mt-3 max-w-[640px] font-serif text-[clamp(32px,4vw,50px)] leading-[1.03]">
          Everything you
          need to keep the
          website current.
        </h2>

        <p className="mt-4 max-w-[640px] text-sm leading-7 text-[#afc2bc]">
          Content changes
          made here are read
          by the public
          website through
          the NestJS API and
          MongoDB.
        </p>

      </section>

      {/* DASHBOARD CARDS */}

      <section className="mt-6 grid grid-cols-3 gap-4 max-[1050px]:grid-cols-2 max-[600px]:grid-cols-1">

        {cards.map(
          ([
            label,
            value,
            Icon,
          ]: any) => (
            <article
              key={
                label
              }
              className="rounded-2xl border border-[#dce1dc] bg-white p-5 shadow-[0_8px_30px_rgba(37,56,49,.04)]"
            >

              <div className="flex items-center justify-between">

                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef5f1] text-[#0d4a44]">
                  <Icon
                    size={
                      18
                    }
                  />
                </div>

                <span className="font-serif text-3xl">
                  {value}
                </span>

              </div>

              <p className="mt-5 text-xs font-semibold text-[#5e6b65]">
                {label}
              </p>

            </article>
          ),
        )}

      </section>

      {/* DASHBOARD LOWER CARDS */}

      <section className="mt-6 grid grid-cols-2 gap-4 max-[800px]:grid-cols-1">

        <article className="rounded-2xl border border-[#dce1dc] bg-white p-6">

          <p className="text-xs font-semibold">
            Lead pipeline
          </p>

          <p className="mt-3 text-sm text-[#76817c]">
            Total enquiries:{" "}
            <strong className="text-[#20322c]">
              {data.totalEnquiries ||
                0}
            </strong>
          </p>

          <p className="mt-2 text-sm text-[#76817c]">
            Total bookings:{" "}
            <strong className="text-[#20322c]">
              {data.totalBookings ||
                0}
            </strong>
          </p>

        </article>

        <article className="rounded-2xl border border-[#dce1dc] bg-white p-6">

          <p className="text-xs font-semibold">
            Publishing
            workflow
          </p>

          <p className="mt-3 text-sm leading-6 text-[#76817c]">
            Use the
            Published
            switches to
            prepare content
            privately before
            making it visible
            on the public
            website.
          </p>

        </article>

      </section>

    </>
  );
}

/* =========================================================
   GENERIC CRUD TABLE
========================================================= */

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
                (item) => (
                  <tr
                    key={
                      item._id
                    }
                    className="hover:bg-[#fbfcfa]"
                  >

                    <td className="px-5 py-4">

                      <p className="max-w-[420px] truncate text-sm font-semibold">
                        {item.title ||
                          item.name}
                      </p>

                      <p className="mt-1 max-w-[500px] truncate text-[11px] text-[#818b86]">
                        {item.description ||
                          item.excerpt ||
                          item.quote ||
                          item.tagline}
                      </p>

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
                ),
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

  const mediaField =
    [
      "image",
      "featuredImage",
      "thumbnail",
      "url",
    ].includes(
      field.key,
    );

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
          "lines"
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
      ) : (
        <>

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

          {mediaField && (
            <>

              <span className="mt-2 flex items-center gap-3">

                <span className="relative inline-flex cursor-pointer items-center rounded-lg border border-[#d4dbd6] bg-white px-3 py-2 text-[10px] font-semibold text-[#52605a] hover:bg-[#f2f5f2]">

                  {uploading
                    ? "Uploading…"
                    : "Upload media"}

                  <input
                    disabled={
                      uploading
                    }
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(
                      event,
                    ) =>
                      upload(
                        event
                          .target
                          .files?.[0],
                      )
                    }
                  />

                </span>

                {value && (
                  <span className="max-w-[260px] truncate text-[10px] text-[#87908c]">
                    {value}
                  </span>
                )}

              </span>

              {uploadError && (
                <span className="mt-1 block text-[10px] text-red-600">
                  {
                    uploadError
                  }
                </span>
              )}

            </>
          )}

        </>
      )}

    </label>
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