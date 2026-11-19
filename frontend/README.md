# CivicEvents+ Frontend

This folder contains the static frontend for CivicEvents+.

## Run it

Open `index.html` directly in a browser, or right-click it in VS Code and choose **Open with Live Server**. There is no build step and no package install for the frontend.

The backend should be running at `http://localhost:4000`. The frontend API base URL is in `js/config.js`:

```js
API_BASE_URL: "http://localhost:4000/api"
```

## Structure

```text
index.html, login.html, signup.html
dashboard.html, events.html, event-detail.html, event-form.html
announcements.html, announcement-detail.html, announcement-form.html
promos.html, promo-detail.html, promo-form.html
notifications.html, profile.html, my-registrations.html
admin-dashboard.html, admin-users.html
css/app.css
js/config.js, auth.js, api.js, ui.js, app.js
js/<page>.js
```

Protected pages load scripts in this order: jQuery, config, auth, api, ui, app, then the page script.

## Roles

Members can browse published content, register for events, submit feedback after registering, and manage their profile. Admins can manage events, announcements, promos, users, and notifications.

The signup page has a demo admin role selector. It is included only for the project demonstration. A real system would assign admin roles outside public signup.

UI role guards are for user experience only. The backend enforces real permissions.

## Session storage

The default login uses `sessionStorage`. The **Remember me** option uses `localStorage`, which keeps the token after the browser closes. This is less secure on a shared device. Stored user data is limited to id, full name, and role.

## Backend limitations reflected in the UI

- Event filtering, search, and pagination run in the browser.
- Event create ignores published, so there is no event publish toggle.
- Deleting an event with registrations can fail.
- Announcement audio cannot be replaced through edit.
- Announcement duration is computed in the browser.
- Promo captions are generated from `caption_text`.
- Promo uploads accept MP4 only for reliable playback.
- Notifications have no mark-as-read or create endpoint.
- Normal users cannot fetch all event feedback or an average.
- Cancelled registrations cannot be created again.
- The users list has no pagination metadata, so search and paging run in the browser.
- Role changes are not supported.
- There is no public browsing.
