# Code Translator and Compiler Platform

An AST-based code translation and compilation platform that allows users to translate, compile, and analyze code across Java, Python, and C with secure authentication, detailed history tracking, and customizable settings.


## Key Features

### Authentication and User Management
- Login and registration using Email and Password or Google OAuth
- OTP verification for new users
- Forgot password support
- Secure logout and account deletion

### Dashboard
- Displays total translations, compilations, and success rate
- Shows recent activity
- Easy navigation between modules

### Code Translator
- Supports Java, Python, and C
- AST-based translation
- Handles syntax, loops, conditions, arrays, and data types

### Code Compilation
- Primary: JDoodle API - 100 free compilations per day
- Fallback: Piston API (when available)
- Secure sandboxed execution environment
- Real-time output, error messages, and execution stats
- Memory and CPU time tracking
- Supports Python 3, Java 15, C 10.2.0

### History
- Stores translation and compilation history
- Filter by language and status
- Delete specific or all records

### Settings
- Default language preferences
- Editor font size and theme
- Profile management


## Screenshots

## Login:

<img width="1919" height="869" alt="login" src="https://github.com/user-attachments/assets/10f1d2b1-78a7-4e6c-adf9-9c8c34645f7e" />

## Dashboard:

<img width="1908" height="863" alt="dashboard" src="https://github.com/user-attachments/assets/2f16371c-50d7-49bd-917a-fefb900e5760" />

## Translator:

<img width="1919" height="875" alt="translator" src="https://github.com/user-attachments/assets/8ad5f841-4ce5-4a42-8926-dac74078c71b" />

## Compiler:

<img width="1916" height="880" alt="compiler" src="https://github.com/user-attachments/assets/ead4a24d-6e66-4827-bc9c-152d51c47f8f" />

## History:

<img width="1919" height="875" alt="history" src="https://github.com/user-attachments/assets/6890841d-74be-43fc-9201-8869a5d909fe" />


## Project Structure

code-translator/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── package.json
│
├── translator-service/
│   ├── src/
│   │   ├── parsers/
│   │   ├── generators/
│   │   └── ast/
│   ├── server.js
│   └── package.json
│
├── compilation-service/
│   ├── src/
│   │   ├── compilers/
│   │   │   ├── BaseCompiler.js
│   │   │   ├── JDoodleCompiler.js
│   │   │   └── CompilerFactory.js
│   │   ├── CompilationService.js
│   │   └── index.js
│   ├── server.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── screenshots/
│
└── README.md


## Tech Stack

Frontend: React, TypeScript, Tailwind CSS
Backend: Node.js, Express, MongoDB
Authentication: JWT, Google OAuth
Translation: AST-based parser
Compilation: JDoodle API (Primary), Piston API (Fallback)


## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- Git

### 1. Clone the Repository
git clone https://github.com/Nanduvasanthi/code-translator.git
cd code-translator

### 2. Backend Setup
cd backend
npm install
cp .env.example .env
- Add your MongoDB URI, JWT secret, Google OAuth credentials
npm start

### 3. Frontend Setup
cd frontend
npm install
npm start

### 4. Compilation Service Setup
cd compilation-service
npm install

- Get free JDoodle API credentials:
  1. Go to https://www.jdoodle.com/compiler-api/
  2. Sign up for free account
  3. Get Client ID and Client Secret

- Create .env file:
  echo "JD_CLIENT_ID=your_client_id_here" > .env
  echo "JD_CLIENT_SECRET=your_client_secret_here" >> .env

- Start the service:
  npm run dev

### 5. Translator Service Setup
cd translator-service
npm install
npm start

---

## Environment Variables

### Backend (.env)
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

### Compilation Service (.env)
JD_CLIENT_ID=your_jdoodle_client_id
JD_CLIENT_SECRET=your_jdoodle_client_secret
PORT=3002
NODE_ENV=development

---

## API Endpoints

### Compilation Service (Port: 3002)

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET    | /health  | Service health check |
| GET    | /info    | Service information |
| GET    | /languages | Supported languages |
| POST   | /compile | Compile code |
| POST   | /test    | Test all languages |

---

## Current Status

- JDoodle API - Working (100 free compilations per day)
- Piston API - Unstable/Offline (Fallback only)
- Python Support - Working
- Java Support - Working
- C Support - Working
- Secure Credentials - Using .env file
- GitHub Ready - .env in .gitignore

---

## Author

Nandu Vasanthi
GitHub: https://github.com/Nanduvasanthi
Email: nvasanthi2005@gmail.com

---

## License

Educational and personal use only.

---

## Acknowledgments

- JDoodle API for free code compilation
- Piston API for open-source execution engine
- Emkc.org for Piston API hosting

---

Last Updated: February 12, 2026
