"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  BellRing,
  BellOff,
  Download,
  Search,
  Users,
} from "lucide-react";

import { apiRequest } from "@/lib/api";

type AudienceContact = {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  sources: string[];
  isSubscribed: boolean;
  hasAccount: boolean;
  lastSeenAt?: string;
  createdAt: string;
};

type AudienceData = {
  stats: {
    total: number;
    subscribed: number;
    unsubscribed: number;
  };
  contacts: AudienceContact[];
};

const SOURCE_TONES: Record<string, string> = {
  account: "bg-[#eef5f1] text-[#0d4a44]",
  booking: "bg-[#eaf1fb] text-[#2d5e94]",
  enquiry: "bg-[#fbeee4] text-[#a5622a]",
  newsletter: "bg-[#f3eefb] text-[#6b4a9c]",
  chat: "bg-[#eafaf5] text-[#1f8a6f]",
};

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function AudienceSection() {
  const [data, setData] =
    useState<AudienceData | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (term: string) => {
      setLoading(true);
      setError("");

      try {
        const response = await apiRequest<{
          data: AudienceData;
        }>(
          `/admin/audience${
            term
              ? `?search=${encodeURIComponent(term)}`
              : ""
          }`,
        );

        setData(response.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the audience list.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    // Debounce so typing in the search box doesn't
    // fire a request per keystroke.
    const timer = setTimeout(
      () => void load(search),
      search ? 350 : 0,
    );

    return () => clearTimeout(timer);
  }, [search, load]);

  function exportCsv() {
    if (!data?.contacts.length) return;

    const rows = [
      [
        "Name",
        "Email",
        "Phone",
        "Sources",
        "Subscribed",
        "Has account",
        "Added",
      ],

      ...data.contacts.map((contact) => [
        contact.name || "",
        contact.email,
        contact.phone || "",
        contact.sources.join(" | "),
        contact.isSubscribed ? "Yes" : "No",
        contact.hasAccount ? "Yes" : "No",
        formatDate(contact.createdAt),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (cell) =>
              `"${String(cell).replace(/"/g, '""')}"`,
          )
          .join(","),
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      }),
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = `neusoma-audience-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    link.click();
    URL.revokeObjectURL(url);
  }

  const cards = [
    {
      label: "Total contacts",
      value: data?.stats.total ?? 0,
      icon: Users,
      accent: "bg-[#eef5f1] text-[#0d4a44]",
    },
    {
      label: "Will be notified",
      value: data?.stats.subscribed ?? 0,
      icon: BellRing,
      accent: "bg-[#eaf1fb] text-[#2d5e94]",
    },
    {
      label: "Opted out",
      value: data?.stats.unsubscribed ?? 0,
      icon: BellOff,
      accent: "bg-[#fdf0ee] text-[#b0503f]",
    },
  ];

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-[#172420]">
            Audience
          </h2>

          <p className="mt-1.5 max-w-[560px] text-xs leading-5 text-[#7a8580]">
            Everyone captured from any form on the
            site — enquiries, newsletter signups,
            bookings, chat and account signups. This
            is the list that gets emailed whenever you
            publish a new session.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={!data?.contacts.length}
          className="inline-flex items-center gap-2 rounded-xl border border-[#d4dbd6] bg-white px-4 py-2.5 text-xs font-semibold text-[#52605a] transition hover:bg-[#f2f5f2] disabled:opacity-50"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 max-[750px]:grid-cols-1">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-[#dce1dc] bg-white p-5"
          >
            <div
              className={`grid h-10 w-10 place-items-center rounded-xl ${card.accent}`}
            >
              <card.icon size={18} />
            </div>

            <p className="mt-4 font-serif text-3xl text-[#172420]">
              {card.value}
            </p>

            <p className="mt-1 text-xs font-semibold text-[#5e6b65]">
              {card.label}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#dce1dc] bg-white">
        <div className="border-b border-[#e7ebe6] p-4">
          <span className="relative block max-w-[320px]">
            <Search
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa39d]"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name or email"
              className="w-full rounded-xl border border-[#d9dfda] bg-[#fbfcfa] py-2.5 pl-9 pr-4 text-xs outline-none focus:border-[#a87843]"
            />
          </span>
        </div>

        {error && (
          <p className="m-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="p-10 text-center text-xs text-[#7a8580]">
            Loading…
          </p>
        ) : !data?.contacts.length ? (
          <p className="p-10 text-center text-xs text-[#7a8580]">
            No contacts yet. They&apos;ll appear here
            as people use the forms on your site.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#fbfcfa] text-[10px] uppercase tracking-[.1em] text-[#8b948e]">
                <tr>
                  <th className="px-5 py-3 font-semibold">
                    Contact
                  </th>
                  <th className="px-5 py-3 font-semibold">
                    Came from
                  </th>
                  <th className="px-5 py-3 font-semibold">
                    Status
                  </th>
                  <th className="px-5 py-3 font-semibold">
                    Added
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#eef1ee] text-xs">
                {data.contacts.map((contact) => (
                  <tr
                    key={contact._id}
                    className="hover:bg-[#fbfcfa]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#172420]">
                        {contact.name || "—"}
                        {contact.hasAccount && (
                          <span className="ml-2 rounded-full bg-[#eef5f1] px-2 py-0.5 text-[9px] font-bold text-[#0d4a44]">
                            Account
                          </span>
                        )}
                      </p>

                      <p className="mt-0.5 text-[11px] text-[#76817c]">
                        {contact.email}
                        {contact.phone
                          ? ` · ${contact.phone}`
                          : ""}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="flex flex-wrap gap-1">
                        {contact.sources.map(
                          (source) => (
                            <span
                              key={source}
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold capitalize ${
                                SOURCE_TONES[
                                  source
                                ] ||
                                "bg-[#eef1ee] text-[#65716b]"
                              }`}
                            >
                              {source}
                            </span>
                          ),
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          contact.isSubscribed
                            ? "bg-[#e9f6ef] text-[#2f7a51]"
                            : "bg-[#fdeeee] text-[#a8443f]"
                        }`}
                      >
                        {contact.isSubscribed ? (
                          <BellRing size={10} />
                        ) : (
                          <BellOff size={10} />
                        )}
                        {contact.isSubscribed
                          ? "Subscribed"
                          : "Opted out"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-[#65716b]">
                      {formatDate(
                        contact.createdAt,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
