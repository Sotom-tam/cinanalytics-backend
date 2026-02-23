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


