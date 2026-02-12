

\# 🚀 Code Translator \& Compiler Platform



An \*\*AST-based code translation and compilation platform\*\* that allows users to translate, compile, and analyze code across \*\*Java, Python, and C\*\* with secure authentication, detailed history tracking, and customizable settings.



---



\## 📌 Key Features



\### 🔐 Authentication \& User Management

\- Login \& Register using \*\*Email/Password\*\* or \*\*Google OAuth\*\*

\- Smart handling of edge cases:

&nbsp; - Email already registered with Google or Email/Password

&nbsp; - Login attempts using wrong authentication method

\- \*\*OTP verification\*\* for new users

\- \*\*Forgot Password\*\* flow (Email + reset link)

\- Secure account deletion and logout



---



\### 📊 Dashboard

\- Overview of:

&nbsp; - Total translations

&nbsp; - Total compilations

&nbsp; - Success rate

\- Recent user activity

\- Navigation to Translator, Compiler, History, and Settings



---



\### 🔁 Code Translator (AST-Based)

\- Supports \*\*Java, Python, and C\*\*

\- 6 Translation combinations:

&nbsp; - Java ↔ Python

&nbsp; - Java ↔ C

&nbsp; - Python ↔ C

\- Handles:

&nbsp; - Basic syntax

&nbsp; - Data types

&nbsp; - Operators

&nbsp; - Conditions

&nbsp; - Loops

&nbsp; - Arrays

\- Translation is performed using \*\*Abstract Syntax Tree (AST)\*\* parsing

\- Pre-translation compilation to detect errors



---



\### ⚙️ Code Compilation

\- Uses \*\*Piston API\*\* for secure and isolated code execution

\- Supported languages:

&nbsp; - Java

&nbsp; - Python

&nbsp; - C

\- Displays:

&nbsp; - Compilation errors (if any)

&nbsp; - Program output on success



---



\### 🕘 History \& Analytics

\- Track all translations and compilations with timestamps

\- View:

&nbsp; - Input code

&nbsp; - Translated code

&nbsp; - Output / Errors

\- Filters:

&nbsp; - Translation / Compilation

&nbsp; - Success / Error

&nbsp; - Language

\- Delete:

&nbsp; - Entire history

&nbsp; - Specific entries

\- View most-used language statistics



---



\### ⚙️ Settings \& Customization

\- Set default source \& target languages

\- Adjust editor font size (Small / Medium / Large)

\- Change editor color theme

\- View profile details

\- Delete account securely



---



\## 🏗️ Project Architecture



```

code-translator/

│

├── frontend/                # React + TypeScript + Tailwind

├── backend/                 # Node.js + Express + MongoDB

├── translator-service/      # AST-based translation engine

├── compilation-service/     # Piston API based compilation

└── README.md

```



---



\## 🧰 Tech Stack



\### Frontend

\- React

\- TypeScript

\- Tailwind CSS

\- Vite



\### Backend

\- Node.js

\- Express.js

\- MongoDB

\- JWT Authentication



\### Services

\- AST Parsing \& Code Generation

\- Piston API for Compilation



\### Authentication

\- Google OAuth

\- Email \& Password

\- OTP Verification



---



\## ⚙️ Setup Instructions



\### 1️⃣ Clone the Repository

```bash

git clone https://github.com/Nanduvasanthi/code-translator.git

cd code-translator

```



\### 2️⃣ Install Dependencies



\#### Backend

```bash

cd backend

npm install

npm run dev

```



\#### Translator Service

```bash

cd translator-service

npm install

npm start

```



\#### Compilation Service

```bash

cd compilation-service

npm install

npm start

```



\#### Frontend

```bash

cd frontend

npm install

npm run dev

```



---



\## 🔐 Environment Variables

Create `.env` files in respective services based on `.env.example` (not included for security).



---



\## 📸 Screenshots (Optional)

\_Add screenshots of dashboard, translator, compiler, and history pages here.\_



---



\## 🚀 Future Enhancements

\- Support for more languages (C++, JavaScript)

\- Advanced AST optimizations

\- Code formatting \& linting

\- Export history as PDF

\- Collaboration features



---



\## 👤 Author

\*\*Nandu Vasanthi\*\*  

GitHub: https://github.com/Nanduvasanthi



---



\## 📄 License

This project is licensed for educational and personal use.



