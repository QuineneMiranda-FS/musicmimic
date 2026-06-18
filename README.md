# Music Mimic

## Project Overview

An interactive music search application built for Full Sail University's **WDV339 Web Development** course. The application features a strictly decoupled architecture utilizing a Vite/Vue frontend and an Express/Sequelize backend.

### App Requirements

- **UI Design**: The UX/UI of the application utilizes custom designs created in Week 1.
- **Login Screen**: Displayed automatically if no valid JSON Web Token (JWT) is stored to authenticate and access the backend.
- **Search Screen**: Users are automatically routed here if a valid, unexpired JWT exists, bypassing the login page entirely.
- **No Results Message**: Displays an informative message if no search has been performed yet, or if the API call returns empty.
- **Thumbnails to Links**: Each track result thumbnail acts as a direct link out to its corresponding Spotify web player page.
- **Decoupled Architecture**: The frontend application (Vite + Vue) is strictly separated from the backend API (Express + Sequelize) handling authentication.
- **Secrets Management**: All sensitive API keys, database credentials, and signing secrets are completely hidden from the public repository using environment variables.
- **Lyrics Scraping**: Uses the Genius API alongside Cheerio to dynamically fetch, parse, and clean song lyrics on the server side.

---

## Prerequisites

Before setting up the project locally, ensure you have the following software installed:

- **Node.js** (v18.0.0 or higher recommended)
- **npm** (comes bundled with Node.js)
- **MySQL Server** (Ensure the system service is active and running on port 3306)

---

## Getting Started

Follow these steps to set up both the backend API and frontend application locally.

### 1. Clone the Repository

Clone the project and navigate into your root project folder:

```bash
git clone <your-repository-url>
cd <your-project-name>
```

### 2. Backend Setup (Express & Sequelize API)

Navigate to the backend folder, install your dependencies, and configure your environment secrets.

```bash
cd backend
npm install express sequelize mysql2 jsonwebtoken axios dotenv cheerio
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

# Genius API Credentials
GENIUS_ACCESS_TOKEN=your_genius_access_token_here
```

> **Note:** This project uses a custom `src/` layout managed by a `.sequelizerc` file inside the backend directory. Ensure your `config/config.js` and `models/index.js` point properly to these environment variables.

#### Initialize Database Structure

Run the following commands while still inside the `backend/` directory to create and migrate your schema:

```bash
npx sequelize-cli db:create
npx sequelize-cli db:migrate
```

## Populating Mood Ring Mock Data

> **Note:** Because the application binds mock history records to a real user account, you need to finish the Frontend Setup and Running the Application steps below.

Once app is fired up, return to your backend terminal and run the seeder:

```bash
npx sequelize-cli db:seed:all
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

> **Note:** Vite requires frontend environment variables to be prefixed with `VITE_` to protect your application from leaking backend secrets to the browser client.

### 4. Install Local AI

Open a terminal window and download Ollama to power the LLM (local language model) layer:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

---

## Running the Application

Because this application features a strictly decoupled architecture, you must run your local services simultaneously using three separate terminal windows.

### Terminal Window 1: Start Ollama

Boot up your local AI engine:

```bash
ollama run llama3
```

_The Ollama local service will look for `llama3` (it will download it on the first run if missing) and listen on:_ **`http://127.0.0.1:11434`**

### Terminal Window 2: Start Backend API Server

```bash
cd backend
npm run dev
```

_The backend REST API service will listen on:_ **`http://127.0.0.1:3000`**

### Terminal Window 3: Start Frontend Application Server

```bash
cd frontend
npm run dev
```

_The Vite engine will compile locally and serve on:_ **`http://127.0.0.1:5173`**

Once all services are running, open your web browser and navigate directly to the Vite frontend URL (**`http://127.0.0.1:5173`**) to launch the app.

---

## Links

- **API Documentation:** [Spotify Web API Documentation](https://developer.spotify.com)
- **Spotify Design Documentation:** [Spotify Design Guidelines](https://developer.spotify.com/documentation/design)
- **Lyrics Source & API:** [Genius Developer Portal](https://genius.com) (To register and generate your `GENIUS_ACCESS_TOKEN`)
- **Local AI Engine:** [Ollama Official Website](https://ollama.com) (For local LLM setup instructions)

## Contact

Miranda Quinene - mequinene@student.fullsail.edu

Project Link: [https://github.com/QuineneMiranda-FS/musicmimic.git](https://github.com/QuineneMiranda-FS/musicmimic.git)
