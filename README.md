# Crop Disease Detection Backend

A comprehensive TypeScript/Express.js backend service for crop disease detection platform with role-based authentication, user management, and administrative features. Built with modern tools and best practices for scalability and maintainability.

## Features

- 🔐 **JWT Authentication** - Secure authentication with access and refresh tokens
- 👥 **Role-Based Access Control** - Admin, Farmer, and User roles with granular permissions
- 🌾 **Farmer Management** - Specialized farmer profiles with field and crop management
- 👨‍💼 **Admin Dashboard** - Complete administrative control and system analytics
- 🗃️ **Prisma ORM** - Type-safe database operations with auto-generated client
- ☁️ **Cloudinary Integration** - Optimized image storage and processing
- 🔍 **Input Validation** - Zod schema validation for all API endpoints
- 📧 **Email Services** - User verification and notification system
- 🖼️ **Image Processing** - Sharp integration for image optimization
- 🚀 **Production Ready** - TypeScript, error handling, rate limiting, and security

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **Image Storage**: Cloudinary
- **Image Processing**: Sharp
- **Email**: Nodemailer
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan
- **Build Tool**: TypeScript Compiler

## Quick Start

### Prerequisites

- Node.js 18.0+
- npm or yarn
- PostgreSQL 13+
- Cloudinary account (for image storage)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/sakibmohammad79/crop-disease-detection-backend
cd crop-disease-detection-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up database**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database
npm run db:seed

# Seed disease data
npm run db:seed:diseases
```

5. **Start the development server**
```bash
npm run dev
```

The server will be available at `http://localhost:3000`

## Environment Configuration

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/crop_disease_db

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Security / Auth
ACCESS_TOKEN_SECRET=your-access-token-secret-min-32-chars
ACCESS_TOKEN_SECRET_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars
REFRESH_TOKEN_SECRET_EXPIRES_IN=15d

# Forgot Password
RESET_PASSWORD_LINK=http://localhost:3000/reset-password
RESET_PASSWORD_TOKEN_SECRET=your-reset-token-secret-min-32-chars
RESET_PASSWORD_EXPIRES_IN=10m

# Gmail Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM_NAME="Crop Disease Detection"
EMAIL_FROM=your-email@gmail.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH=./uploads

# ML Service Configuration
ML_SERVICE_URL=http://localhost:8000
ML_TIMEOUT=30000
```

## User Roles & Permissions

### Admin (`ADMIN`)
- ✅ Full system access and management
- ✅ User management (create, update, suspend, delete)
- ✅ System analytics and reporting
- ✅ Detection monitoring and management
- ✅ Content and disease database management
- ✅ System configuration

### Farmer (`FARMER`)
- ✅ Field and crop management
- ✅ Disease detection requests
- ✅ Detection history and analytics
- ✅ Profile and account management
- ✅ Farmer-specific dashboard
- ❌ User management
- ❌ System administration


## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Building
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server

# Database
npx prisma generate  # Generate Prisma client
npx prisma migrate dev  # Run database migrations
npx prisma studio    # Open Prisma Studio (database GUI)
npm run db:seed      # Seed database with sample data
npm run db:seed:diseases  # Seed disease data

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking
```

### Environment Setup

1. **Database Setup**
```bash
# Create PostgreSQL database
createdb crop_detection

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

2. **Cloudinary Setup**
- Create account at [cloudinary.com](https://cloudinary.com)
- Get API credentials from dashboard
- Add credentials to `.env` file

3. **Email Setup**
- Configure SMTP settings in `.env`
- For Gmail: Enable 2FA and create App Password

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **Input Validation**: Zod schema validation for all endpoints
- **Rate Limiting**: Prevent brute force attacks
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers middleware
- **File Upload Security**: Type, size, and malware scanning
- **SQL Injection Prevention**: Prisma ORM protection
- **XSS Prevention**: Input sanitization



### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (min 32 characters)
- [ ] Configure production database
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Set appropriate rate limits

## API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with TypeScript
4. Add proper type definitions
5. Update Prisma schema if needed
6. Run tests and type checking
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow existing code structure and patterns
- Add proper error handling
- Use Zod for input validation
- Add JSDoc comments for complex functions
- Update Prisma schema for database changes



## Support

- 📧 Email: mohammadsakib7679@gmail.com

---

**Built with ❤️ using TypeScript and modern backend technologies**