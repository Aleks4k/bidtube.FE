# 🎬 BidTube — Frontend

> Angular 18 client for the BidTube auction platform. Built with PrimeNG, real-time SignalR notifications, Google OAuth, and full dark/light theme support.

**Backend repo:** [bidtube API](https://github.com/Aleks4k/bidtube)

---

## 📸 Screens

### Login
![Login](https://i.imgur.com/pxJW5UG.png)

### Home — Auction Feed
![Home](https://i.imgur.com/vwnDr4p.png)  
![Home](https://i.imgur.com/unoFHrq.png)  
![Home](https://i.imgur.com/0MgtVFY.png)  
![Home](https://i.imgur.com/6H5wWY4.png)

### Auction photo
![Create Auction](https://i.imgur.com/7if3DpN.png)

### Profile
![Profile](https://i.imgur.com/TNcY4Qd.png)

---

## 🗺️ Routes

| Path | Component | Auth |
|---|---|---|
| `/login` | Login | 🔓 Public (redirects if logged in) |
| `/register` | Register | 🔓 Public |
| `/google-password-reset` | Google Password Reset | 🔓 Public |
| `/home` | Main Auction Feed | 🔒 Guard |
| `/post_auction` | Create Auction | 🔒 Guard |
| `/notifications` | Notifications | 🔒 Guard |
| `/profile/edit` | General Account Info | 🔒 Guard |
| `/profile/password` | Change Password | 🔒 Guard |
| `**` | 404 Not Found | — |

---

## 🏗️ Project Structure

```
src/app/
├── views/                    # Page-level components
│   ├── root/                 # App shell (navbar, footer, router-outlet)
│   ├── main/                 # Auction feed with category sidebar & pagination
│   ├── login/                # Login form + Google Sign-In
│   ├── register/             # Registration form
│   ├── make-auction/         # Create auction form (with image cropper)
│   ├── notifications/        # Notification list with virtual scroller
│   ├── profile/
│   │   ├── child/general-account-informations/
│   │   └── child/reset-password/
│   ├── google-password-reset/
│   └── not-found/            # 404 page
├── elements/                 # Reusable components
│   ├── auction/              # Auction card
│   ├── notification/         # Notification item
│   ├── galleria/             # Image gallery
│   └── go-back-button/
├── services/
│   ├── api.service.ts        # HTTP calls to backend
│   ├── auth.service.ts       # Token management (access + refresh)
│   ├── auth.guard.service.ts # Route guards
│   ├── hub.service.ts        # SignalR connection
│   ├── store.service.ts      # Shared state
│   ├── theme.service.ts      # Dark / light theme
│   └── quill.service.ts      # Lazy Quill editor loader
├── helpers/
│   └── token.interceptor.ts  # Attaches JWT to every request
└── models/                   # TypeScript interfaces
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Angular CLI](https://angular.io/cli) v18

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aleks4k/bidtube.FE.git
   cd bidtube.FE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the API URL**

   Update `src/app/environments/environment.ts`:
   ```ts
   export const environment = {
     production: false,
     apiUrl: 'https://localhost:5001/api'
   };
   ```

4. **Start the dev server**
   ```bash
   ng serve
   ```

   Open `http://localhost:4200` in your browser.

---

## 🔐 Authentication Flow

The app uses a dual JWT token strategy matching the backend:

- On login, an **access token** and **refresh token** are stored.
- The `TokenInterceptor` automatically attaches the access token to every outgoing HTTP request.
- When the access token expires, `AuthService` calls `POST /api/user/refresh` transparently.
- For SignalR, the access token is passed as a query parameter: `/hub?access_token=<token>`.
- Google OAuth is handled via the Google Identity Services script with a hidden credential input.

---

## ⚡ Real-Time Features (SignalR)

`HubService` connects to the backend `/hub` endpoint on login. The hub pushes:

- **New bid notifications** — when someone bids on your auction
- **Outbid notifications** — when you are outbid
- **Auction end notifications** — when an auction you participated in ends

The navbar notification badge updates live without any polling.

---

## 🎨 Theming

The app supports **dark and light modes**, toggled via the navbar button. Themes are defined in:

- `src/dark.scss`
- `src/light.scss`

`ThemeService` swaps the active PrimeNG theme stylesheet at runtime and persists the preference.

---

## 🧱 Tech Stack

| Technology | Purpose |
|---|---|
| Angular 18 | SPA framework |
| PrimeNG 17 + PrimeFlex | UI component library + CSS utilities |
| @microsoft/signalr | Real-time hub client |
| Quill | Rich text editor (auction description) |
| ngx-image-cropper | Client-side image cropping before upload |
| ngx-countdown | Auction countdown timers |
| jsonwebtoken | Client-side JWT decoding |
| HammerJS | Touch gesture support |

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add: your feature"`
4. Push and open a Pull Request

---

## 📄 License

Licensed under the terms in [LICENSE.txt](./LICENSE.txt).

---

## 👤 Author

**Aleks4k** — [@Aleks4k](https://github.com/Aleks4k)
