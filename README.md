# AttendX – Attendance Planner Dashboard

A premium, full-stack attendance management application built with Node.js, Express, and SQLite3.

## 🚀 Features
- **Dashboard**: Professional stats for attendance (Present, Leaves, Holiday, OT Hours).
- **Monthly Reporting**: Stats and daily records automatically refresh and filter for the selected calendar month.
- **Interactive Calendar**: Easy-to-use interface for selecting dates and marking attendance.
- **Secure Authentication**: User registration and login with encrypted passwords (bcrypt).
- **Persistent Storage**: Robust SQLite3 database for reliable data persistence.
- **Mobile First**: Fully optimized, responsive UI for a premium experience on all devices.

## 🛠 Tech Stack
- **Frontend**: HTML5, Vanilla CSS, JS
- **Backend**: Node.js, Express
- **Database**: SQLite3 (`better-sqlite3`)
- **Security**: bcrypt (password hashing), UUID (session tokens), dotenv (secure configuration)

## 📥 Getting Started

1. **Clone the Repo**:
   ```bash
   git clone <your-repo-url>
   cd attendance-planner
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```

4. **Run the App**:
   ```bash
   npm start
   ```

Open your browser at `http://localhost:3000`.

## 🔒 Security Best Practices
- **Data Privacy**: Your local database (`attendx.db`) and secret keys in `.env` are automatically excluded from the repository.
- **GitHub**: If you plan to store real user data, please ensure your repository is set to **Private**.

## 📱 Mobile Preview
The application is optimized for mobile viewports (375px+).
