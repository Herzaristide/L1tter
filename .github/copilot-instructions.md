# L1tter Codebase Guide for AI Coding Agents

## Project Overview

L1tter is a full-stack book reader application with TypeScript backend (Node.js/Express/Prisma) and React frontend. The app automatically processes text/PDF uploads into paragraph-based reading experiences with user authentication and progress tracking.

## Environment & OS

- **Primary development environment:** Windows
- **Shell:** PowerShell (use `;` to join commands)
- **All setup, build, and test scripts are PowerShell/Windows compatible**

## Architecture Patterns

### Database Schema (Simplified from Chapter-based)

- **User** → **Book** → **Paragraph** (direct relationship, no chapters)
- **Progress** tracks user position by `paragraphId` and reading `position`
- Uses Prisma ORM with PostgreSQL, UUIDs for all primary keys
- Recent migration: Removed `Chapter` model entirely, books now contain paragraphs directly

### Backend Structure (`backend/src/`)

- **Routes**: RESTful endpoints in `/routes/` (auth, books, paragraphs, progress)
- **Middleware**: `auth.ts` with JWT Bearer token validation pattern
- **Utils**: `textProcessor.ts` handles PDF parsing and paragraph splitting
- **Key Pattern**: All routes use `authenticateToken` middleware with `AuthRequest` interface

### Frontend Structure (`frontend/src/`)

- **Services**: Axios-based API layer with automatic token injection (`services/api.ts`)
- **Context**: `AuthContext` manages global authentication state
- **Hooks**: Custom hooks like `useBooks`, `useProgress` for stateful operations
- **Routes**: React Router with `ProtectedRoute` wrapper component
- **Modern UI**: All new or updated components must use a clean, modern design (see `UploadBook.tsx`, `Reader.tsx`). Use Tailwind CSS utility classes for layout, spacing, and color. Prioritize accessibility, responsiveness, and a visually appealing reading experience.

## Critical Development Workflows

### Database Operations

```powershell
# Backend directory - essential Prisma commands
npm run db:generate    # After schema changes
npm run db:migrate     # Create/run migrations
npm run db:seed        # Load sample data
npm run db:reset       # Nuclear option
```

### Development Setup

```powershell
# Use provided scripts (handles Podman containers automatically)
setup-dev.bat          # Windows full setup
./test-api.ps1         # PowerShell API testing script
```

### File Upload Architecture

- **Backend**: Multer middleware with memory storage, supports PDF + text files
- **PDF Processing**: Uses `pdf-parse` library to extract text content
- **Endpoint**: `POST /api/books/upload` with FormData (title, author, file)
- **Frontend**: Dual mode - file upload vs. text paste in `UploadBook.tsx`

## Project-Specific Conventions

### API Response Patterns

```typescript
// Books include paragraph count and progress
GET /api/books -> { id, title, author, _count: { paragraphs }, progress[] }

// Progress tracking uses paragraphId (no chapterId)
POST /api/progress -> { bookId, paragraphId, position }
```

### React Component Patterns

- **Services Pattern**: Import from `services/bookService`, not inline fetch
- **Auth Pattern**: Use `useAuth()` hook, not localStorage directly
- **Routing**: `/read/:bookId/:paragraphId?` for reading interface
- **State Management**: Custom hooks over external state libraries
- **Modern UI**: Use Tailwind CSS, responsive layouts, and accessible components. See `UploadBook.tsx` and `Reader.tsx` for examples.

### Text Processing Logic

```typescript
// In textProcessor.ts - paragraph splitting rules
- Split on double newlines or indented lines
- Filter paragraphs < 20 chars (remove artifacts)
- Normalize whitespace, no chapter detection
```

### Authentication Flow

```typescript
// In AuthContext - localStorage + axios interceptors
token → localStorage.setItem('token')
api.interceptors.request → adds Bearer header
401 responses → auto-logout, clear storage
```

## Integration Points

### Database Connection

- Uses `DATABASE_URL` environment variable
- Podman containers: PostgreSQL on `:5432`, Adminer on `:8080`
- Connection details: `l1tter_db`, `l1tter_user`, `l1tter_password`

### Frontend-Backend Communication

- **Development**: Frontend `:3000`, Backend `:3001`
- **Codespaces**: Dynamic hostname detection in `api.ts`
- **Production**: Set `REACT_APP_API_URL` environment variable

### File Processing Pipeline

1. `multer` receives file upload → memory buffer
2. `textProcessor.extractTextFromPDF()` or direct text
3. `splitIntoParagraphs()` creates paragraph array
4. Prisma transaction: create book + paragraphs with order numbers

## Key Files to Reference

- `backend/prisma/schema.prisma` - Current data model (no chapters)
- `backend/src/utils/textProcessor.ts` - Text processing logic
- `frontend/src/services/api.ts` - API client configuration
- `frontend/src/context/AuthContext.tsx` - Authentication patterns
- `frontend/src/pages/Reader.tsx` - Reading interface implementation
- `frontend/src/pages/UploadBook.tsx` - Modern file upload UI

## Common Gotchas

- **Progress tracking**: Use `paragraphId` not `chapterId` (recent migration)
- **File uploads**: Must use FormData for PDF uploads, not JSON
- **Authentication**: All `/api/*` endpoints except `/auth/*` require Bearer token
- **Database**: Run `db:generate` after any schema changes before `db:migrate`
- **Frontend routing**: Book reading uses `/read/:bookId` not `/read/:chapterId`
