-- Initialize the L1tter database
-- This file is automatically executed when the container starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE l1tter_db TO l1tter_user;

-- Create schemas if needed (Prisma will handle table creation)
-- This is just a placeholder for any initial setup
