# NeusomaHealing Practice — Full Stack

**Frontend:** Next.js 14 (App Router)
**Backend:** NestJS + MongoDB (Mongoose)

## Folder structure

```
neusomahealing-fullstack/
├── frontend/     → Next.js app (pages: /, /about, /nervous-system, /resources)
└── backend/      → NestJS API (enquiries, videos, blog — all backed by MongoDB)
```

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

You need a running MongoDB instance. Easiest options:

- **Local**: install MongoDB Community Server, or run `docker run -d -p 27017:27017 --name mongo mongo`
- **Free cloud (recommended if you don't want to install anything)**: create a free cluster at
  [mongodb.com/atlas](https://www.mongodb.com/atlas) and paste the connection string into
  `MONGODB_URI` in `.env`

Then start the API:

```bash
npm run start:dev
```

It runs on **http://localhost:4000**. Test it:

```bash
curl http://localhost:4000/enquiries
```

### API endpoints

| Method | Endpoint             | Purpose                                   |
|--------|-----------------------|--------------------------------------------|
| POST   | `/enquiries`           | Website form submits here                 |
| GET    | `/enquiries`           | List all enquiries (for a future admin UI) |
| PATCH  | `/enquiries/:id/status`| Update enquiry status                      |
| GET    | `/videos`               | List published videos                      |
| POST   | `/videos`               | Add a video                                |
| PATCH  | `/videos/:id`           | Edit a video                               |
| DELETE | `/videos/:id`           | Remove a video                             |
| GET    | `/blog`                 | List published blog posts                  |
| GET    | `/blog/:slug`           | Single post by slug                        |
| POST   | `/blog`                 | Add a post                                 |
| PATCH  | `/blog/:id`             | Edit a post                                |
| DELETE | `/blog/:id`             | Remove a post                              |

There's no data in the database yet — the Resources page falls back to sample video
cards until you add real ones via `POST /videos` (or build the admin UI in the next round).

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Opens on **http://localhost:3000**. It talks to the backend using
`NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`).

## 3. What's already wired up

- The **enquiry form** on `/about` POSTs to `POST /enquiries` and saves to MongoDB.
- The **video grid** on `/resources` fetches from `GET /videos`. If the backend isn't
  running yet, it silently falls back to sample cards so the page never looks broken.
- Blog posts are still static on the frontend — wiring them to `GET /blog` is a quick
  follow-up once you're ready to add the blog admin.

## 4. Not built yet (next steps)

- Admin dashboard UI (login + forms to manage enquiries/videos/blog/testimonials)
- Coaching programs page + booking system
- Testimonials page
- Image/video upload storage (currently expects a URL — e.g. YouTube/Vimeo embed or
  a CDN link)
- Authentication for the admin area

Ask for any of these next and we'll build them into this same structure.
