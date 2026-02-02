# 🚀 CRM System - Customer Relationship Management

<div align="center">
  
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
  ![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

  **A modern, full-stack CRM application built with cutting-edge technologies**

  [Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Architecture](#-architecture) • [Screenshots](#-screenshots)

</div>

---

## 📌 Features

### 👥 Customer Management
- Complete CRUD operations (Create, Read, Update, Delete)
- Customer status tracking (Lead, Active, Inactive)
- Contact information management
- Search and filter capabilities

### 💼 Deal Pipeline
- Track sales opportunities
- Multiple deal stages (Lead → Qualified → Proposal → Negotiation → Closed)
- Deal value and probability tracking
- Link deals to customers
- Win rate analytics

### ✅ Task Management
- Create and assign tasks
- Priority levels (Low, Medium, High)
- Task types (Call, Email, Meeting, Follow-up)
- Due date tracking
- Status management (Pending, In Progress, Completed)

### 📊 Dashboard & Analytics
- Real-time statistics
- Customer metrics (Total, Active, Inactive)
- Deal analytics (Total value, Won deals, Win rate)
- Task overview (Pending, Completed)
- Recent activities feed
- Visual data representation

### 🔐 Security
- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Secure token storage
- Role-based access control

### 📱 User Experience
- Fully responsive design
- Modern, clean UI with Tailwind CSS
- Smooth animations and transitions
- Mobile-friendly sidebar navigation
- Real-time form validation

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library with Hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with interceptors
- **React Icons** - Beautiful icon library
- **date-fns** - Modern date utility library

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Fast, minimalist web framework
- **TypeScript** - Static type checking
- **MongoDB** - NoSQL database
- **Mongoose** - Elegant MongoDB object modeling
- **JWT** - Secure authentication tokens
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher) - [Download](https://nodejs.org/)
- MongoDB (local or Atlas) - [Setup Guide](https://www.mongodb.com/docs/manual/installation/)
- npm or yarn package manager
- Git (for cloning)

### Quick Start

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd crm
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev
```

3. **Frontend Setup** (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

📖 **Detailed setup instructions available in [SETUP_GUIDE.md](SETUP_GUIDE.md)**

## �️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CRM Application                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────┐          ┌─────────────────────┐
│      Frontend       │          │      Backend        │
│   React + Vite      │  ◄────►  │  Express + Node.js  │
│   TypeScript        │   REST   │   TypeScript        │
│   Tailwind CSS      │   API    │   JWT Auth          │
└─────────────────────┘          └──────────┬──────────┘
                                            │
                                            ▼
                                 ┌────────────────────┐
                                 │     MongoDB        │
                                 │  + Mongoose ODM    │
                                 └────────────────────┘
```

## 🌟 Project Structure

```
crm/
├── backend/                    # Node.js Backend
│   ├── src/
│   │   ├── config/            # Database connection
│   │   ├── controllers/       # Business logic
│   │   │   ├── authController.ts
│   │   │   ├── customerController.ts
│   │   │   ├── dealController.ts
│   │   │   ├── taskController.ts
│   │   │   └── dashboardController.ts
│   │   ├── middleware/        # Authentication
│   │   │   └── auth.ts
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── User.ts
│   │   │   ├── Customer.ts
│   │   │   ├── Deal.ts
│   │   │   └── Task.ts
│   │   ├── routes/            # API endpoints
│   │   │   ├── authRoutes.ts
│   │   │   ├── customerRoutes.ts
│   │   │   ├── dealRoutes.ts
│   │   │   ├── taskRoutes.ts
│   │   │   └── dashboardRoutes.ts
│   │   ├── types/             # TypeScript types
│   │   └── server.ts          # Entry point
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── Layout.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── StatCard.tsx
│   │   ├── context/           # React Context
│   │   │   └── AuthContext.tsx
│   │   ├── pages/             # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Customers.tsx
│   │   │   ├── Deals.tsx
│   │   │   └── Tasks.tsx
│   │   ├── services/          # API integration
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── customerService.ts
│   │   │   ├── dealService.ts
│   │   │   ├── taskService.ts
│   │   │   └── dashboardService.ts
│   │   ├── types/             # TypeScript interfaces
│   │   ├── App.tsx            # Main app component
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── README.md                   # This file
├── SETUP_GUIDE.md             # Detailed setup instructions
├── ARCHITECTURE_EXPLAINED.md  # Architecture deep dive
└── .gitignore
```

## 🎯 Learning Outcomes

This project demonstrates mastery of:

### Full-Stack Development
- ✅ Building RESTful APIs with Express
- ✅ Frontend-Backend integration
- ✅ Authentication & Authorization
- ✅ Database design and relationships

### TypeScript
- ✅ Type-safe code in both frontend and backend
- ✅ Interfaces and type definitions
- ✅ Generic types and utility types

### React Ecosystem
- ✅ Modern React with Hooks
- ✅ Context API for state management
- ✅ React Router for navigation
- ✅ Component composition patterns

### Database & Backend
- ✅ MongoDB schema design
- ✅ Mongoose ODM usage
- ✅ Data validation and relationships
- ✅ Aggregation pipelines

### Security
- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Protected API routes
- ✅ Input validation

### DevOps & Tools
- ✅ Environment variables management
- ✅ Git version control
- ✅ Modern build tools (Vite)
- ✅ Package management

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Step-by-step installation guide
- **[ARCHITECTURE_EXPLAINED.md](ARCHITECTURE_EXPLAINED.md)** - In-depth architecture explanation

## 🔗 API Endpoints

### Authentication
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login user
GET    /api/auth/me          - Get current user
```

### Customers
```
GET    /api/customers        - Get all customers
GET    /api/customers/:id    - Get single customer
POST   /api/customers        - Create customer
PUT    /api/customers/:id    - Update customer
DELETE /api/customers/:id    - Delete customer
```

### Deals
```
GET    /api/deals           - Get all deals
GET    /api/deals/:id       - Get single deal
POST   /api/deals           - Create deal
PUT    /api/deals/:id       - Update deal
DELETE /api/deals/:id       - Delete deal
GET    /api/deals/stats     - Get deal statistics
```

### Tasks
```
GET    /api/tasks           - Get all tasks
GET    /api/tasks/:id       - Get single task
POST   /api/tasks           - Create task
PUT    /api/tasks/:id       - Update task
DELETE /api/tasks/:id       - Delete task
```

### Dashboard
```
GET    /api/dashboard/stats      - Get dashboard statistics
GET    /api/dashboard/activities - Get recent activities
```

## 🚀 Deployment

### Backend (Heroku/Railway/Render)
1. Set environment variables
2. Push to deployment platform
3. Ensure MongoDB connection

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy `dist` folder
3. Set API base URL

## 🤝 Contributing

This is a portfolio project, but suggestions and feedback are welcome!

## 📄 License

MIT License - feel free to use this project for learning purposes

## 📧 Contact

Created as a portfolio project to demonstrate full-stack development skills

---

<div align="center">
  
**⭐ If you found this project helpful, please consider giving it a star! ⭐**

Built with ❤️ using React, TypeScript, Node.js, and MongoDB

</div>
