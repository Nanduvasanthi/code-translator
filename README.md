Code Translator and Compiler Platform

An AST-based code translation and compilation platform that allows users to translate, compile, and analyze code across Java, Python, and C, with secure authentication, detailed history tracking, and customizable user settings.

This project follows a modular microservice-based architecture to ensure scalability, maintainability, and security.

Features
Authentication and User Management

User registration and login using Email & Password

Google OAuth authentication

OTP verification for new users

Forgot password and secure password reset

Secure logout and account deletion

JWT-based authentication

Dashboard

Displays:

Total translations

Total compilations

Success rate

Recent user activity

Navigation to Translator, Compiler, History, and Settings

Code Translator

Supports:

Java

Python

C

AST-based translation approach

Handles:

Variables and data types

Loops and conditional statements

Arrays and basic logic

Clean and readable output code

Code Compilation

Secure sandboxed execution

Real-time output and error messages

Memory and CPU time usage tracking

Supported languages and versions:

Python 3

Java 15

C (GCC 10.2.0)

Compilation Engines

Primary: JDoodle API (100 free compilations/day)

Fallback: Piston API (used only when available)

History

Stores:

Translation history

Compilation history

Filter by language and execution status

Delete individual or all records

Settings

Default language preferences

Editor theme and font size

Profile management

Project Structure
code-translator/
│
├── frontend/                  # React + TypeScript frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Application pages
│   │   ├── services/           # API service handlers
│   │   └── App.tsx
│   ├── public/
│   └── package.json
│
├── backend/                   # Main backend service
│   ├── models/                 # MongoDB schemas
│   ├── routes/                 # API routes
│   ├── controllers/            # Business logic
│   ├── middleware/             # Auth and validation middleware
│   └── package.json
│
├── translator-service/         # AST-based translation service
│   ├── src/
│   │   ├── parsers/             # Language parsers
│   │   ├── generators/          # Code generators
│   │   └── ast/                 # AST definitions
│   ├── server.js
│   └── package.json
│
├── compilation-service/        # Code compilation service
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
├── screenshots/                # Application screenshots
│
└── README.md

Tech Stack

Frontend

React

TypeScript

Tailwind CSS

Backend

Node.js

Express.js

MongoDB

Authentication

JWT

Google OAuth 2.0

Translation

AST-based parsing and generation

Compilation

JDoodle API (Primary)

Piston API (Fallback)

Environment Variables

Environment variables are required for security and configuration.
They must be stored in .env files and should never be committed to GitHub.

Backend (backend/.env)
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

Compilation Service (compilation-service/.env)
JD_CLIENT_ID=your_jdoodle_client_id
JD_CLIENT_SECRET=your_jdoodle_client_secret
PORT=3002
NODE_ENV=development

Setup Instructions
Prerequisites

Node.js v18 or higher

MongoDB

Git

1. Clone the Repository
git clone https://github.com/Nanduvasanthi/code-translator.git
cd code-translator

2. Backend Setup
cd backend
npm install
cp .env.example .env


Edit the .env file and add your MongoDB URI, JWT secret, and Google OAuth credentials.

npm start


Backend runs on: http://localhost:5000

3. Frontend Setup
cd ../frontend
npm install
npm start


Frontend runs on: http://localhost:3000

4. Compilation Service Setup
cd ../compilation-service
npm install


Create .env file:

JD_CLIENT_ID=your_jdoodle_client_id
JD_CLIENT_SECRET=your_jdoodle_client_secret
PORT=3002
NODE_ENV=development


Start the service:

npm run dev

5. Translator Service Setup
cd ../translator-service
npm install
npm start

API Endpoints (Compilation Service)

Base URL: http://localhost:3002

Method	Endpoint	Description
GET	/health	Service health check
GET	/info	Service information
GET	/languages	Supported languages
POST	/compile	Compile code
POST	/test	Test all languages
Current Status

JDoodle API: Working (100 free compilations per day)

Piston API: Unstable (fallback only)

Python: Supported

Java: Supported

C: Supported

Credentials secured using .env

.env files excluded via .gitignore

Author

Nandu Vasanthi
GitHub: https://github.com/Nanduvasanthi

Email: nvasanthi2005@gmail.com

License

Educational and personal use only.

Acknowledgments

JDoodle API for code compilation

Piston API for execution engine

Emkc.org for hosting Piston API

Last Updated: February 12,
