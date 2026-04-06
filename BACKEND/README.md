# StudyFlow Backend

This backend is responsible for handling the server-side logic, API endpoints, and database operations of the StudyFlow application.

---

## Folder Structure and Purpose

### config
Contains configuration files used by the system, such as database connection setup.

---

### controllers
Contains the main application logic. Controllers process incoming requests and return appropriate responses.

---

### routes
Defines the API endpoints of the application. Each route maps a URL to a specific controller function.

---

### models
Defines the structure of the data stored in the database. Each model represents a collection and its fields.

---

### middleware
Contains functions that run during request processing. These are used for authentication, validation, and error handling.

---

### utils
Contains reusable helper functions that support different parts of the application.

---

## Root Files

### server.js
The main entry point of the backend. It initializes the server, connects middleware, and registers all routes.

---

### .env
Stores environment variables such as database connection strings and secret keys.

---

### package.json
Contains project configuration, dependencies, and scripts required to run the backend.