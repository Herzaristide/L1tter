# L1tter - Book Reader Application

A full-stack book reader web application built with TypeScript, featuring automatic chapter/paragraph splitting, user authentication, and reading progress tracking.

## Features

### Backend

- **Node.js + Express** API with TypeScript
- **PostgreSQL** database with Prisma ORM
- **JWT-based authentication** with bcrypt password hashing
- **Automatic text processing** - splits books into chapters and paragraphs
- **Reading progress tracking** down to paragraph level
- **RESTful API** endpoints for all operations

### Frontend

- **React** with TypeScript and Tailwind CSS
- **User authentication** with login/signup
- **Book library** with search functionality
- **Reading interface** with smooth navigation
- **Progress tracking** and resume reading feature
- **Responsive design** for all devices

## Database Schema

- **Users** - Authentication and user management
- **Books** - Book metadata (title, author)
- **Chapters** - Automatically detected chapters
- **Paragraphs** - Individual paragraphs for granular reading
- **Progress** - User reading progress tracking

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Podman or Docker (for database)
- npm or yarn

### Option 1: Automated Setup (Recommended)

Run the complete setup script:

**Linux/macOS:**

```bash
chmod +x setup-dev.sh
./setup-dev.sh
```

**Windows:**

```cmd
setup-dev.bat
```

This will automatically:

- Set up PostgreSQL database in Podman
- Install all dependencies
- Run database migrations
- Seed sample data
- Set up both backend and frontend

### Option 2: Manual Setup

#### Database Setup with Podman

1. Start the PostgreSQL database:

**Linux/macOS:**

```bash
chmod +x setup-db.sh
./setup-db.sh
```

**Windows:**

```cmd
setup-db.bat
```

This creates:

- PostgreSQL container on port 5432
- Adminer (database admin) on port 8080
- Database: `l1tter_db`
- User: `l1tter_user`
- Password: `l1tter_password`

#### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Environment variables are already configured for the Podman database

4. Set up the database:

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

5. Start the development server:

```bash
npm run dev
```

#### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Books

- `GET /api/books` - Get user's books
- `POST /api/books` - Upload new book
- `GET /api/books/:id` - Get single book
- `DELETE /api/books/:id` - Delete book
- `GET /api/books/search/:query` - Search books

### Chapters

- `GET /api/chapters/book/:bookId` - Get chapters for a book
- `GET /api/chapters/:id` - Get single chapter with paragraphs

### Paragraphs

- `GET /api/paragraphs/chapter/:chapterId` - Get paragraphs (paginated)
- `GET /api/paragraphs/:id` - Get single paragraph

### Progress

- `GET /api/progress` - Get all user progress
- `GET /api/progress/book/:bookId` - Get progress for specific book
- `POST /api/progress` - Update reading progress
- `DELETE /api/progress/book/:bookId` - Delete progress for book

## Usage

1. **Register/Login** - Create an account or sign in
2. **Upload Books** - Use the upload page to add books (paste text or upload .txt files)
3. **Browse Library** - View all your books with progress indicators
4. **Read Books** - Click on any book to start reading
5. **Track Progress** - Your reading position is automatically saved
6. **Search** - Find books by title or author

## Text Processing

The application automatically processes uploaded text:

- **Chapter Detection**: Looks for "Chapter X" patterns
- **Paragraph Splitting**: Splits text into readable paragraphs
- **Fallback Handling**: If no chapters found, treats entire text as one chapter

## Development

### Backend Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database

### Frontend Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Production Deployment

1. **Backend**:

   - Build: `npm run build`
   - Set production environment variables
   - Run migrations on production database
   - Start: `npm start`

2. **Frontend**:
   - Update `REACT_APP_API_URL` in `.env`
   - Build: `npm run build`
   - Deploy `build` folder to web server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Database Management

### Using the Database Management Scripts

**Linux/macOS:**

```bash
chmod +x db-manage.sh
./db-manage.sh [command]
```

**Windows:**

```cmd
db-manage.bat [command]
```

### Available Commands

- `start` - Start database containers
- `stop` - Stop database containers
- `restart` - Restart database containers
- `status` - Show container status
- `logs` - Show PostgreSQL logs
- `connect` - Connect to PostgreSQL shell
- `backup` - Create database backup
- `restore [file]` - Restore from backup file
- `clean` - Remove containers and volumes ⚠️ (deletes all data!)

### Database Access

- **PostgreSQL**: `localhost:5432`
- **Adminer Web UI**: http://localhost:8080
- **Connection Details**:
  - Host: `localhost` or `l1tter-postgres` (from container)
  - Database: `l1tter_db`
  - Username: `l1tter_user`
  - Password: `l1tter_password`

### Sample Data

The setup includes sample data:

- **Users**: `john@example.com` and `jane@example.com` (password: `password123`)
- **Books**: Sample books with chapters and paragraphs
- **Progress**: Reading progress examples
