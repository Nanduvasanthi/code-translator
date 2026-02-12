# Code Translator and Compiler Platform

An **AST-based code translation and compilation platform** that allows users to translate, compile, and analyze code across Java, Python, and C. Features include secure authentication, detailed history tracking, and customizable settings.


## Overview

This project provides a **full-stack platform** where users can:  
- Translate code between multiple programming languages  
- Compile and execute code securely  
- Track history and analytics  
- Manage accounts with secure authentication  


## Key Features

### Authentication and User Management
- Login and registration using **Email and Password**  
- **Google OAuth** authentication  
- **OTP verification** for new users  
- Forgot password and reset flow  
- Secure logout and account deletion  

### Dashboard
- Displays **total translations and compilations**  
- Shows **success rate**  
- Displays **recent user activity**  
- Navigation to **Translator, Compiler, History, and Settings**  

### Code Translator
- Supports **Java, Python, and C**  
- **AST-based translation engine**  
- Handles:
  - Basic syntax  
  - Data types  
  - Operators  
  - Conditions  
  - Loops  
  - Arrays  
- Pre-translation compilation for **error detection**  

### Code Compilation
- Uses **Piston API** for secure code execution  
- Supports **Java, Python, and C**  
- Displays **program output** and **compilation errors**  

### History and Analytics
- Stores **translation and compilation history**  
- View input code, translated output, and execution results  
- Filter by **language, status, and type**  
- Delete individual records or entire history  
- View **most-used language statistics**  

### Settings
- Default source and target language selection  
- Editor font size configuration  
- Theme customization  
- Profile management  
- Secure account deletion  

### Screenshots

Create a folder named `screenshots` in the project root and add the following images:

**Login Page**  
![Login](screenshots/login.png)

**Dashboard**  
![Dashboard](screenshots/dashboard.png)

**Code Translator**  
![Translator](screenshots/translator.png)

**Code Compiler**  
![Compiler](screenshots/compiler.png)

**History Page**  
![History](screenshots/history.png)

---

## Project Structure

code-translator/
├─ frontend/
├─ backend/
├─ translator-service/
├─ compilation-service/
├─ screenshots/
└─ README.md


---

## Tech Stack

**Frontend:**  
- React, TypeScript, Tailwind CSS, Vite  

**Backend:**  
- Node.js, Express.js, MongoDB, JWT Authentication  

**Services:**  
- AST-based parsing and code generation  
- Piston API for compilation and execution  

**Authentication:**  
- Email and Password  
- Google OAuth  
- OTP Verification  

---

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/Nanduvasanthi/code-translator.git
cd code-translator
2. Install dependencies and start services
Backend:

cd backend
npm install
npm run dev
Translator Service:

cd translator-service
npm install
npm start
Compilation Service:

cd compilation-service
npm install
npm start
Frontend:

cd frontend
npm install
npm run dev
Environment Variables
Create a .env file in each service directory. Do not commit these files.

Backend .env

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
Translator Service .env

PORT=6000
Compilation Service .env

PORT=7000
PISTON_API_URL=https://emkc.org/api/v2/piston
Frontend .env

VITE_API_BASE_URL=http://localhost:5000
Author
Nandu Vasanthi
GitHub: https://github.com/Nanduvasanthi

License
This project is licensed for educational and personal use only.

