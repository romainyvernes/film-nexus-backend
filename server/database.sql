CREATE DATABASE filmnexus;

CREATE EXTENSION 'uuid-ossp';

CREATE TABLE users (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_on TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
  creator_id UUID NOT NULL
);

CREATE TABLE project_members (
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  position TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL
);
