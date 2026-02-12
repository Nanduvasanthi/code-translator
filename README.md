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

<img width="1919" height="869" alt="Screenshot 2026-02-12 104501" src="https://github.com/user-attachments/assets/f6b6d741-71f3-4f4f-a0ae-38f6d075907e" />



**Dashboard** 

<img width="1908" height="863" alt="image" src="https://github.com/user-attachments/assets/bff9213c-3dcb-42d1-adc5-20c7c182d7a6" />


**Code Translator** 

<img width="1919" height="875" alt="image" src="https://github.com/user-attachments/assets/17143912-5c58-43f2-aa61-b160e1e9c71b" />


**Code Compiler**

<img width="1916" height="880" alt="image" src="https://github.com/user-attachments/assets/f507b402-fc8d-4f51-ba6c-39ac2fbc1581" />



**History Page**  

<img width="1919" height="875" alt="image" src="https://github.com/user-attachments/assets/625a70ca-6613-44ef-b2c0-f1e3735bba86" />


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

