# Feedback Hub Backend

## Overview
The Feedback Hub Backend is the administrative component of the Feedback Hub Application. 
It is responsible for managing the feedback submitted via the frontend. The backend handles 
user authentication, status updates, and synchronization of feedback entries (including 
screenshots) from the frontend. Administrators can view, update, and delete feedback 
through an intuitive admin panel.

<a href="../assets/backend_filled.jpg" target="_blank"><img src="../assets/backend_filled.jpg" alt="Backend Screenshot" width="50%"></a>

## Tech Stack
- **Framework:** FastAPI (Python)
- **Database & ORM:** PostgreSQL and SQLAlchemy
- **Authentication:** Session-based authentication with cookie management
- **Image Processing:** Pillow (for compressing and handling screenshots)
- **Web Server:** Uvicorn

## Setup & Running

### Prerequisites
- Python 3.8+
- Git
- A PostgreSQL database

### Database Setup
A PostgreSQL database is required. A `docker-compose.yml` file is provided in the `db`
folder for a quick setup using Docker. To start the database, navigate to the `db`
folder and run: docker-compose up -d This will spin up a PostgreSQL container with
the necessary environment variables and persistent storage.

### Installation Steps
1. ** Clone the Repository and Navigate to the Backend Directory:**
    ```bash
    git clone <repository_url> cd backend
	```

2. **Set Up the Virtual Environment (Optional but Recommended):**
    ```bash
    python -m venv venv source venv/bin/activate      # On Windows use: venv\Scripts\activate
    ```

3. **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4. **Configuration:**
    - Review and update `config_backend.json` with your settings (database URL, frontend URL, 
	API key, etc.). - Ensure that the `users.json` file contains valid user credentials and 
	that passwords are properly hashed.
	- Example config_backend.json:
	```
	{
      "database_url": "postgresql://DB_HOST:DB_PASSWORD/feedback_db",
      "frontend_url": "http://HOSTNAME:8000",
      "secret_key": "any_secret_key_you_like_but_the_same_for_frontend_and_backend"
    }
    ```

### Running the Application
    - **On Unix-based Systems:**
    ```bash
	./start_backend.sh
    ```
	
	- **On Windows (PowerShell):**
    ```bash
	.\start_backend.ps1
    ```

	- **Alternatively, run directly with Uvicorn:**
    ```bash
	uvicorn main_backend:app --host 0.0.0.0 --port 8001 --reload
    ```
	
With default settings the application will be accessible at: 
[http://localhost:8001/](http://localhost:8001/).

### Running the Application with Docker
- ** Starting:**
    ```bash
    docker compose up --build     # add --detach to start 'detached' from your current shell
	```
- ** Stopping:**
    ```bash
	docke compose down     # add -v to remove all artifacts (volumes, services, ...)
	```
	
### Known problems
- ** Access to frontend: **
If you are getting Error 500 when trying to sync, make sure that your docker container can resolve
and connect to the value you have set in frontend_url in you config_frontend.json