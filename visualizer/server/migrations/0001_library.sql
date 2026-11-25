CREATE TABLE IF NOT EXISTS library_revisions (
  owner TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision > 0),
  request_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  document TEXT NOT NULL CHECK (length(CAST(document AS BLOB)) <= 1750000),
  PRIMARY KEY (owner, revision),
  UNIQUE (owner, request_id)
);
