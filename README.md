# Feedback Hub Application

## Overview
The Feedback Hub Application is a web-based solution for collecting and managing user feedback. It consists of two main components:

- **Frontend:** Provides a public interface for users to submit feedback (including optional screenshots) and implements rate limiting and basic validation.
- **Backend:** Offers an administrative panel for managing feedback submissions, handling user authentication, and synchronizing data with the frontend.

## Architecture
- **Frontend:**
  - Built with FastAPI, HTML, CSS (Bootstrap), and JavaScript.
  - Exposes REST API endpoints for submitting feedback, retrieving new entries, and managing screenshots.
  - Stores feedback data and uploaded screenshots in local directories.
  - Implements client-side rate limiting and supports file uploads via clipboard or file input.

- **Backend:**
  - Developed with FastAPI and SQLAlchemy for ORM-based database interactions.
  - Provides an admin panel with session-based authentication and various management endpoints (update status, delete, sync feedback, etc.).
  - Synchronizes feedback entries and screenshots from the frontend, compressing images using the Pillow library.
  - Uses basic cookie-based session management (with potential for enhancement via signing or JWT).

- **Database:**
  - Uses PostgreSQL, deployed via Docker Compose.
  - The database service is configured with environment variables and persists data using Docker volumes.
