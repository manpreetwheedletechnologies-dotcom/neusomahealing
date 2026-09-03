"use client";

import {
  useMemo,
  useState,
  type ElementType,
} from "react";

import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Eye,
  Inbox,
  Mail,
  MessageSquareText,
  Phone,
  Search,
  UserCheck,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

export type EnquiryStatus =
  | "new"
  | "contacted"
  | "booked"
  | "closed";

export type Enquiry = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: EnquiryStatus;
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  items: Enquiry[];
  search: string;
  setSearch: (value: string) => void;
  updateStatus: (
    id: string,
    status: EnquiryStatus,
  ) => Promise<void>;
  updatingStatusId: string | null;
};

const STATUS_OPTIONS: {
  value: EnquiryStatus;
  label: string;
}[] = [
  { value: "new", label: "New" },
  {
    value: "contacted",
    label: "Contacted",
  },
  {
    value: "booked",
    label: "Booked",
  },
  {
    value: "closed",
    label: "Closed",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function statusClasses(
  status: EnquiryStatus,
) {
  const classes = {
    new: "border-[#dce8e4] bg-[#edf7f4] text-[#176b5d]",
    contacted:
      "border-[#e4ddf0] bg-[#f5f1fb] text-[#7452a2]",
    booked:
      "border-[#dce8f4] bg-[#eef6fd] text-[#3b6f9a]",
    closed:
      "border-[#e4e4e4] bg-[#f4f4f4] text-[#696969]",
  };

  return classes[status];
}

function formatDate(
  value?: string,
) {
  if (!value) return "—";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  ).format(date);
}

function initials(
  name: string,
) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part
        .charAt(0)
        .toUpperCase(),
    )
    .join("");
}

/* =========================================================
   COMPONENT
========================================================= */

