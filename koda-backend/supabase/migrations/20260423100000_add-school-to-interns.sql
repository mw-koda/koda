-- Add school column to interns table
ALTER TABLE interns ADD COLUMN school text;

-- Add school_name column to users table (for coordinators)
ALTER TABLE users ADD COLUMN school_name text;
