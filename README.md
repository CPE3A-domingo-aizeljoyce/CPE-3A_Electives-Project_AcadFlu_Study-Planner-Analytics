#  StudyFlow: Study Planner & Analytics

A modern, frontend-focused web application designed to help students track their study habits, manage tasks, and visualize their productivity. This project was developed as an Electives Project by BS Computer Engineering students at Bulacan State University (BulSu).


##  Features (Current Progress)
* **Interactive Dashboard:** Dynamic daily greetings and automated current dates.
* **Smart Task Scheduler:** Add and manage tasks with built-in date validation (blocks past dates).
* **Real-Time Analytics:** * Live computation of Daily Productivity Score based on completed tasks.
  * Real-time Streak Tracking (adds +1 when a task is checked off today).
* **Visual Progress:** Weekly, monthly, and yearly study hour charts using Recharts.
* **Custom Subjects:** Pre-defined subject color-coding with an option to add "Others".

##  Tech Stack
* **Framework:** React + Vite
* **Styling:** CSS / Tailwind (if applicable)
* **Icons:** Lucide-React
* **Charts:** Recharts


# AcadFlu API Endpoints

## 1. Authentication
- `POST   /api/auth/register`          
- `POST   /api/auth/login`            
- `GET    /api/auth/verify-email`      
- `GET    /api/auth/google/url`        
- `GET    /api/auth/google/callback`   
- `POST   /api/auth/google`           
- `POST   /api/auth/forgot-password`   
- `POST   /api/auth/reset-password`    
- `GET    /api/auth/me`                
- `DELETE /api/auth/delete-account`   

## 2. Settings
- `GET    /api/settings`               
- `PUT    /api/settings`               
- `POST   /api/settings/change-password` 
- `PATCH  /api/settings/avatar`        

## 3. Tasks & Calendar
- `GET    /api/tasks/`                 
- `POST   /api/tasks/`                 
- `GET    /api/tasks/:id`           
- `PUT    /api/tasks/:id`              
- `DELETE /api/tasks/:id`              
- `PATCH  /api/tasks/:id/toggle`       
- `PATCH  /api/tasks/:id/status`       
- `POST   /api/tasks/:id/sync-calendar`
- `GET    /api/tasks/calendar/events`  
- `GET    /api/tasks/calendar/stats`  
- `POST   /api/tasks/calendar/sync-from-calendar` 

## 4. Study Timer
- `POST   /api/study-timer/start`      
- `GET    /api/study-timer/active`     
- `PATCH  /api/study-timer/:id/pause`  
- `PATCH  /api/study-timer/:id/resume` 
- `PATCH  /api/study-timer/:id/stop`   
- `PATCH  /api/study-timer/:id/abandon`
- `GET    /api/study-timer`            
- `GET    /api/study-timer/:id`        
- `GET    /api/study-timer/stats`      
- `DELETE /api/study-timer/:id`       
