CREATE DATABASE filmnexus;

CREATE EXTENSION 'uuid-ossp';

CREATE TABLE collaborator (
  id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_on TIMESTAMPTZ NOT NULL DEFAULT now()
);
