# CivicEvents+ Project

CivicEvents+ is a civic events web application. The frontend uses HTML, Tailwind CSS, and jQuery. The backend is a Node.js, Express, and PostgreSQL API.

## Project structure

```text
frontend/     Static frontend pages, styles, and scripts
backend/      Node.js API (already configured)
video-demo/   Placeholder for the demo video link
```

## Requirements

- Node.js 18 or newer
- PostgreSQL 15 or newer
- A modern browser

## Start the backend

The backend is already configured for this project. Start it from the backend folder:

```powershell
cd backend
npm install
npm run dev
```

The API runs at `http://localhost:4000`. Check the health endpoint at `http://localhost:4000/health`.

If the database has not been created on a new machine, follow the steps in `backend/README.md` first. Do not change backend source files, migrations, uploads, or environment files for frontend work.

## Run the frontend

No build step is needed.

1. Open `frontend/index.html` directly in the browser, or
2. Right-click `frontend/index.html` in VS Code and choose **Open with Live Server**.

The frontend API base URL is defined in `frontend/js/config.js`:

```js
API_BASE_URL: "http://localhost:4000/api"
```

If the backend runs on another host or port, update that value.

## Accounts and roles

Create an account from the signup page. Passwords must have at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.

There are two roles:

- Members can browse published content, register for events, submit feedback after registering, update their profile, and view their registrations.
- Admins can manage events, announcements, promos, users, feedback, and notifications.

The signup page includes a demo admin role selector. This exists only so the project can be demonstrated without an existing admin. In a real system, admin accounts would be assigned by an administrator, not through public signup.

The default session uses `sessionStorage`. The **Remember me** option uses `localStorage` so the login survives closing the browser. `localStorage` is less secure because the token stays on the device longer. Use it only on a trusted personal device.

## Main features

- Login, signup, password strength meter, session expiry, and logout
- Shared header, navigation, notification bell, profile menu, and footer
- Member dashboard and admin dashboard
- Event browsing with browser-side search, location filter, date filter, and pagination
- Event registration, cancellation, attendee lists, and feedback
- Admin event create, edit, and delete with image upload
- Announcements with audio playback and browser-computed duration
- Promos with MP4 video, generated WebVTT captions, and transcript text
- Notifications with related item links
- Profile editing
- Admin user enable and disable actions
- Responsive layouts and accessible form labels, errors, focus styles, captions, and fallbacks

## API notes and limitations

The frontend works around limitations in the provided backend. These behaviors are intentional and documented here:

- The events endpoint ignores query filters and returns all events. Search, location, date filtering, and pagination run in the browser.
- Normal users see only published events and announcements in the UI, but the backend returns all rows. The browser filters them.
- Event create ignores `published`, and there is no event publish or unpublish endpoint. New events are published by default, so the event form has no publish toggle.
- Deleting an event that has registrations can fail because the database foreign key blocks it. The frontend shows the API error.
- Announcement audio cannot be replaced through edit because the update endpoint ignores uploaded audio.
- Announcement duration is computed from the audio metadata in the browser. The backend has no duration field.
- Announcements have no transcript field. The detail page does not invent one.
- Promos have `caption_text`, not a caption file. The detail page builds a WebVTT track from that text with a Blob URL.
- The promo form accepts MP4 only for reliable browser playback. The backend also accepts MOV, AVI, and MKV, but browsers may not play them. MP4 with H.264 video and AAC audio is recommended.
- Promo create always publishes because the backend ignores `published` on create. Publish and unpublish use the dedicated endpoints.
- Notifications have no mark-as-read endpoint and no create endpoint. Unread counts cannot be cleared.
- Admins can delete notifications. Normal users cannot.
- Normal users cannot fetch event-wide feedback or an average rating. The per-event feedback endpoint is admin only.
- Feedback is limited to registered normal users. Admins do not register for events or submit attendee feedback.
- Cancelled registrations remain in the database, so registering again for the same event returns a conflict.
- Event lists and user lists are filtered and paginated in the browser. The users endpoint returns a plain array without pagination metadata.
- Role changes are not supported by the backend. Admin user management only enables and disables accounts.
- There is no public content browsing. Every content endpoint requires login.


