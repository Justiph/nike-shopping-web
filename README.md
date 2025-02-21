# Server Application

This project serves as the backend for a web application with various features, such as user authentication, database integration, and cloud-based media storage.

## Features
- User authentication with **Passport.js** (local and Google OAuth).
- Secure password management with **bcrypt**.
- Session handling with **express-session** and MongoDB store.
- Environment configuration with **dotenv**.
- Rate limiting for enhanced security.
- Email support using **Nodemailer**.
- File uploads and storage with **Multer** and **Cloudinary**.
- Redis integration with **ioredis**.
- Database support for MongoDB and SQLite.
- Dynamic views using **EJS** with layouts.
- Security enhancements with **Helmet**.

---

## Prerequisites

- **Node.js**: Version 18.x
- **MongoDB**: Ensure MongoDB is installed or accessible via a connection string.
- **Redis**: Can be set up with Docker (instructions below).
- **Cloudinary**: An account for managing file uploads.

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/server.git
   cd server
2. Install dependencies:
   ```bash
   npm install
3. Create a .env file in the root directory and add the following configurations:
   ```env
   # Server Configuration
    PORT=5000

    # Database Configuration
    DB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority

    # JWT Configuration
    JWT_SECRET=<your-jwt-secret>

    # Email Configuration
    EMAIL_USER=<your-email>
    EMAIL_PASSWORD=<your-email-password>

    # Google OAuth Configuration
    GOOGLE_CLIENT_ID=<your-google-client-id>
    GOOGLE_CLIENT_SECRET=<your-google-client-secret>

    # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
    CLOUDINARY_API_KEY=<your-cloudinary-api-key>
    CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
    # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
4. Set up Redis using Docker:
- Ensure Docker is installed and running on your system.
- Pull and run the Redis image:
   ```bash
   docker run -d --name redis -p 6379:6379 redis
- Verify that Redis is running
   ```bash
   docker ps
5. Start the server:
    ```bash
    npm start
