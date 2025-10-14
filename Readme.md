SocialSphere - A Modern, Real-Time Social Media Backend 🚀
SocialSphere is a feature-rich, production-grade backend for a modern social media application. Built with a Modular Monolith architecture, this project showcases advanced engineering practices including real-time communication, performance optimization, a complete security suite, and a professional DevOps workflow.

This project is designed as a portfolio centerpiece to demonstrate a deep understanding of scalable, reliable, and maintainable backend systems.

✨ Core Features
🔐 Authentication & Security
Multi-Factor Registration: Sign up with Email/Password, Mobile Number (OTP), or Google (OAuth 2.0).

Full Verification Flow: Email verification via unique link and mobile verification via SMS OTP.

Secure JWT Authentication: Uses a robust Access Token and a database-backed Refresh Token system.

Secure Password Reset: A full "Forgot Password" flow with expiring, single-use tokens.

Immediate Logout: Implements a token blacklist using Redis for instant session invalidation.

📝 Content & Social Graph
Rich Media Posts: Create posts with text, images, or videos.

Cloud Media Storage: All media is uploaded to and served from Cloudinary.

Core Interactions: Users can like, comment on, and follow/unfollow other users.

Feeds:

A public, paginated feed of all posts.

A personalized feed showing posts only from followed users.

A "Trending" feed built with a complex MongoDB Aggregation Pipeline.

A dedicated "Reels" feed for video content.

⚡ Real-Time Systems (via Socket.IO)
One-on-One Chat: Full real-time private messaging.

Presence System: See which users are currently online or offline.

Typing Indicators: See when another user is typing a message to you.

Instant Notifications: Receive real-time notifications for new likes and comments.

⚙️ Performance & DevOps
High-Performance Caching: Uses a Redis cache (cache-aside pattern) to dramatically speed up frequent read operations like the main post feed.

Automated Testing: A comprehensive integration test suite built with Jest and Supertest.

Containerization: The entire application and its dependencies (MongoDB, Redis) are fully containerized with Docker and Docker Compose.

CI/CD Pipeline: An automated GitHub Actions workflow runs all tests on every push to ensure code quality and prevent bugs.

🏛️ Architecture
This project is built as a Modular Monolith using TypeScript. The codebase is organized by feature, with a clear separation of concerns between controllers (API layer), services (business logic), and models (data layer). This approach provides the maintainability of microservices while keeping the deployment simple.

🛠️ Tech Stack
Backend
Database & Cache
Real-Time & Authentication
DevOps & Tools
🚀 Getting Started
Prerequisites
Node.js (v18 or later)

Docker Desktop

Git

Installation & Setup
Clone the repository:

Bash

git clone https://github.com/your-username/socialsphere-backend.git
cd socialsphere-backend
Install dependencies:

Bash

npm install
Set up environment variables:
Create a .env file in the root directory and add the necessary variables. Use the .env.example file as a template.

Bash

cp .env.example .env
Now, open the .env file and fill in your keys for MongoDB, Cloudinary, Twilio, and Google.

Run the application with Docker Compose:
This single command will build the Docker image and start the Node.js application, MongoDB database, and Redis cache containers.

Bash

docker-compose up --build
The server will be running on http://localhost:8000.

🧪 Running Tests
To run the automated integration tests, use the following command:

Bash

npm test
.env.example
Code snippet

PORT=8000

# Use mongodb://mongo:27017/socialsphere for Docker, or your Atlas URI
MONGO_URI=mongodb://mongo:27017/socialsphere

# Use redis://redis:6379 for Docker, or redis://localhost:6379 for local Redis
REDIS_URL=redis://redis:6379

# JWT Secrets
ACCESS_TOKEN_SECRET=your-access-token-super-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-refresh-token-super-secret
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary Config
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Twilio Config
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Node Environment
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=






