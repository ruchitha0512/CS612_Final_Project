# CS612 Final Project - Social Media Application

A full-stack social media application built with React, Node.js, Express, and MySQL.

## Features

- 👤 User authentication (signup/login)
- 📝 Create, read, update, and delete posts
- 🖼️ Image upload functionality
- 💟 Like and comment on posts
- 🏷️ Tag system for posts
- 📱 Responsive design
- 👤 User profiles
- 📊 Trending tags

## Tech Stack

### Frontend
- React
- Tailwind CSS
- Lucide React (icons)
- React Query
- Context API for state management

### Backend
- Node.js
- Express
- MySQL
- JWT for authentication
- Multer for file uploads
- Bcrypt for password hashing

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- MySQL (v8.0 or higher)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ruchitha0512/CS612_Final_Project.git
cd CS612_Final_Project
```

### 2. Backend Setup

Navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the server directory:

```env
JWT_SECRET=your_jwt_secret_here
```

Update MySQL connection settings in `server.js` if needed (currently configured for local development):

```javascript
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'social_app'
});
```

Create the MySQL database:

```sql
CREATE DATABASE social_app;
```

Start the server:

```bash
node server.js
```

The server will run on `http://localhost:5001`

### 3. Frontend Setup

In a new terminal, navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthModal.jsx
│   │   │   ├── ContentFeed.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── SearchBar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
│
└── server/
    ├── uploads/
    ├── server.js
    ├── package.json
    └── .env
```

## Common Issues and Solutions

### Backend Issues

1. **Database Connection Error**
   - Check if MySQL is running
   - Verify database credentials in `server.js`
   - Ensure `social_app` database exists

2. **Upload Directory Error**
   - Create an `uploads` directory in the server folder if it doesn't exist
   - Ensure proper write permissions

### Frontend Issues

1. **API Connection Error**
   - Check if backend server is running on port 5001
   - Ensure you're using the correct API URLs in the frontend code

2. **Image Upload Issues**
   - Check file size (max 5MB)
   - Ensure valid image format (JPG, PNG, GIF)
   - Check if `uploads` directory exists and has proper permissions

## Using the Application

1. Start both the backend and frontend servers
2. Create a new account via the signup form
3. Log in with your credentials
4. Create posts with text, images, and tags
5. Interact with posts through likes and comments
6. View and edit your profile

## Available Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production

### Backend

- `npm start` - Start the server
