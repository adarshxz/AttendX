# AttendX – Smart Attendance Planner 📅

**AttendX** is a modern full-stack web application designed to help individuals and professionals effortlessly track daily attendance, calculate overtime hours, manage leaves, and visualize monthly attendance metrics in real time.

---

## ✨ Features

- **Interactive Calendar**: Log daily status (Present, Absent, Half-day, Casual Leave) with a single click.
- **Overtime Tracker**: Record extra working hours with automated total calculations.
- **Monthly Analytics & Dashboard**: Real-time summaries of total present days, leaves taken, and overtime accrued.
- **Secure Authentication**: User registration and login powered by JSON Web Tokens (JWT) and bcrypt password hashing.
- **Cloud Database**: Persistent multi-user storage backed by MongoDB Atlas.
- **Modern UI / UX**: Responsive, clean interface crafted with React, Vite, Framer Motion, and Lucide icons.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling & Animations**: CSS / Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router v7
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js & Express 5
- **Database**: MongoDB (Mongoose ODM)
- **Security**: JWT (`jsonwebtoken`) & `bcryptjs`
- **CORS**: `cors` middleware

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/adarshxz/AttendX.git
cd AttendX
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the project root:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
VITE_API_URL=http://localhost:5000
```

### 4. Run the application

- **Start backend server:**
  ```bash
  npm run server
  ```

- **Start frontend development server:**
  ```bash
  npm run dev
  ```

---

## 📦 Build for Production

```bash
npm run build
```

---

## 📄 License
ISC
