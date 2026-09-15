/*
 * Server-safe fetchers for public content that used to live in
 * lib/site-data.ts as static arrays. Everything here reads from
 * the same collections the admin panel writes to, so what's in
 * the DB is what shows on the site.
 *
 * These are plain `fetch` calls (no cookies/credentials needed —
 * the underlying routes are public), safe to call from Server
 * Components, generateMetadata, etc. On any failure they resolve
 * to an empty/null fallback instead of throwing, so a backend
 * hiccup doesn't take a whole page down.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://192.168.1.16:4000";

// Public content changes rarely enough that a short revalidate
// window keeps pages fresh without hitting the API on every request.
const REVALIDATE_SECONDS = 60;

export type ApiTestimonial = {
  _id: string;
  name: string;
  type: string;
  category: string;
  quote: string;
  order: number;
  featured: boolean;
  published: boolean;
};

export type ApiVideo = {
  _id: string;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  category: string;
  duration?: string;
  featured: boolean;
  published: boolean;
};

export type ApiCoachingProgram = {
  _id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  details: string[];
  explore: string[];
  expect: string;
  image?: string;
  order: number;
  published: boolean;
};

export type ApiInsight = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  featuredImage?: string;
  author: string;
  readTime?: string;
  published: boolean;
  createdAt?: string;
};

async function safeGetList<T>(path: string): Promise<T[]> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch {
    return [];
  }
}

async function safeGetOne<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function getPublicTestimonials() {
  return safeGetList<ApiTestimonial>("/testimonials");
}

export function getPublicVideos() {
  return safeGetList<ApiVideo>("/videos");
}

export function getPublicCoachingPrograms() {
  return safeGetList<ApiCoachingProgram>("/coaching");
}

export function getPublicInsights() {
  return safeGetList<ApiInsight>("/blog");
}

export function getCoachingProgramBySlug(slug: string) {
  return safeGetOne<ApiCoachingProgram>(
    `/coaching/${encodeURIComponent(slug)}`,
  );
}

export function getInsightBySlug(slug: string) {
  return safeGetOne<ApiInsight>(`/blog/${encodeURIComponent(slug)}`);
}

/*
 * Small helper: pull a sorted, de-duplicated list of category
 * values from fetched content, prefixed with "All" — replaces
 * the old hardcoded category arrays in site-data.ts.
 */
export function categoriesFrom(
  items: { category: string }[],
): string[] {
  const unique = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean)),
  );

  return ["All", ...unique];
}