export function EnquiriesSection({
  items,
  search,
  setSearch,
  updateStatus,
  updatingStatusId,
}: Props) {
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "all" | EnquiryStatus
  >("all");

  const [
    selectedEnquiry,
    setSelectedEnquiry,
  ] =
    useState<Enquiry | null>(
      null,
    );

  /* -------------------------
     Stats
  ------------------------- */

  const stats =
    useMemo(
      () => ({
        total: items.length,

        new: items.filter(
          (item) =>
            item.status ===
            "new",
        ).length,

        contacted:
          items.filter(
            (item) =>
              item.status ===
              "contacted",
          ).length,

        booked:
          items.filter(
            (item) =>
              item.status ===
              "booked",
          ).length,

        closed:
          items.filter(
            (item) =>
              item.status ===
              "closed",
          ).length,
      }),
      [items],
    );

  /* -------------------------
     Search + Filter
  ------------------------- */

  const filteredItems =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return [...items]
        .filter((item) => {
          if (
            statusFilter !==
              "all" &&
            item.status !==
              statusFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            item.name,
            item.email,
            item.phone,
            item.subject,
            item.message,
            item.status,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
          );
        })
        .sort(
          (a, b) =>
            new Date(
              b.createdAt || 0,
            ).getTime() -
            new Date(
              a.createdAt || 0,
            ).getTime(),
        );
    }, [
      items,
      search,
      statusFilter,
    ]);

  /* -------------------------
     Status Update
  ------------------------- */

  async function changeStatus(
    enquiry: Enquiry,
    status: EnquiryStatus,
  ) {
    try {
      await updateStatus(
        enquiry._id,
        status,
      );

      setSelectedEnquiry(
        (current) =>
          current?._id ===
          enquiry._id
            ? {
                ...current,
                status,
              }
            : current,
      );
    } catch (error) {
      console.error(
        "Enquiry status update failed:",
        error,
      );
    }
  }

  return (
    <>
      {/*
        IMPORTANT:
        z-index intentionally high because
        website floating chat layer was
        intercepting admin interactions.
      */}

      <section className="relative z-[10000] pointer-events-auto">

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-5 gap-4 max-[1150px]:grid-cols-3 max-[760px]:grid-cols-2 max-[460px]:grid-cols-1">

          <StatCard
            label="Total enquiries"
            value={stats.total}
            icon={Inbox}
            description="All website leads"
          />

          <StatCard
            label="New"
            value={stats.new}
            icon={
              MessageSquareText
            }
            description="Needs attention"
          />

          <StatCard
            label="Contacted"
            value={
              stats.contacted
            }
            icon={UserCheck}
            description="Follow-up started"
          />

          <StatCard
            label="Booked"
            value={
              stats.booked
            }
            icon={
              CalendarCheck2
            }
            description="Converted leads"
          />

          <StatCard
            label="Closed"
            value={
              stats.closed
            }
            icon={
              CheckCircle2
            }
            description="Completed leads"
          />

        </div>

        {/* =================================================
            SEARCH + FILTER
        ================================================= */}

        <div className="relative z-[10010] mt-7 flex items-center justify-between gap-4 rounded-2xl border border-[#dce1dc] bg-white p-4 shadow-[0_8px_30px_rgba(37,56,49,.035)] max-[760px]:flex-col max-[760px]:items-stretch">

          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-4">

            <Search
              size={17}
              className="shrink-0 text-[#89948f]"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value,
                )
              }
              placeholder="Search name, email, subject or message..."
              className="w-full bg-transparent py-3 text-sm text-[#263832] outline-none placeholder:text-[#a1aaa6]"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="relative z-[10020] cursor-pointer text-[#8a9690] transition hover:text-[#243c35]"
              >
                <X size={15} />
              </button>
            )}

          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as
                  | "all"
                  | EnquiryStatus,
              )
            }
            className="relative z-[10020] min-w-[165px] cursor-pointer rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-4 py-3 text-xs font-semibold text-[#45544e] outline-none focus:border-[#a87943]"
          >
            <option value="all">
              All statuses
            </option>

            {STATUS_OPTIONS.map(
              (option) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {
                    option.label
                  }
                </option>
              ),
            )}
          </select>

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="relative z-[10010] mt-5 overflow-hidden rounded-[22px] border border-[#dce1dc] bg-white shadow-[0_12px_35px_rgba(30,50,43,.04)]">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px] text-left">

              <thead className="border-b border-[#e7ebe7] bg-[#f5f7f4]">

                <tr className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7b8781]">

                  <th className="px-5 py-4">
                    Contact
                  </th>

                  <th className="px-5 py-4">
                    Subject
                  </th>

                  <th className="px-5 py-4">
                    Message
                  </th>

                  <th className="px-5 py-4">
                    Received
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right">
                    Details
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-[#edf0ed]">

                {filteredItems.map(
                  (item) => (
                    <tr
                      key={
                        item._id
                      }
                      className="transition hover:bg-[#fbfcfa]"
                    >

                      {/* CONTACT */}

                      <td className="px-5 py-5 align-top">

                        <div className="flex items-start gap-3">

                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#edf4f1] text-xs font-bold text-[#0c5149]">
                            {initials(
                              item.name,
                            )}
                          </div>

                          <div className="min-w-0">

                            <p className="max-w-[190px] truncate text-sm font-semibold text-[#24362f]">
                              {
                                item.name
                              }
                            </p>

                            <a
                              href={`mailto:${item.email}`}
                              className="mt-1 block max-w-[210px] truncate text-[11px] text-[#78837e] hover:text-[#a66f35]"
                            >
                              {
                                item.email
                              }
                            </a>

                            {item.phone && (
                              <a
                                href={`tel:${item.phone}`}
                                className="mt-1 block text-[11px] text-[#78837e] hover:text-[#a66f35]"
                              >
                                {
                                  item.phone
                                }
                              </a>
                            )}

                          </div>

                        </div>

                      </td>

                      {/* SUBJECT */}

                      <td className="px-5 py-5 align-top">

                        <p className="max-w-[180px] text-xs font-semibold leading-5 text-[#46554f]">
                          {item.subject ||
                            "Website enquiry"}
                        </p>

                      </td>

                      {/* MESSAGE PREVIEW */}

                      <td className="px-5 py-5 align-top">

                        <p
                          title={
                            item.message
                          }
                          className="max-w-[310px] truncate text-xs leading-5 text-[#74807a]"
                        >
                          {
                            item.message
                          }
                        </p>

                      </td>

                      {/* DATE */}

                      <td className="px-5 py-5 align-top">

                        <div className="flex items-start gap-2 text-[11px] leading-5 text-[#69756f]">

                          <Clock3
                            size={14}
                            className="mt-[2px] shrink-0 text-[#a57a4c]"
                          />

                          <span>
                            {formatDate(
                              item.createdAt,
                            )}
                          </span>

                        </div>

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-5 align-top">

                        <select
                          value={
                            item.status
                          }
                          disabled={
                            updatingStatusId ===
                            item._id
                          }
                          onChange={(e) =>
                            changeStatus(
                              item,
                              e.target
                                .value as EnquiryStatus,
                            )
                          }
                          className={`relative z-[10020] cursor-pointer rounded-full border px-3 py-2 text-[10px] font-semibold capitalize outline-none transition disabled:cursor-wait disabled:opacity-60 ${statusClasses(
                            item.status,
                          )}`}
                        >

                          {STATUS_OPTIONS.map(
                            (
                              option,
                            ) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {
                                  option.label
                                }
                              </option>
                            ),
                          )}

                        </select>

                      </td>

                      {/* VIEW */}

                      <td className="px-5 py-5 text-right align-top">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedEnquiry(
                              item,
                            )
                          }
                          className="relative z-[10020] inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#d6ddd8] bg-white px-3.5 py-2.5 text-[11px] font-semibold text-[#43534c] transition hover:border-[#b78a57] hover:bg-[#fbf6ef] hover:text-[#8d6335]"
                        >
                          <Eye
                            size={14}
                          />
                          View
                        </button>

                      </td>

                    </tr>
                  ),
                )}

              </tbody>

            </table>

          </div>

          {filteredItems.length ===
            0 && (
            <div className="grid min-h-[260px] place-items-center px-5 py-10 text-center">

              <div>

                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#eef4f1] text-[#3e665c]">
                  <Inbox
                    size={20}
                  />
                </div>

                <p className="mt-4 text-sm font-semibold text-[#34463f]">
                  No enquiries found
                </p>

                <p className="mt-1 text-xs text-[#83908a]">
                  New contact form
                  submissions will appear
                  here automatically.
                </p>

              </div>

            </div>
          )}

        </div>

        <p className="mt-3 text-right text-[11px] text-[#87928d]">
          Showing{" "}
          {
            filteredItems.length
          }{" "}
          of {items.length} enquiries
        </p>

      </section>

      {/* ===================================================
          DETAILS MODAL
      =================================================== */}

      {selectedEnquiry && (
        <div
          className="fixed inset-0 z-[2147483646] grid place-items-center bg-[#071c1a]/70 p-5 backdrop-blur-sm"
          onClick={() =>
            setSelectedEnquiry(
              null,
            )
          }
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Enquiry details"
            onClick={(e) =>
              e.stopPropagation()
            }
            className="max-h-[90vh] w-full max-w-[680px] overflow-y-auto rounded-[26px] border border-white/20 bg-[#f8f7f3] shadow-[0_30px_100px_rgba(2,20,17,.35)]"
          >

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dfe3df] bg-[#f8f7f3]/95 px-6 py-5 backdrop-blur-xl">

              <div>

                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a87943]">
                  Enquiry Details
                </p>

                <h3 className="mt-1 font-serif text-2xl text-[#20352e]">
                  {
                    selectedEnquiry.name
                  }
                </h3>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEnquiry(
                    null,
                  )
                }
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-[#d6ddd8] bg-white text-[#617069] transition hover:bg-[#eef2ef]"
              >
                <X size={16} />
              </button>

            </div>

            <div className="p-6">

              {/* CONTACT */}

              <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">

                <DetailCard
                  label="Email"
                  value={
                    selectedEnquiry.email
                  }
                  icon={Mail}
                />

                <DetailCard
                  label="Phone"
                  value={
                    selectedEnquiry.phone ||
                    "Not provided"
                  }
                  icon={Phone}
                />

              </div>

              {/* SUBJECT */}

              <div className="mt-4 rounded-2xl border border-[#dde2de] bg-white p-5">

                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8b9691]">
                  Subject
                </p>

                <p className="mt-2 text-sm font-semibold leading-6 text-[#34463f]">
                  {selectedEnquiry.subject ||
                    "Website enquiry"}
                </p>

              </div>

              {/* COMPLETE MESSAGE */}

              <div className="mt-4 rounded-2xl border border-[#dde2de] bg-white p-5">

                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8b9691]">
                  Customer Message
                </p>

                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#5d6b65]">
                  {
                    selectedEnquiry.message
                  }
                </p>

              </div>

              {/* RECEIVED + STATUS */}

              <div className="mt-4 grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">

                <div className="rounded-2xl border border-[#dde2de] bg-white p-4">

                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#8c9792]">
                    Received
                  </p>

                  <p className="mt-2 text-xs font-semibold text-[#46554f]">
                    {formatDate(
                      selectedEnquiry.createdAt,
                    )}
                  </p>

                </div>

                <div className="rounded-2xl border border-[#dde2de] bg-white p-4">

                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#8c9792]">
                    Current Status
                  </p>

                  <select
                    value={
                      selectedEnquiry.status
                    }
                    disabled={
                      updatingStatusId ===
                      selectedEnquiry._id
                    }
                    onChange={(e) =>
                      changeStatus(
                        selectedEnquiry,
                        e.target
                          .value as EnquiryStatus,
                      )
                    }
                    className={`mt-2 cursor-pointer rounded-full border px-3 py-2 text-[10px] font-semibold capitalize outline-none disabled:cursor-wait disabled:opacity-60 ${statusClasses(
                      selectedEnquiry.status,
                    )}`}
                  >

                    {STATUS_OPTIONS.map(
                      (
                        option,
                      ) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      ),
                    )}

                  </select>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="mt-6 flex flex-wrap justify-end gap-3">

                {selectedEnquiry.phone && (
                  <a
                    href={`tel:${selectedEnquiry.phone}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#d5dcd7] bg-white px-4 py-3 text-xs font-semibold text-[#41534c] transition hover:bg-[#eef4f1]"
                  >
                    <Phone
                      size={14}
                    />
                    Call
                  </a>
                )}

                <a
                  href={`mailto:${selectedEnquiry.email}?subject=${encodeURIComponent(
                    `Re: ${
                      selectedEnquiry.subject ||
                      "Your enquiry"
                    }`,
                  )}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0b3b38] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#124c47]"
                >
                  <Mail
                    size={14}
                  />
                  Send Email
                </a>

              </div>

            </div>

          </div>

        </div>
      )}
    </>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: number;
  icon: ElementType;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-[#dce1dc] bg-white p-5 shadow-[0_8px_30px_rgba(37,56,49,.035)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(37,56,49,.07)]">

      <div className="flex items-center justify-between">

        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef5f1] text-[#0d5149]">
          <Icon size={18} />
        </div>

        <span className="font-serif text-3xl text-[#20362f]">
          {value}
        </span>

      </div>

      <p className="mt-5 text-xs font-semibold text-[#47564f]">
        {label}
      </p>

      <p className="mt-1 text-[10px] text-[#8a9590]">
        {description}
      </p>

    </article>
  );
}

/* =========================================================
   DETAIL CARD
========================================================= */

function DetailCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ElementType;
}) {
  return (
    <div className="rounded-2xl border border-[#dde2de] bg-white p-4">

      <div className="flex items-start gap-3">

        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eef5f1] text-[#17554c]">
          <Icon size={15} />
        </div>

        <div className="min-w-0">

          <p className="text-[9px] uppercase tracking-[0.14em] text-[#8d9893]">
            {label}
          </p>

          <p className="mt-1 break-all text-xs font-semibold leading-5 text-[#41514b]">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}