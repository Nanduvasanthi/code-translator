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


## Project Structure
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


## Tech Stack

| Technology | Details |
|------------|---------|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, MongoDB |
| Authentication | JWT, Google OAuth |
| Translation | AST-based parser (Custom) |
| Compilation | JDoodle API (Primary), Piston API (Fallback) |


## Prerequisites

- Node.js (v18 or higher)
- MongoDB (Local or Atlas)
- Git
- JDoodle API Account (Free)


## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Nanduvasanthi/code-translator.git
cd code-translator
bash```


cd backend
npm install
cp .env.example .env
Edit the .env file with your credentials:

env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
Start the backend server:

bash
npm start
3. Frontend Setup
bash
cd frontend
npm install
cp .env.example .env
Edit the .env file:

env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
Start the frontend:

bash
npm start
4. Compilation Service Setup (JDoodle)
bash
cd compilation-service
npm install
cp .env.example .env
Get your free JDoodle API credentials:

Go to https://www.jdoodle.com/compiler-api/

Sign up for a free account

Get your Client ID and Client Secret

Edit the .env file:

env
JD_CLIENT_ID=your_jdoodle_client_id_here
JD_CLIENT_SECRET=your_jdoodle_client_secret_here
PORT=3002
NODE_ENV=development
Start the compilation service:

bash
npm run dev
5. Translator Service Setup
bash
cd translator-service
npm install
cp .env.example .env
Edit the .env file:

env
PORT=3001
NODE_ENV=development
Start the translator service:

bash
npm start
Environment Variables Reference
Backend (.env)
text
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
Frontend (.env)
text
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
Compilation Service (.env)
text
JD_CLIENT_ID=b1163cdab5b124162ddf79c8a3ddd075
JD_CLIENT_SECRET=af10c8868c9345c7a73daee76967122e9d49304793f0ab89ff7d4d6745063b94
PORT=3002
NODE_ENV=development
Translator Service (.env)
text
PORT=3001
NODE_ENV=development
API Endpoints
Compilation Service (Port: 3002)
Method	Endpoint	Description	Request Body
GET	/health	Service health check	-
GET	/info	Service information	-
GET	/languages	Supported languages	-
POST	/compile	Compile code	{ "code": "print('hello')", "language": "python" }
POST	/test	Test all languages	-
Backend API (Port: 5000)
Method	Endpoint	Description
POST	/api/auth/register	User registration
POST	/api/auth/login	User login
POST	/api/auth/google	Google OAuth
GET	/api/history	Get compilation history
POST	/api/translate	Translate code
Current Status
JDoodle API - Working (100 free compilations per day)

Piston API - Unstable/Offline (Fallback only)

Python Support - Working

Java Support - Working

C Support - Working

Secure Credentials - Using .env files

GitHub Ready - .env files in .gitignore

Troubleshooting
Compilation Service Issues
JDoodle credentials not working:

Verify your Client ID and Client Secret

Check you have remaining credits (100/day)

Regenerate credentials on JDoodle dashboard

Port already in use:

bash
# Change port in .env file
PORT=3003
MongoDB connection error:

Verify MongoDB is running

Check connection string in .env

Ensure network access is configured

Author
Nandu Vasanthi

GitHub: https://github.com/Nanduvasanthi

Email: nvasanthi2005@gmail.com

License
Educational and personal use only.

Acknowledgments
JDoodle for providing free compilation API

Piston API team for open-source execution engine

Emkc.org for hosting Piston API

React and Node.js communities

Contributing
This project is for educational purposes. Feel free to fork and experiment.

Last Updated: February 12, 2026


