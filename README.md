<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO"/>
  <img src="https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk"/>
</p>

<h1 align="center">🩸 RedGrid</h1>

<p align="center">
  <strong>A Real-Time Blood Donation Network</strong><br/>
  <em>Connecting Donors, Hospitals, and Organizations to Save Lives</em>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 🎯 What is RedGrid?

**RedGrid** is a full-stack blood donation management platform that creates a real-time network between:

- 🧑‍🤝‍🧑 **Donors** - Find nearby requests, accept them, and earn rewards
- 🏥 **Hospitals** - Manage blood inventory, broadcast emergency requests
- 🏢 **Organizations** - Organize donation camps and manage donor appointments

> **Mission:** No patient should suffer due to lack of blood availability or connection between blood banks.

---

## ✨ Features

### 🧑‍💻 For Donors

| Feature | Description |
|---------|-------------|
| **📍 Geo-Located Feed** | See blood requests within 50km of your location |
| **🎫 Digital Donation Tickets** | QR-coded tickets for hospital verification |
| **🏆 Gamified Rewards** | Earn Karma points, unlock badges (First Drop → Life Saver → Guardian → Legend) |
| **🔔 Real-Time Notifications** | Instant alerts when someone needs your blood type |
| **📜 Donation History** | Track all your donations with PDF certificates |
| **🔍 Find Blood** | Search hospitals/donors by city and blood group |

### 🏥 For Hospitals

| Feature | Description |
|---------|-------------|
| **📦 Inventory Management** | Track blood units by group (A+, B-, O+, etc.) |
| **📢 Broadcast Requests** | Instantly notify donors within 10km radius |
| **📋 Manage Requests** | Real-time status updates (Pending → Accepted → Fulfilled) |
| **📷 QR Scanner** | Verify donors by scanning their digital tickets |
| **📊 Activity Dashboard** | Live activity log with heatmap visualization |

### 🏢 For Organizations

| Feature | Description |
|---------|-------------|
| **⛺ Camp Management** | Create donation camps with location, date, and eligibility |
| **👥 Donor Appointments** | Manage scheduled donor visits |
| **✅ Verify Donations** | Mark donations as complete and award points |

### 🔧 Platform Features

- ⚡ **Real-Time Updates** via Socket.IO (no page refresh needed)
- 🔐 **Secure Authentication** with Clerk (Email, Google, GitHub)
- 🗺️ **Interactive Maps** with Leaflet for location visualization
- 📱 **Fully Responsive** - Works on mobile, tablet, and desktop
- 🌙 **Dark Mode** - Beautiful zinc-themed dark UI

---

## 🛠️ Tech Stack

### Frontend
```
React 19 + Vite 7          → Ultra-fast development
Tailwind CSS 4             → Utility-first styling
Framer Motion              → Smooth animations
Zustand                    → Lightweight state management
React Router 7             → Client-side routing
Socket.IO Client           → Real-time updates
Leaflet + React-Leaflet    → Interactive maps
Clerk React                → Authentication UI
```

### Backend
```
Node.js + Express 5        → REST API server
MongoDB + Mongoose 9       → Database & ODM
Socket.IO 4                → WebSocket server
Clerk SDK                  → Auth verification
Nodemailer                 → Email notifications
PDFKit                     → Certificate generation
Winston                    → Logging
Zod                        → Schema validation
```

### Infrastructure
```
MongoDB Atlas              → Cloud database
Clerk                      → Authentication provider
Render / Vercel            → Deployment
Supabase                   → File storage (optional)
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Clerk account (for authentication)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/redgrid.git
cd redgrid
```

### 2️⃣ Setup Backend

```bash
cd backend
npm install
```

Create `.env` file:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://your-connection-string

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

Start the server:

```bash
npm run dev
```

### 3️⃣ Setup Frontend

```bash
cd frontend
npm install
```

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

Start the dev server:

```bash
npm run dev
```

### 4️⃣ Open the App

Visit `http://localhost:5173` and sign up as a Donor, Hospital, or Organization!

---

## 📡 API Reference

### Authentication
All protected routes require `Authorization: Bearer <clerk_token>` header.

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Requests** |||
| `POST` | `/api/requests` | Create broadcast blood request |
| `POST` | `/api/requests/direct` | Send P2P request to specific user |
| `PUT` | `/api/requests/:id/accept` | Donor accepts a request |
| `PUT` | `/api/requests/:id/reject` | Donor rejects a P2P request |
| `PUT` | `/api/requests/:id/fulfill` | Mark request as completed |
| `PUT` | `/api/requests/:id/cancel` | Cancel a request |
| `GET` | `/api/requests/feed` | Get nearby pending requests |
| `GET` | `/api/requests/user` | Get user's incoming/outgoing requests |
| **Donations** |||
| `POST` | `/api/donations/verify` | Verify donation via QR scan |
| `GET` | `/api/donations/my-stats` | Get donor statistics |
| `GET` | `/api/donations/certificate/:id` | Download PDF certificate |
| **Inventory** |||
| `GET` | `/api/inventory` | Get hospital blood inventory |
| `PUT` | `/api/inventory` | Update blood unit counts |
| **Search** |||
| `GET` | `/api/search/availability` | Search blood by city/group |
| **Notifications** |||
| `GET` | `/api/notifications` | Get user notifications |
| `PUT` | `/api/notifications/read-all` | Mark all as read |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join` | Client → Server | Join user's notification room |
| `notification` | Server → Client | New notification (request, status update) |
| `request_update` | Server → All | Global feed refresh signal |
| `inventory_update` | Server → Client | Blood inventory changed |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Donor     │  │  Hospital   │  │     Organization        │  │
│  │  Dashboard  │  │  Dashboard  │  │      Dashboard          │  │
│  │  • Hub      │  │  • Inventory│  │  • Camp Management      │  │
│  │  • Tickets  │  │  • Requests │  │  • Appointments         │  │
│  │  • History  │  │  • Scanner  │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                            │                                     │
│               ┌────────────┴────────────┐                       │
│               │     SocketContext       │                       │
│               │  (Real-time Updates)    │                       │
│               └────────────┬────────────┘                       │
└────────────────────────────│────────────────────────────────────┘
                             │ WebSocket + REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND (Express)                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      Socket.IO                          │    │
│  │              (Notification Broadcasting)                │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐    │
│  │ Request │  │Donation │  │Inventory│  │  Notification   │    │
│  │ Routes  │  │ Routes  │  │ Routes  │  │    Routes       │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └───────┬─────────┘    │
│       └────────────┴────────────┴───────────────┘               │
│                            │                                     │
│               ┌────────────┴────────────┐                       │
│               │      MongoDB Atlas      │                       │
│               │  Users, Requests, etc.  │                       │
│               └─────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
redgrid/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, validation
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Socket, email, helpers
│   └── server.js            # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios instance
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React contexts (Socket)
│   │   ├── pages/           # Route pages
│   │   │   ├── donor/       # Donor views
│   │   │   ├── hospital/    # Hospital views
│   │   │   └── org/         # Organization views
│   │   ├── store/           # Zustand stores
│   │   └── App.jsx          # Main app component
│   └── index.html
│
└── README.md
```

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style
- Write meaningful commit messages
- Test your changes before submitting PR
- Update documentation if needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Clerk](https://clerk.com) for authentication
- [Leaflet](https://leafletjs.com) for maps
- [Lucide](https://lucide.dev) for icons
- [Tailwind CSS](https://tailwindcss.com) for styling

---

<p align="center">
  <strong>Made with ❤️ to save lives</strong><br/>
  <em>Every drop counts.</em>
</p>
