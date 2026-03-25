# Mergington High School Activities API

A simple FastAPI application for browsing extracurricular activities, with teacher-only registration management.

## Features

- View all available extracurricular activities
- View current participants for each activity
- Teacher login backed by a JSON credentials file
- Teacher-only student registration and unregister actions

## Getting Started

1. Install the dependencies:

   ```
   pip install -r ../requirements.txt
   ```

2. Run the application:

   ```
   uvicorn app:app --reload --app-dir src
   ```

3. Open your browser and go to:
   - Application: http://localhost:8000/
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## Teacher Login

Sample teacher accounts are stored in `src/teachers.json`.

- Username: `mrodriguez`
  Password: `classroom-123`
- Username: `jpatel`
  Password: `teacher-portal`

## API Endpoints

| Method | Endpoint                                                              | Description                                      |
| ------ | --------------------------------------------------------------------- | ------------------------------------------------ |
| GET    | `/activities`                                                         | Get all activities and participant lists         |
| GET    | `/auth/status`                                                        | Return current teacher authentication state      |
| POST   | `/auth/login`                                                         | Start a teacher session                          |
| POST   | `/auth/logout`                                                        | End the current teacher session                  |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu`     | Register a student for an activity, teacher only |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Remove a student from an activity, teacher only  |

## Data Model

The application uses a simple in-memory activity catalog and a JSON-backed teacher credential list.

1. **Activities** - Uses activity name as identifier:
   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Teachers** - Stored in `src/teachers.json`:
   - Username
   - Display name
   - Password hash

Activity data is still stored in memory, which means registrations reset when the server restarts.
Teacher accounts persist because they are read from the JSON file.
