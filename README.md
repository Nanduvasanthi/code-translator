# Code Translator and Compiler Platform

An AST-based code translation and compilation platform that allows users to translate, compile, and analyze code across Java, Python, and C with secure authentication, detailed history tracking, and customizable settings.



## Key Features

### Authentication & User Management
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

---

## Screenshots

### Login:
<img width="1919" height="869" alt="login" src="https://github.com/user-attachments/assets/10f1d2b1-78a7-4e6c-adf9-9c8c34645f7e" />

### Dashboard:
<img width="1908" height="863" alt="dashboard" src="https://github.com/user-attachments/assets/2f16371c-50d7-49bd-917a-fefb900e5760" />

### Translator:
<img width="1919" height="875" alt="translator" src="https://github.com/user-attachments/assets/8ad5f841-4ce5-4a42-8926-dac74078c71b" />

### Compiler:
<img width="1916" height="880" alt="compiler" src="https://github.com/user-attachments/assets/ead4a24d-6e66-4827-bc9c-152d51c47f8f" />

### History:
<img width="1919" height="875" alt="history" src="https://github.com/user-attachments/assets/6890841d-74be-43fc-9201-8869a5d909fe" />

---

## Technologies Used

### Frontend
- **React 18+** – UI library
- **TypeScript** – Type safety
- **Tailwind CSS** – Styling framework

### Backend
- **Node.js** – JavaScript runtime
- **Express** – Web framework
- **MongoDB** – Database
- **JWT** – Authentication
- **Google OAuth** – Social login

### Translation Service
- **AST-based Parser** – Custom built
- **Abstract Syntax Trees** – Code structure analysis
- **Multi-language Support** – Java, Python, C

### Compilation Service
- **JDoodle API** – Primary compiler (100 free/day)
- **Piston API** – Fallback compiler
- **Sandboxed Environment** – Secure code execution

---

## Prerequisites

- **Node.js v18+**
- **MongoDB** (Local or Atlas)
- **Git**
- **JDoodle API Account** (Free)

---

## Project Structure
```bash

code-translator/
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── services/
│ │ └── App.tsx
│ ├── public/
│ ├── .env.example
│ └── package.json
│
├── backend/
│ ├── models/
│ ├── routes/
│ ├── controllers/
│ ├── middleware/
│ ├── .env.example
│ └── package.json
│
├── translator-service/
│ ├── src/
│ │ ├── parsers/
│ │ ├── generators/
│ │ └── ast/
│ ├── server.js
│ ├── .env.example
│ └── package.json
│
├── compilation-service/
│ ├── src/
│ │ ├── compilers/
│ │ │ ├── BaseCompiler.js
│ │ │ ├── JDoodleCompiler.js
│ │ │ └── CompilerFactory.js
│ │ ├── CompilationService.js
│ │ └── index.js
│ ├── server.js
│ ├── .env.example
│ ├── .gitignore
│ └── package.json
│
├── screenshots/
│
└── README.md

```


## Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Nanduvasanthi/code-translator.git
cd code-translator

```


### 2️⃣ Backend Setup

```bash
cd backend
npm install
cp .env.example .env

```

Edit the .env file with your credentials:

```bash
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

```

Start the backend server:

```bash
npm start

```
### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env

```
Edit the .env file:

```bash
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id

```
Start the frontend:

```bash
npm start

```
### 4️⃣ Compilation Service Setup (JDoodle)
```bash
cd compilation-service
npm install
cp .env.example .env

```
Get your free JDoodle API credentials:

Go to https://www.jdoodle.com/compiler-api/

Sign up for a free account

Get your Client ID and Client Secret

Edit the .env file:
```bash
JD_CLIENT_ID=your_jdoodle_client_id_here
JD_CLIENT_SECRET=your_jdoodle_client_secret_here
PORT=3002
NODE_ENV=development

```
Start the compilation service:

```bash
npm run dev

```
### 5️⃣ Translator Service Setup
```bash
cd translator-service
npm install
cp .env.example .env

```
Edit the .env file:

```bash
PORT=3001
NODE_ENV=development

```

Start the translator service:

```bash

npm start

```
