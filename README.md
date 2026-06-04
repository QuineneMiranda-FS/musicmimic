# Music Mimic

## Spotify UI

A music search app utilizing Spotify's REST Web API.

## Project Overview

Application built for Full Sail University WDV339 Web Development Course.

### App Requirements

- **UI Design**: The UX/UI of the application utilizing design created in week 1.
- **Login Screen**: Screen displayed if no JWT is stored to use the Spotify API.
- **Search Screen**: Screen user is taken to if a JWT exists and isn't expired, bypassing the login page directly to the search page.
- **No Results Message**: A "no results" message if no search is performed, or API call returned with no results.
- **Thumbnails to Links**: Each result thumbnail links out to a Spotify web player link.
- **Decoupled**: Frontend application (Vite + Vue) is strictly decoupled from the backend application (Express + Sequelize) that handles JWTs.
- **Secrets**: All application secret credentials are not viewable in the repository.

---

## Prerequisites

Before setting up the project locally, ensure you have the following software installed:

- **Node.js** (v18.0.0 or higher recommended)
- **npm** (comes bundled with Node.js)
- **MySQL Server** (Ensure the system service is running active on port 3306)

---

## Getting Started

Follow these steps to set up both the backend API and frontend application locally.

### 1. Clone the repository and navigate into the project directory:

```bash
git clone <your-repository-url>
cd <your-project-name>
```

### 2. Backend Setup (Express & Sequelize API)

Navigate to the backend folder, install dependencies, and configure environment secrets.

```bash
cd backend
npm install express sequelize mysql2 jsonwebtoken axios dotenv
npm install --save-dev sequelize-cli nodemon
```

#### Configure Backend Environment

Create a `.env` file inside the `backend/` directory:

```env
# Server Configuration
PORT=3000

# Database Settings
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=music_mimic_db

# JWT Security Settings
JWT_SECRET=your_random_secret_string_here
JWT_EXPIRES_IN=1h

# Spotify Developer API Credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/spotify/callback
```

_Note: This project uses a custom `src/` layout managed by a `.sequelizerc` file inside the backend directory. Ensure your `config/config.js` and `models/index.js` point to these environment variables._

#### Initialize Database Structure

Run the following commands while still inside the `backend/` directory:

```bash
npx sequelize-cli db:create
npx sequelize-cli db:migrate
```

### 3. Frontend Setup (Vite + Vue)

Open a new terminal window, navigate to the frontend folder, and install your build dependencies.

```bash
cd frontend
npm install
```

#### Configure Frontend Environment

Create a `.env` file inside the `frontend/` directory:

```env
# Frontend Environment Configuration
VITE_API_URL=http://127.0.0.1:3000
```

_Note: Vite requires frontend environment variables to be prefixed with `VITE_` to protect your application from leaking backend secrets to the browser client.\_

---

## Running the Application

Because this application features a strictly decoupled frontend and backend, you must run both servers concurrently using separate terminal windows. Note for self: debating concurrently...research that more.

### Start Backend API Server

```bash
cd backend
npm run dev
```

\*The backend REST API service will listen on: **`http://127.0.0.1:3000`\***

### Start Frontend Application Server

```bash
cd frontend
npm run dev
```

\*The Vite engine will be locally on: **`http://127.0.0.1:5173`\***

Open your web browser and navigate directly to the Vite frontend URL (**`http://127.0.0.1:5173`**) to launch.

---

## Links

- **API Documentation:** [Spotify Web API Documentation](https://developer.spotify.com)
- **Spotify Design Documentation:** [Spotify Design Guidelines](https://developer.spotify.com/documentation/design)

## Contact

Miranda Quinene - mequinene@student.fullsail.edu

Project Link: [https://github.com/QuineneMiranda-FS/musicmimic.git](https://github.com/QuineneMiranda-FS/musicmimic.git)
