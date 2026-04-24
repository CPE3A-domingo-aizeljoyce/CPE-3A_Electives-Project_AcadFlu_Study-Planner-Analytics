# StudyFlow: Complete Technical Documentation

**Project:** StudyFlow - Study Planner & Analytics Platform  
**Version:** 1.0.0  
**Last Updated:** April 2026  
**Developed by:** BS Computer Engineering Students, Bulacan State University

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [API Documentation](#api-documentation)
4. [Database Schema](#database-schema)
5. [Deployment Architecture](#deployment-architecture)
6. [Environment Setup](#environment-setup)
7. [Development Guidelines](#development-guidelines)

---

## Overview

A modern, frontend-focused web application designed to help students track their study habits, manage tasks, and visualize their productivity. This project was developed as an Electives Project by BS Computer Engineering students at Bulacan State University (BulSu).

### Features (Current Progress)
* **Interactive Dashboard:** Dynamic daily greetings and automated current dates.
* **Smart Task Scheduler:** Add and manage tasks with built-in date validation (blocks past dates).
* **Real-Time Analytics:** 
  * Live computation of Daily Productivity Score based on completed tasks.
  * Real-time Streak Tracking (adds +1 when a task is checked off today).
* **Visual Progress:** Weekly, monthly, and yearly study hour charts using Recharts.
* **Custom Subjects:** Pre-defined subject color-coding with an option to add "Others".

### Tech Stack
* **Framework:** React + Vite
* **Styling:** CSS / Tailwind (if applicable)
* **Icons:** Lucide-React
* **Charts:** Recharts

---

## System Architecture

### Overview

StudyFlow follows a modern three-tier architecture pattern with a React-based frontend, Node.js/Express backend, and MongoDB database.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React + Vite Frontend                        │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────┐  │   │
│  │  │  Pages         │  │  Components    │  │  API Layer │  │   │
│  │  │ - Dashboard    │  │ - Layout       │  │ - Services │  │   │
│  │  │ - Tasks        │  │ - TaskContext  │  │ - Clients  │  │   │
│  │  │ - Analytics    │  │ - Auth Mgmt    │  │            │  │   │
│  │  │ - Goals        │  │ - UI Elements  │  │            │  │   │
│  │  │ - Timer        │  │                │  │            │  │   │
│  │  │ - Notes        │  │                │  │            │  │   │
│  │  │ - Settings     │  │                │  │            │  │   │
│  │  └────────────────┘  └────────────────┘  └────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Node.js + Express Backend Server                 │   │
│  │  ┌────────────────┐  ┌────────────────┐                  │   │
│  │  │  Routes        │  │  Middleware    │                  │   │
│  │  │ - authRoutes   │  │ - Auth Guard   │                  │   │
│  │  │ - taskRoutes   │  │ - Error Handle │                  │   │
│  │  │ - goalRoutes   │  │ - Rate Limiter │                  │   │
│  │  │ - timerRoutes  │  │ - Validation   │                  │   │
│  │  │ - notesRoutes  │  └────────────────┘                  │   │
│  │  │ - settingsRoute│                                      │   │
│  │  │ - analyticsRt  │  ┌────────────────┐                  │   │
│  │  └────────────────┘  │  Controllers   │                  │   │
│  │                      │ - authControl  │                  │   │
│  │                      │ - taskControl  │                  │   │
│  │                      │ - goalControl  │                  │   │
│  │                      │ - analyticsCtrl│                  │   │
│  │                      │ - timerControl │                  │   │
│  │                      │ - notesControl │                  │   │
│  │                      └────────────────┘                  │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             ↓ MongoDB Driver
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            MongoDB Database                              │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │   │
│  │  │   Users    │ │   Tasks    │ │   Goals    │            │   │
│  │  │ Collection │ │ Collection │ │ Collection │            │   │
│  │  └────────────┘ └────────────┘ └────────────┘            │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │   │
│  │  │   Notes    │ │ StudySess. │ │Achieve.   │            │   │
│  │  │ Collection │ │ Collection │ │ Collection │            │   │
│  │  └────────────┘ └────────────┘ └────────────┘            │   │
│  │  ┌────────────┐ ┌────────────┐                           │   │
│  │  │ Settings   │ │ Analytics  │                           │   │
│  │  │ Collection │ │ Collection │                           │   │
│  │  └────────────┘ └────────────┘                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interactions

#### Frontend Components
- **Pages:** User-facing views (Dashboard, Tasks, Analytics, Goals, Timer, Notes, Settings, etc.)
- **Components:** Reusable UI elements and context providers
- **API Layer:** Service modules for communicating with the backend
- **State Management:** Context API (TaskContext) for global state

#### Backend Components
- **Routes:** HTTP endpoint definitions mapping to controllers
- **Controllers:** Business logic for processing requests
- **Models:** MongoDB schema definitions
- **Middleware:** Request/response processing (authentication, validation, error handling)
- **Utils:** Helper services for achievements, calculations, email, integrations

#### Data Flow
```
User Action → React Component → API Service → HTTP Request 
→ Express Route → Middleware → Controller → MongoDB 
→ Response → Component State Update → UI Render
```

---

## API Documentation

### Base URL
```
Production: https://studyflow-api.example.com/api
Development: http://localhost:5000/api
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### 1. Authentication Endpoints

#### Register User
```
POST /auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Login User
```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com"
  }
}
```

#### Verify Email
```
GET /auth/verify-email?token=verification_token_here

Response (200):
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### Google OAuth - Get URL
```
GET /auth/google/url

Response (200):
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

#### Google OAuth - Callback
```
GET /auth/google/callback?code=auth_code&state=state_param

Response (302 or 200):
Redirects to frontend with token in query or sets auth cookie
```

#### Google OAuth - Direct Login
```
POST /auth/google
Content-Type: application/json

Request:
{
  "tokenId": "google_id_token_here"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### Forgot Password
```
POST /auth/forgot-password
Content-Type: application/json

Request:
{
  "email": "user@example.com"
}

Response (200):
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### Reset Password
```
POST /auth/reset-password
Content-Type: application/json

Request:
{
  "token": "reset_token_from_email",
  "password": "newPassword123"
}

Response (200):
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### Get Current User
```
GET /auth/me
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Delete Account
```
DELETE /auth/delete-account
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "message": "Account deleted successfully"
}
```

### 2. Tasks Endpoints

#### Get All Tasks
```
GET /tasks?date=2026-04-24&subject=Mathematics&status=pending
Authorization: Bearer <jwt_token>

Query Parameters:
- date (optional): Filter by date (YYYY-MM-DD)
- subject (optional): Filter by subject
- status (optional): pending, completed, overdue
- limit (optional): Number of tasks to return (default: 50)
- page (optional): Pagination page (default: 1)

Response (200):
{
  "success": true,
  "tasks": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Complete Math Assignment",
      "description": "Chapter 5 problems 1-20",
      "dueDate": "2026-04-25",
      "subject": "Mathematics",
      "priority": "high",
      "status": "pending",
      "isCompleted": false,
      "completedAt": null,
      "createdAt": "2026-04-24T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 50
}
```

#### Create Task
```
POST /tasks
Content-Type: application/json
Authorization: Bearer <jwt_token>

Request:
{
  "title": "Complete Math Assignment",
  "description": "Chapter 5 problems 1-20",
  "dueDate": "2026-04-25",
  "subject": "Mathematics",
  "priority": "high",
  "estimatedHours": 2.5
}

Response (201):
{
  "success": true,
  "task": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Complete Math Assignment",
    ...
  }
}
```

#### Get Task by ID
```
GET /tasks/:id
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "task": { ... }
}
```

#### Update Task
```
PUT /tasks/:id
Content-Type: application/json
Authorization: Bearer <jwt_token>

Request:
{
  "title": "Updated Title",
  "description": "Updated description",
  "priority": "medium"
}

Response (200):
{
  "success": true,
  "task": { ... }
}
```

#### Delete Task
```
DELETE /tasks/:id
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "message": "Task deleted successfully"
}
```

#### Toggle Task Completion
```
PATCH /tasks/:id/toggle
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "task": {
    "isCompleted": true,
    "completedAt": "2026-04-24T14:30:00Z"
  }
}
```

#### Update Task Status
```
PATCH /tasks/:id/status
Content-Type: application/json
Authorization: Bearer <jwt_token>

Request:
{
  "status": "completed"
}

Response (200):
{
  "success": true,
  "task": { ... }
}
```

### 3. Study Timer Endpoints

#### Start Timer
```
POST /study-timer/start
Content-Type: application/json
Authorization: Bearer <jwt_token>

Request:
{
  "taskId": "507f1f77bcf86cd799439011",
  "subject": "Mathematics",
  "duration": 30,
  "notes": "Working on algebra problems"
}

Response (201):
{
  "success": true,
  "session": {
    "_id": "507f1f77bcf86cd799439012",
    "taskId": "507f1f77bcf86cd799439011",
    "subject": "Mathematics",
    "duration": 30,
    "startTime": "2026-04-24T14:00:00Z",
    "status": "active"
  }
}
```

#### Get Active Timer
```
GET /study-timer/active
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "session": {
    "_id": "507f1f77bcf86cd799439012",
    "subject": "Mathematics",
    "status": "active",
    "elapsedTime": 300
  }
}
```

#### Pause Timer
```
PATCH /study-timer/:id/pause
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "session": {
    "status": "paused",
    "pausedAt": "2026-04-24T14:05:00Z"
  }
}
```

#### Resume Timer
```
PATCH /study-timer/:id/resume
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "session": {
    "status": "active"
  }
}
```

#### Stop Timer
```
PATCH /study-timer/:id/stop
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "session": {
    "status": "completed",
    "endTime": "2026-04-24T14:30:00Z",
    "totalDuration": 1800
  }
}
```

#### Get Timer History
```
GET /study-timer?startDate=2026-04-01&endDate=2026-04-30&subject=Mathematics
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "sessions": [ ... ],
  "total": 25,
  "totalHours": 12.5
}
```

#### Get Timer Statistics
```
GET /study-timer/stats
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "stats": {
    "todayHours": 2.5,
    "weekHours": 15.3,
    "monthHours": 45.8,
    "averagePerDay": 2.1,
    "mostStudiedSubject": "Mathematics",
    "totalSessions": 150
  }
}
```

### 4. Goals Endpoints

#### Get All Goals
```
GET /goals?status=active&priority=high
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "goals": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Achieve 90% in Math",
      "description": "Score 90+ in all math exams",
      "targetDate": "2026-06-30",
      "priority": "high",
      "status": "active",
      "progress": 65,
      "milestones": [ ... ]
    }
  ]
}
```

#### Create Goal
```
POST /goals
Content-Type: application/json
Authorization: Bearer <jwt_token>

Request:
{
  "title": "Achieve 90% in Math",
  "description": "Score 90+ in all math exams",
  "targetDate": "2026-06-30",
  "priority": "high",
  "category": "academic"
}

Response (201):
{
  "success": true,
  "goal": { ... }
}
```

#### Update Goal
```
PUT /goals/:id
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "goal": { ... }
}
```

#### Delete Goal
```
DELETE /goals/:id
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "message": "Goal deleted successfully"
}
```

### 5. Notes Endpoints

#### Get All Notes
```
GET /notes?subject=Mathematics&tags=algebra
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "notes": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Algebra Basics",
      "content": "Variables, equations, solving...",
      "subject": "Mathematics",
      "tags": ["algebra", "basics"],
      "createdAt": "2026-04-24T10:00:00Z"
    }
  ]
}
```

#### Create Note
```
POST /notes
Content-Type: application/json
Authorization: Bearer <jwt_token>

Request:
{
  "title": "Algebra Basics",
  "content": "Variables, equations, solving...",
  "subject": "Mathematics",
  "tags": ["algebra", "basics"]
}

Response (201):
{
  "success": true,
  "note": { ... }
}
```

#### Update Note
```
PUT /notes/:id
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "note": { ... }
}
```

#### Delete Note
```
DELETE /notes/:id
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "message": "Note deleted successfully"
}
```

### 6. Analytics Endpoints

#### Get Dashboard Analytics
```
GET /analytics/dashboard?period=month
Authorization: Bearer <jwt_token>

Query Parameters:
- period: day, week, month, year

Response (200):
{
  "success": true,
  "analytics": {
    "productivityScore": 85,
    "completionRate": 78,
    "streak": 12,
    "totalHoursStudied": 45.5,
    "averageSessionDuration": 45,
    "topSubject": "Mathematics",
    "tasksCompleted": 34,
    "goalsProgress": 65
  }
}
```

#### Get Detailed Analytics
```
GET /analytics/detailed?metric=productivity&startDate=2026-04-01&endDate=2026-04-30
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "data": {
    "dates": ["2026-04-01", "2026-04-02", ...],
    "values": [75, 80, 78, ...],
    "trend": "upward",
    "average": 78.5
  }
}
```

### 7. Settings Endpoints

#### Get User Settings
```
GET /settings
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "settings": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439010",
    "theme": "dark",
    "notifications": {
      "email": true,
      "taskReminder": true,
      "goalReminder": true,
      "dailyReport": false
    },
    "privacy": {
      "profilePublic": false,
      "shareAnalytics": true
    }
  }
}
```

#### Update Settings
```
PUT /settings
Content-Type: application/json
Authorization: Bearer <jwt_token>

Request:
{
  "theme": "light",
  "notifications": {
    "email": false,
    "taskReminder": true
  }
}

Response (200):
{
  "success": true,
  "settings": { ... }
}
```

#### Change Password
```
POST /settings/change-password
Content-Type: application/json
Authorization: Bearer <jwt_token>

Request:
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}

Response (200):
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Update Avatar
```
PATCH /settings/avatar
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

Form Data:
- file: (image file)

Response (200):
{
  "success": true,
  "avatarUrl": "https://cdn.studyflow.com/avatars/507f1f77bcf86cd799439011.jpg"
}
```

### 8. Achievements Endpoints

#### Get User Achievements
```
GET /achievements
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "achievements": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "First Task",
      "description": "Complete your first task",
      "icon": "🎯",
      "earnedAt": "2026-04-24T10:00:00Z",
      "badge": "starter"
    }
  ]
}
```

### Error Responses

All endpoints return consistent error responses:

```
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

**Common Status Codes:**
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests (Rate Limited)
- `500` - Internal Server Error

---

## Database Schema

### Overview

StudyFlow uses MongoDB as its database. Below are the schemas for all collections.

### 1. Users Collection

```javascript
{
  _id: ObjectId,
  email: String (required, unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  avatar: String (URL),
  googleId: String (optional),
  emailVerified: Boolean (default: false),
  emailVerificationToken: String (optional),
  passwordResetToken: String (optional),
  passwordResetExpires: Date (optional),
  accountStatus: String (enum: ["active", "suspended", "deleted"]),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- email (unique)
- googleId (sparse)
- createdAt

### 2. Tasks Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (required, ref: Users),
  title: String (required),
  description: String,
  dueDate: Date (required),
  subject: String,
  priority: String (enum: ["low", "medium", "high"], default: "medium"),
  status: String (enum: ["pending", "in-progress", "completed", "overdue"]),
  isCompleted: Boolean (default: false),
  completedAt: Date (optional),
  estimatedHours: Number (optional),
  tags: [String],
  attachments: [
    {
      name: String,
      url: String,
      uploadedAt: Date
    }
  ],
  relatedGoals: [ObjectId] (ref: Goals),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- userId, dueDate
- userId, status
- userId, subject

### 3. Goals Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (required, ref: Users),
  title: String (required),
  description: String,
  category: String (enum: ["academic", "personal", "professional"]),
  targetDate: Date (required),
  priority: String (enum: ["low", "medium", "high"]),
  status: String (enum: ["active", "completed", "abandoned"]),
  progress: Number (0-100, default: 0),
  milestones: [
    {
      _id: ObjectId,
      title: String,
      targetDate: Date,
      completed: Boolean,
      completedAt: Date
    }
  ],
  relatedTasks: [ObjectId] (ref: Tasks),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- userId, status
- userId, targetDate

### 4. Study Sessions Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (required, ref: Users),
  taskId: ObjectId (optional, ref: Tasks),
  subject: String,
  topic: String (optional),
  startTime: Date (required),
  endTime: Date (optional),
  pausedAt: Date (optional),
  resumedAt: Date (optional),
  duration: Number (minutes),
  totalDuration: Number (minutes, calculated),
  status: String (enum: ["active", "paused", "completed", "abandoned"]),
  notes: String (optional),
  focusLevel: String (enum: ["low", "medium", "high"], optional),
  breaks: [
    {
      startTime: Date,
      endTime: Date,
      duration: Number
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- userId, startTime
- userId, subject
- status

### 5. Notes Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (required, ref: Users),
  title: String (required),
  content: String (required),
  subject: String,
  tags: [String],
  relatedTasks: [ObjectId] (ref: Tasks),
  attachments: [
    {
      name: String,
      url: String,
      type: String
    }
  ],
  lastEdited: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- userId, subject
- userId, createdAt

### 6. User Settings Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (required, unique, ref: Users),
  theme: String (enum: ["light", "dark", "auto"], default: "auto"),
  language: String (default: "en"),
  timezone: String (default: "UTC"),
  notifications: {
    email: Boolean (default: true),
    taskReminder: Boolean (default: true),
    goalReminder: Boolean (default: true),
    dailyReport: Boolean (default: false),
    weeklyReport: Boolean (default: false),
    reminderTime: String (HH:MM, default: "09:00")
  },
  privacy: {
    profilePublic: Boolean (default: false),
    shareAnalytics: Boolean (default: false),
    allowFriends: Boolean (default: true)
  },
  studyPreferences: {
    defaultSubject: String,
    defaultPriority: String,
    defaultSessionDuration: Number (minutes)
  },
  appearance: {
    compactView: Boolean (default: false),
    showAnimations: Boolean (default: true),
    colorScheme: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 7. Achievements Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (required, ref: Users),
  badgeId: String (unique per user-badge combo),
  title: String,
  description: String,
  category: String (enum: ["productivity", "consistency", "milestone", "special"]),
  icon: String (emoji or icon code),
  earnedAt: Date (required),
  requirement: {
    type: String (e.g., "tasksCompleted", "streakDays", "hoursStudied"),
    value: Number
  },
  createdAt: Date
}
```

**Indexes:**
- userId, earnedAt
- badgeId (unique)

### 8. Analytics Cache Collection (Optional)

```javascript
{
  _id: ObjectId,
  userId: ObjectId (required, ref: Users),
  date: Date,
  metric: String (enum: ["productivity", "completion", "hours", "streak"]),
  value: Number,
  details: Object,
  createdAt: Date,
  expiresAt: Date (TTL: 90 days)
}
```

**Indexes:**
- userId, date, metric (compound)
- expiresAt (TTL)

### Relationships Diagram

```
┌─────────────┐
│   Users     │
│  (auth,     │
│ profile)    │
└──────┬──────┘
       │
   ┌───┴─────────┬──────────────┬──────────────┬────────────┐
   │             │              │              │            │
   ↓             ↓              ↓              ↓            ↓
┌────────┐  ┌──────────┐  ┌────────┐  ┌────────────┐  ┌──────────┐
│ Tasks  │  │  Goals   │  │ Notes  │  │StudySess.  │  │Settings  │
│ (todo) │  │(long-term│  │(notes) │  │(timer data)│  │(prefs)   │
└────┬───┘  └────┬─────┘  └───┬────┘  └────────────┘  └──────────┘
     │           │            │
     └───────────┴────────────┘
              ↓
      ┌──────────────────┐
      │  Achievements    │
      │ (earned badges)  │
      └──────────────────┘
```

---

## Deployment Architecture

### Overview

StudyFlow is deployed using a scalable cloud infrastructure with separation of concerns for frontend and backend.

### Deployment Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT DEVICES                              │
│      (Web Browsers, Mobile Browsers, Desktop Apps)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CDN / EDGE LAYER                             │
│     (Cloudflare / AWS CloudFront)                              │
│  - Static Asset Caching (CSS, JS, Images)                      │
│  - DDoS Protection                                             │
│  - Geographic Distribution                                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND DEPLOYMENT (Vercel / Netlify)             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Static Site Generation (SSG) / Server-Side Rendering   │   │
│  │  - React + Vite Build Output                            │   │
│  │  - Optimized HTML/CSS/JS Bundles                        │   │
│  │  - Automatic Deployments on Git Push                    │   │
│  │  - Environment Variables (API URLs, Keys)               │   │
│  │  - SSL/TLS Certificates (Auto-renewal)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ API Calls (HTTPS)
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│              API GATEWAY / LOAD BALANCER                        │
│  (AWS API Gateway / Nginx / Kubernetes Ingress)               │
│  - Request Routing                                           │
│  - Rate Limiting                                             │
│  - CORS Handling                                             │
│  - Request/Response Logging                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ↓                         ↓
        ┌──────────────┐         ┌──────────────┐
        │  Load        │         │   Load       │
        │  Balancer 1  │         │   Balancer 2 │
        └──────┬───────┘         └────┬─────────┘
               │                      │
    ┌──────────┴──────────┐  ┌────────┴──────────┐
    │                     │  │                   │
    ↓                     ↓  ↓                   ↓
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  App Server │   │  App Server │   │  App Server │
│  Instance 1 │   │  Instance 2 │   │  Instance 3 │
│ (Node.js +  │   │ (Node.js +  │   │ (Node.js +  │
│ Express)    │   │ Express)    │   │ Express)    │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ↓
        ┌────────────────────────────────┐
        │  Message Queue (Optional)      │
        │  - Redis / RabbitMQ            │
        │  - Task Queue for Background   │
        │  - Email Notifications         │
        │  - Analytics Processing        │
        └────────────────┬───────────────┘
                         │
        ┌────────────────┴──────────────┐
        │                               │
        ↓                               ↓
┌──────────────────────┐        ┌──────────────────┐
│  MongoDB Replica Set │        │  Cache Layer     │
│  ┌────────┐          │        │  (Redis)         │
│  │ Primary│          │        │ - Session Cache  │
│  └────────┘          │        │ - Query Cache    │
│  ┌────────┐          │        │ - Rate Limits    │
│  │Secondary           │        └──────────────────┘
│  └────────┘          │
│  ┌────────┐          │
│  │Secondary           │        ┌──────────────────┐
│  └────────┘          │        │  External APIs   │
│  - Automatic Failover│        │ - Google OAuth   │
│  - Backup Replication         │ - Email Service  │
│  - Point-in-time Recovery     │ - Calendar APIs  │
└──────────────────────┘        └──────────────────┘
```

### Infrastructure Components

#### 1. Frontend (Vercel/Netlify)
- **Automatic deployments** from GitHub on each push
- **Environment variables** managed per deployment
- **Edge functions** for server-side rendering
- **SSL/TLS** auto-provisioning and renewal
- **CDN** for global distribution
- **Preview deployments** for PR testing

#### 2. Backend (AWS/Heroku/DigitalOcean)
- **Containerized** with Docker
- **Orchestrated** with Kubernetes or Docker Swarm
- **Auto-scaling** based on CPU/memory usage
- **Health checks** and auto-restart on failure
- **Rolling updates** for zero-downtime deployments
- **Monitoring** with CloudWatch/Prometheus

#### 3. Database (MongoDB Atlas/Self-Hosted)
- **Replica set** for redundancy (3+ nodes)
- **Automatic failover** and recovery
- **Automated backups** (daily + continuous)
- **Point-in-time recovery** capability
- **Encryption** at rest and in transit
- **Access control** with role-based permissions

#### 4. Cache Layer (Redis)
- **Session management**
- **Query result caching**
- **Rate limit tracking**
- **Real-time notifications** (WebSocket support)
- **Persistence** with AOF/RDB

#### 5. Message Queue (Optional)
- **Background job processing**
- **Email sending**
- **Analytics aggregation**
- **Webhook delivery**

#### 6. Monitoring & Logging
- **Application Performance Monitoring (APM)**
  - New Relic / Datadog / Elastic APM
  - Request latency tracking
  - Error rate monitoring
  - Custom metrics

- **Centralized Logging**
  - ELK Stack (Elasticsearch, Logstash, Kibana)
  - Cloudwatch / Stackdriver
  - Real-time log analysis
  - Alert triggers

- **Uptime Monitoring**
  - Health check endpoints
  - Status page (Statuspage.io)
  - Alert notifications

### Deployment Pipeline

```
Developer Push → Git → GitHub
                         ↓
                   GitHub Actions
                    (CI/CD Pipeline)
                         ↓
         ┌───────────────┬───────────────┐
         ↓               ↓               ↓
    Test Suite    Lint Check      Build Check
         │               │               │
         └───────────────┴───────────────┘
                    ↓
            All Tests Pass?
            Yes ↓         No → Notify Developer
                │
         ┌──────┴──────┐
         ↓             ↓
    Frontend      Backend
    Deployment    Deployment
    (Vercel)      (Docker → Registry)
                         ↓
                  Kubernetes/Swarm
                    Deploy New Version
                         ↓
                   Run Smoke Tests
                         ↓
                   Update DNS/Routes
```

### Environment Configuration

**Development Environment**
```
Frontend: http://localhost:3000
Backend: http://localhost:5000
Database: Local MongoDB
```

**Staging Environment**
```
Frontend: https://staging.studyflow.example.com
Backend: https://api-staging.studyflow.example.com
Database: Staging MongoDB cluster
```

**Production Environment**
```
Frontend: https://studyflow.example.com
Backend: https://api.studyflow.example.com
Database: Production MongoDB Atlas cluster
```

---

## Environment Setup

### Prerequisites
- Node.js v16+ 
- npm or yarn
- MongoDB (local or Atlas)
- Git

### Backend Setup

```bash
# Clone repository
git clone https://github.com/yourusername/studyflow.git
cd BACKEND

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# DB_URI=mongodb+srv://user:pass@cluster.mongodb.net/studyflow
# JWT_SECRET=your_secret_key
# NODE_ENV=development

# Start development server
npm run dev

# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
cd FRONTEND

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev

# Application runs on http://localhost:3000
```

---

## Development Guidelines

### Code Standards
- Use ES6+ features
- Follow RESTful API conventions
- Implement proper error handling
- Add input validation on both client and server
- Write meaningful commit messages

### Security Best Practices
- Always hash passwords using bcrypt
- Use JWT for authentication
- Implement rate limiting on endpoints
- Validate and sanitize all user inputs
- Use HTTPS in production
- Keep dependencies updated
- Store sensitive data in environment variables

### Database Best Practices
- Create appropriate indexes for queries
- Use transactions for related operations
- Implement soft deletes where appropriate
- Archive old data periodically
- Regular backup testing

---

## Support & Resources

For questions or issues, please refer to:
- **Documentation:** This file and code comments
- **Issues:** GitHub Issues repository
- **Email:** support@studyflow.example.com

---

**Document Version:** 1.0.0  
**Last Updated:** April 2026  
**Next Review Date:** October 2026
