# Music Mimic

## Spotify UI

A a music search app utilizing Spotify's REST Web API.

<!-- Comments -->

## Project Overview

<!-- This section of your README should contain the description of your project, features, and functionality. -->

Application built for Full Sail University WDV339 Web Development Course.

### App Requirements

- **UI Design**: The UX/UI of the application utilizing design created in week 1.
- **Login Screen**: Screen displayed if no JWT is stored in the database to use the Spotify API.
- **Search Screen**: Screen user is taken to if a JWT exists and isn't expired then user doesn't need to login, and is immediately taken to the search page.
- **No Results Message**: A "no results" message if no search is performed, or API call returned with no results.
- **Thumbnails to Links**: Each result thumbnail links out to a Spotify web player link.
- **Decoupled**: Frontend application is decoupled from backend application then handles JWTs.
- **Secrets**: All application secret credentials are not be viewable in the repository.

---

## Prerequisites

Before setting up the project locally, ensure you have the following software installed:

- **Node.js** (v18.0.0 or higher recommended)
- **npm** (Comes pre-packaged with Node.js)
- **MySQL Server** (Ensure the system service is active)

---

## Getting Started

<!--The Getting Started section of any README file normally contains all of the instructions for a developer to get a working version of your project up and running. -->

Follow these simple steps to get a local copy up and running.

### Installation

### 1. Clone the repository and navigate into the project directory:

```bash
git clone <your-repository-url>
cd <your-project-name>
```

### 2. Install dependencies:

- express, sequelize, ejs, mysql2
  ```bash
  npm install express sequelize ejs mysql2
  ```
- sequelize-cli, nodemon
  ```bash
  npm install --save-dev sequelize-cli nodemon
  ```

### 3. Configure the Environment

Create a `.env` file in the project's **root directory** and add your local configuration variables:

```env
# Database Settings
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=<your-project-name>

# Web Server Settings
PORT=3001
```

- Note: PORT=3000 is for your Express web server, while DB_PORT=3001 is strictly for your MySQL database connection
- Note: This project uses a custom src/ directory layout managed by the .sequelizerc file. Make sure you update the Sequelize config file:
  - In config/ change config.json to a config.js file.
  - In models/index.js make sure to change config.json to a config.js as well.

### 4. Setup DB structure:

```bash
npx sequelize-cli db:create
npx sequelize-cli db:migrate
```

### 5. Start the Application

- **Development Mode:**

  ```bash
  npm run dev
  ```

- **Production Mode:**

  ```bash
  npm start
  ```

Once started, open your web browser and navigate to: **`http://localhost:3001`**

---

## Links

<!--This section of your README contains a list of important links such as local build URLs such as localhost:3000, staging links, etc.-->

- **API Documentation:** [Spotify Web API Documentation](https://spotify.com)

## Contact

Miranda Quinene - mequinene@student.fullsail.edu

Project Link: [https://github.com/QuineneMiranda-FS/musicmimic.git](https://github.com/QuineneMiranda-FS/musicmimic.git)
