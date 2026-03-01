--User Table
CREATE TABLE users(
	id SERIAL NOT NULL PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,

);

--Event Table
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,

  -- identity,
  visitor_id TEXT,

  -- event info
  event_type TEXT NOT NULL,
  page TEXT,
  base_url TEXT,
  url TEXT,
  timestamp BIGINT NOT NULL,

  -- element metadata
  element_tag TEXT,
  element_name TEXT,
  element_id TEXT,
  element_classes TEXT,
  element_text TEXT,
  element_role TEXT,
  element_aria_label TEXT,

  parent_tag TEXT,

  -- future-proofing
  selector_finger_print TEXT,
  feature_key TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--Sessions table
CREATE TABLE sessions(
    sid VARCHAR(128) PRIMARY KEY NOT NULL,
    sess JSON,
    expire TIMESTAMP
);


--Insert Into Events
 INSERT INTO events (
      visitor_id,
      event_type,
      inner_text,
      parent_element,
      tag,
      element_id,
      classes,
      aria_label,
      role,
      name
      page,
      base_url,
      timestamp,
    )
    VALUES (
      $1,$2,$3,$4,$5,
      $6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15
    )

--to get the features and their count
SELECT 
	'Feature-' || ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS feature_name,
	COUNT(*) AS event_count
FROM events
GROUP BY LEFT(feature_key, 9)
ORDER BY event_count DESC;

CREATE TABLE magic_tokens(
	id SERIAL NOT NULL PRIMARY KEY,
	user_id INT REFERENCES users(id), 
	token_hash TEXT,
	expires_at TEXT,
	used BOOLEAN
);

CREATE TABLE otp(
	id SERIAL NOT NULL PRIMARY KEY,
	email TEXT,
	otp_hash TEXT,
	otp_expires TEXT,
	attempts INT
);

ALTER TABLE users
ADD  name TEXT;

CREATE TABLE otp_tokens(
	id SERIAL NOT NULL PRIMARY KEY,
	email TEXT,
	otp_hash TEXT NOT NULL,
	expires TIMESTAMP NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE magic_tokens(
	id SERIAL NOT NULL PRIMARY KEY,
	user_id INT REFERENCES user(id) NOT NULL,
	token_hash TEXT NOT NULL,
	expires TIMESTAMP NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  project_url TEXT,
  project_key TEXT UNIQUE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPZ DEFAULT NOW()
);

-- This one covers almost every dashboard query you'll write
-- "give me events for this project in this time range"
CREATE INDEX idx_events_project_time ON events(project_key, timestamp);

-- This one makes visitor/session queries fast
CREATE INDEX idx_events_visitor_time ON events(visitor_id, timestamp);

-- This one makes feature analytics fast, and ignores pageviews entirely
CREATE INDEX idx_events_feature ON events(feature_key, timestamp)
  WHERE event_type != 'pageview';

CREATE TABLE events (
  id                             BIGSERIAL PRIMARY KEY,

  -- Core (shared by all event types)
  project_key                    VARCHAR(64)  NOT NULL,
  visitor_id                     VARCHAR(64)  NOT NULL,
  event_type                     VARCHAR(32)  NOT NULL, -- 'pageview' | 'click' | 'input' | 'focus' | 'submit'

  -- Page context (populated for all events)
  path                           TEXT,
  url                            TEXT,
  title                          TEXT,

  -- Pageview-only fields (NULL for interaction events)
  page_name                      VARCHAR(128),
  hash                           VARCHAR(255),
  source                         VARCHAR(32),  -- 'initial' | 'pushState' | 'popstate' | 'hashchange' | 'mutation'

  -- Interaction-only fields (NULL for pageviews)
  tag                            VARCHAR(32),
  inner_text                     VARCHAR(30),
  element_id                     VARCHAR(128),
  classes                        TEXT,
  aria_label                     VARCHAR(255),
  role                           VARCHAR(64),
  name                           VARCHAR(128),
  feature_key                    VARCHAR(32),
  feature_name                   VARCHAR(128),
  container_tag                  VARCHAR(32),
  container_id                   VARCHAR(128),
  container_classes              TEXT,
  container_selector_fingerprint TEXT,

  -- Time
  timestamp                      BIGINT       NOT NULL,
  created_at                     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


