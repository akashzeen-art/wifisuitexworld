-- Run on server 159.253.60.41 as postgres superuser:
--   sudo -u postgres psql -f create-wifisuite-db.sql
--
-- Or paste into psql interactively.

-- 1) Create database (owned by existing vpnadmin user)
CREATE DATABASE wifisuite
  OWNER vpnadmin
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8'
  TEMPLATE template0;

-- 2) Connect to new DB and grant schema rights (PostgreSQL 15+)
\c wifisuite

GRANT ALL ON SCHEMA public TO vpnadmin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO vpnadmin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO vpnadmin;

-- 3) Verify
\l wifisuite
\du vpnadmin
