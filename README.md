# Code Translator and Compiler Platform

An AST-based code translation and compilation platform that allows users to translate, compile, and analyze code across Java, Python, and C with secure authentication, detailed history tracking, and customizable settings.

---

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
- Uses Piston API
- Secure execution environment
- Displays output and errors

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

Create a folder named `screenshots` in the root directory and add the following images:

- screenshots/login.png
- screenshots/dashboard.png
- screenshots/translator.png
- screenshots/compiler.png
- screenshots/history.png

---

## Project Structure

code-translator/
- frontend/
- backend/
- translator-service/
- compilation-service/
- screenshots/
- README.md

---

## Tech Stack

Frontend: React, TypeScript, Tailwind CSS  
Backend: Node.js, Express, MongoDB  
Authentication: JWT, Google OAuth  
Compilation: Piston API  

---

## Setup

Clone the repository and install dependencies in each service folder.

---

## Author

Nandu Vasanthi  
GitHub: https://github.com/Nanduvasanthi

---

## License

Educational and personal use only.
