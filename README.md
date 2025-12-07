# MEVN Library Borrowing System

A complete full-stack web application for managing a library. Built with **M**ongoDB, **E**xpress.js, **V**ue 3, and **N**ode.js.

## 📂 Architecture

The project is a Monorepo containing three services:

- **/backend**: REST API Server (Node/Express/Mongoose).
- **/frontend-user**: Reader's Portal (Vue 3 + Vite + Bootstrap + Vue Good Table ).
- **/frontend-admin**: Admin Dashboard (Vue 3 + Vite + Vue Good Table + Bootstrap).

---

## 🚀 Local Deployment Guide

Follow the instructions below to run the project on your local machine. You will need to open three separate terminal windows to keep all services running simultaneously.

### Prerequisites

- Node.js installed.
- MongoDB installed and running locally.

### 1. Backend Server

First, initialize and start the API server.

```bash
cd backend

# Install dependencies
npm install

# Seed the database with initial data (Required for first run)
npm run seed

# Start the development server
npm run dev
```

### 2. Frontend User

First, initialize and start the API server.

```bash
cd frontend_user

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 3. Frontend admin

First, initialize and start the API server.

```bash
cd frontend_admin

# Install dependencies
npm install

# Start the development server
npm run dev
```
