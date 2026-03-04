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


UPDATE events
    SET page_name = INITCAP(TRIM(inner_text))
    WHERE event_type = 'pageview'
      AND project_key = 'proj_16abddba0d405800'
      AND inner_text IS NOT NULL
      AND inner_text != ''
  RETURNING *;

  DELETE FROM events
WHERE id IN (

  -- 🔴 Rule 1: Remove duplicates within 3 seconds (keep first)
  SELECT e.id
  FROM events e
  JOIN events e2 ON
    e.visitor_id = e2.visitor_id
    AND e.project_key = e2.project_key
    AND e.path = e2.path
    AND e.event_type = e2.event_type
    AND COALESCE(e.feature_key, '') = COALESCE(e2.feature_key, '')
    AND e.id > e2.id
    AND e.timestamp > e2.timestamp
    AND (e.timestamp - e2.timestamp) < 3000

  UNION

  -- 🔴 Rule 2: Remove clicks shortly after a pageview
  SELECT click_ev.id
  FROM events click_ev
  JOIN events pv ON
    click_ev.visitor_id = pv.visitor_id
    AND click_ev.project_key = pv.project_key
    AND click_ev.path = pv.path
    AND click_ev.event_type = 'click'
    AND pv.event_type = 'pageview'
    AND pv.timestamp <= click_ev.timestamp
    AND (click_ev.timestamp - pv.timestamp) < 3000
);

-- =====================================================
-- LEXCORE CASE MANAGEMENT (Dominant Engagement)
-- Project: proj_028268c1abf9ec55
-- =====================================================
INSERT INTO events (project_key, visitor_id, event_type, path, url, title, page_name, hash, source, tag, inner_text, element_id, classes, aria_label, role, name, feature_key, feature_name, container_tag, container_id, container_classes, container_selector_fingerprint, timestamp) VALUES
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'pageview', '/', 'https://lex-core-casemanagement-3fdeb7.netlify.app/', 'LexCore — Case Management', 'Home', '', 'initial', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735689600000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'click', '/', 'https://lex-core-casemanagement-3fdeb7.netlify.app/', 'LexCore — Case Management', 'Home', '', '', 'A', 'Cases', 'nav-cases', 'nav-item', 'Navigate to cases', 'link', 'cases-nav', 'feat_nav_cases', 'Sidebar Nav', 'NAV', 'sidebar-nav', 'sidebar-nav', 'nav#sidebar-nav', 1735689700000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'pageview', '/cases', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases', 'LexCore — Cases', 'Cases', '', 'navigation', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735689800000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'click', '/cases', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases', 'LexCore — Cases', 'Cases', '', '', 'BUTTON', 'New Case', 'new-case-btn', 'btn-primary', 'Create new case', 'button', 'create-case', 'feat_case_create', 'Create Case', 'DIV', 'cases-header', 'cases-header', 'div.cases-header', 1735689900000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'feature_action', '/cases', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases', 'LexCore — Cases', 'Cases', '', '', 'FORM', '', 'new-case-form', 'case-form', 'Case creation form', 'form', 'case-form', 'feat_case_form', 'Case Form', 'FORM', 'modal-form', 'modal-content', 'form#modal-form', 1735690000000),
('proj_028268c1abf9ec55', 'v_086232125aa9067117250002002', 'pageview', '/', 'https://lex-core-casemanagement-3fdeb7.netlify.app/', 'LexCore — Case Management', 'Home', '', 'initial', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735776000000),
('proj_028268c1abf9ec55', 'v_086232125aa9067117250002002', 'click', '/', 'https://lex-core-casemanagement-3fdeb7.netlify.app/', 'LexCore — Case Management', 'Home', '', '', 'A', 'Clients', 'nav-clients', 'nav-item', 'Navigate to clients', 'link', 'clients-nav', 'feat_nav_clients', 'Sidebar Nav', 'NAV', 'sidebar-nav', 'sidebar-nav', 'nav#sidebar-nav', 1735776100000),
('proj_028268c1abf9ec55', 'v_086232125aa9067117250002002', 'pageview', '/clients', 'https://lex-core-casemanagement-3fdeb7.netlify.app/clients', 'LexCore — Clients', 'Clients', '', 'navigation', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735776200000),
('proj_028268c1abf9ec55', 'v_086232125aa9067117250002002', 'click', '/clients', 'https://lex-core-casemanagement-3fdeb7.netlify.app/clients', 'LexCore — Clients', 'Clients', '', '', 'BUTTON', 'Add Client', 'add-client-btn', 'btn-secondary', 'Add new client', 'button', 'add-client', 'feat_client_add', 'Add Client', 'DIV', 'clients-header', 'clients-header', 'div.clients-header', 1735776300000),
('proj_028268c1abf9ec55', 'v_659844b5594080917250003003', 'pageview', '/', 'https://lex-core-casemanagement-3fdeb7.netlify.app/', 'LexCore — Case Management', 'Home', '', 'initial', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735862400000),
('proj_028268c1abf9ec55', 'v_659844b5594080917250003003', 'click', '/', 'https://lex-core-casemanagement-3fdeb7.netlify.app/', 'LexCore — Case Management', 'Home', '', '', 'A', 'Calendar', 'nav-calendar', 'nav-item', 'Navigate to calendar', 'link', 'calendar-nav', 'feat_nav_calendar', 'Sidebar Nav', 'NAV', 'sidebar-nav', 'sidebar-nav', 'nav#sidebar-nav', 1735862500000),
('proj_028268c1abf9ec55', 'v_659844b5594080917250003003', 'pageview', '/calendar', 'https://lex-core-casemanagement-3fdeb7.netlify.app/calendar', 'LexCore — Calendar', 'Calendar', '', 'navigation', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735862600000),
('proj_028268c1abf9ec55', 'v_659844b5594080917250003003', 'click', '/calendar', 'https://lex-core-casemanagement-3fdeb7.netlify.app/calendar', 'LexCore — Calendar', 'Calendar', '', '', 'BUTTON', 'Add Hearing', 'add-hearing-btn', 'btn-primary', 'Schedule new hearing', 'button', 'schedule-hearing', 'feat_hearing_add', 'Add Hearing', 'DIV', 'calendar-header', 'calendar-header', 'div.calendar-header', 1735862700000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'pageview', '/cases/1001', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1001', 'LexCore — Case #1001', 'Case Detail', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1738368000000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'click', '/cases/1001', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1001', 'LexCore — Case #1001', 'Case Detail', '', '', 'BUTTON', 'Upload Document', 'upload-doc-btn', 'btn-outline', 'Upload case document', 'button', 'upload-doc', 'feat_doc_upload', 'Documents Tab', 'DIV', 'tab-documents', 'tab-pane', 'div#tab-documents', 1738368100000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'feature_action', '/cases/1001', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1001', 'LexCore — Case #1001', 'Case Detail', '', '', 'INPUT', '', 'file-upload', 'file-input', 'Choose file to upload', 'input', 'document-upload', 'feat_doc_select', 'Upload Modal', 'DIV', 'upload-modal', 'modal', 'div#upload-modal', 1738368200000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'click', '/cases/1001', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1001', 'LexCore — Case #1001', 'Case Detail', '', '', 'BUTTON', 'Add Note', 'add-note-btn', 'btn-secondary', 'Add case note', 'button', 'add-note', 'feat_note_add', 'Notes Tab', 'DIV', 'tab-notes', 'tab-pane', 'div#tab-notes', 1738368300000),
('proj_028268c1abf9ec55', 'v_086232125aa9067117250002002', 'pageview', '/cases/1002', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1002', 'LexCore — Case #1002', 'Case Detail', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1738454400000),
('proj_028268c1abf9ec55', 'v_086232125aa9067117250002002', 'click', '/cases/1002', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1002', 'LexCore — Case #1002', 'Case Detail', '', '', 'SELECT', '', 'case-status', 'status-select', 'Change case status', 'combobox', 'status-update', 'feat_status_change', 'Overview Tab', 'DIV', 'tab-overview', 'tab-pane', 'div#tab-overview', 1738454500000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'pageview', '/tasks', 'https://lex-core-casemanagement-3fdeb7.netlify.app/tasks', 'LexCore — Tasks', 'Tasks', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1740787200000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'click', '/tasks', 'https://lex-core-casemanagement-3fdeb7.netlify.app/tasks', 'LexCore — Tasks', 'Tasks', '', '', 'BUTTON', 'Create Task', 'create-task-btn', 'btn-primary', 'Create new task', 'button', 'create-task', 'feat_task_create', 'Tasks Header', 'DIV', 'tasks-header', 'tasks-header', 'div.tasks-header', 1740787300000),
('proj_028268c1abf9ec55', 'v_659844b5594080917250003003', 'pageview', '/calendar', 'https://lex-core-casemanagement-3fdeb7.netlify.app/calendar', 'LexCore — Calendar', 'Calendar', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1740873600000),
('proj_028268c1abf9ec55', 'v_659844b5594080917250003003', 'click', '/calendar', 'https://lex-core-casemanagement-3fdeb7.netlify.app/calendar', 'LexCore — Calendar', 'Calendar', '', '', 'DIV', 'Hearing: Smith vs Jones', 'hearing-1', 'calendar-event', 'View hearing details', 'article', 'hearing-detail', 'feat_hearing_view', 'Calendar Grid', 'DIV', 'calendar-grid', 'calendar-grid', 'div#calendar-grid', 1740873700000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'pageview', '/clients/501', 'https://lex-core-casemanagement-3fdeb7.netlify.app/clients/501', 'LexCore — Client Profile', 'Client Detail', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1743465600000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'click', '/clients/501', 'https://lex-core-casemanagement-3fdeb7.netlify.app/clients/501', 'LexCore — Client Profile', 'Client Detail', '', '', 'BUTTON', 'Edit Client', 'edit-client-btn', 'btn-outline', 'Edit client information', 'button', 'edit-client', 'feat_client_edit', 'Client Header', 'DIV', 'client-header', 'client-header', 'div.client-header', 1743465700000),
('proj_028268c1abf9ec55', 'v_086232125aa9067117250002002', 'pageview', '/cases', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases', 'LexCore — Cases', 'Cases', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1743552000000),
('proj_028268c1abf9ec55', 'v_086232125aa9067117250002002', 'form_submission', '/cases', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases', 'LexCore — Cases', 'Cases', '', '', 'INPUT', '', 'case-search', 'search-input', 'Search cases', 'searchbox', 'search-cases', 'feat_case_search', 'Cases List', 'DIV', 'cases-list', 'cases-table', 'div#cases-list', 1743552100000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'pageview', '/documents', 'https://lex-core-casemanagement-3fdeb7.netlify.app/documents', 'LexCore — Documents', 'Documents', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1746057600000),
('proj_028268c1abf9ec55', 'v_659844b5594080917250003003', 'pageview', '/cases/1003', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1003', 'LexCore — Case #1003', 'Case Detail', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1746144000000),
('proj_028268c1abf9ec55', 'v_659844b5594080917250003003', 'click', '/cases/1003', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1003', 'LexCore — Case #1003', 'Case Detail', '', '', 'BUTTON', 'Delete Document', 'delete-doc-5', 'btn-danger', 'Delete document', 'button', 'delete-doc', 'feat_doc_delete', 'Documents Tab', 'DIV', 'tab-documents', 'tab-pane', 'div#tab-documents', 1746144100000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'pageview', '/reports', 'https://lex-core-casemanagement-3fdeb7.netlify.app/reports', 'LexCore — Reports', 'Reports', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1748736000000),
('proj_028268c1abf9ec55', 'v_086232125aa9067117250002002', 'pageview', '/cases/1004', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1004', 'LexCore — Case #1004', 'Case Detail', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1748822400000),
('proj_028268c1abf9ec55', 'v_086232125aa9067117250002002', 'click', '/cases/1004', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1004', 'LexCore — Case #1004', 'Case Detail', '', '', 'A', 'History', 'tab-history', 'tab-link', 'View case history', 'tab', 'history-tab', 'feat_tab_history', 'Case Tabs', 'DIV', 'case-tabs', 'tabs', 'div#case-tabs', 1748822500000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'pageview', '/calendar', 'https://lex-core-casemanagement-3fdeb7.netlify.app/calendar', 'LexCore — Calendar', 'Calendar', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1751328000000),
('proj_028268c1abf9ec55', 'v_659844b5594080917250003003', 'pageview', '/tasks', 'https://lex-core-casemanagement-3fdeb7.netlify.app/tasks', 'LexCore — Tasks', 'Tasks', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1751414400000),
('proj_028268c1abf9ec55', 'v_659844b5594080917250003003', 'click', '/tasks', 'https://lex-core-casemanagement-3fdeb7.netlify.app/tasks', 'LexCore — Tasks', 'Tasks', '', '', 'INPUT', '', 'task-check-23', 'task-checkbox', 'Mark task complete', 'checkbox', 'task-complete', 'feat_task_complete', 'Task List', 'UL', 'task-list', 'task-items', 'ul#task-list', 1751414500000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'pageview', '/clients', 'https://lex-core-casemanagement-3fdeb7.netlify.app/clients', 'LexCore — Clients', 'Clients', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1754006400000),
('proj_028268c1abf9ec55', 'v_086232125aa9067117250002002', 'pageview', '/cases/1005', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1005', 'LexCore — Case #1005', 'Case Detail', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1754092800000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'pageview', '/documents', 'https://lex-core-casemanagement-3fdeb7.netlify.app/documents', 'LexCore — Documents', 'Documents', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1756684800000),
('proj_028268c1abf9ec55', 'v_659844b5594080917250003003', 'pageview', '/cases', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases', 'LexCore — Cases', 'Cases', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1756771200000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'pageview', '/calendar', 'https://lex-core-casemanagement-3fdeb7.netlify.app/calendar', 'LexCore — Calendar', 'Calendar', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1759363200000),
('proj_028268c1abf9ec55', 'v_086232125aa9067117250002002', 'pageview', '/tasks', 'https://lex-core-casemanagement-3fdeb7.netlify.app/tasks', 'LexCore — Tasks', 'Tasks', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1759449600000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'pageview', '/cases/1006', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1006', 'LexCore — Case #1006', 'Case Detail', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1762041600000),
('proj_028268c1abf9ec55', 'v_659844b5594080917250003003', 'pageview', '/clients/502', 'https://lex-core-casemanagement-3fdeb7.netlify.app/clients/502', 'LexCore — Client Profile', 'Client Detail', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1762128000000),
('proj_028268c1abf9ec55', 'v_597b015098106a1177250001001', 'pageview', '/reports/year-end', 'https://lex-core-casemanagement-3fdeb7.netlify.app/reports/year-end', 'LexCore — Year End Report', 'Reports', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1764633600000),
('proj_028268c1abf9ec55', 'v_086232125aa9067117250002002', 'pageview', '/calendar', 'https://lex-core-casemanagement-3fdeb7.netlify.app/calendar', 'LexCore — Calendar', 'Calendar', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1764720000000);

-- =====================================================
-- SMARTFRIEND (Neck-and-neck with Settl)
-- Project: proj_749d62a894383850
-- =====================================================
INSERT INTO events (project_key, visitor_id, event_type, path, url, title, page_name, hash, source, tag, inner_text, element_id, classes, aria_label, role, name, feature_key, feature_name, container_tag, container_id, container_classes, container_selector_fingerprint, timestamp) VALUES
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/', 'https://precious-pie-1838fd.netlify.app/', 'SmartFriend — Learning Made Clear', 'Home', '', 'initial', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735689600000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'click', '/', 'https://precious-pie-1838fd.netlify.app/', 'SmartFriend — Learning Made Clear', 'Home', '', '', 'BUTTON', '◈ Dashboard', 'dashboardBtn', 'nav-btn dashboard-btn', 'Go to dashboard', 'button', 'dashboard-nav', 'feat_102nr4h00000', 'Sidebar', 'ASIDE', 'sidebar', 'sidebar', 'aside#sidebar', 1735689700000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735689800000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'click', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', '', 'BUTTON', '🧬 Biology', 'nav-biology', 'nav-subject-btn', 'Study Biology', 'button', 'subject-biology', 'feat_duha5z000000', 'Subject Nav', 'NAV', 'subjectNav', 'sidebar-nav', 'nav#subjectNav', 1735689900000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/lesson/biology', 'https://precious-pie-1838fd.netlify.app/lesson/biology', 'SmartFriend — Biology', 'Biology', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735690000000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'click', '/lesson/biology', 'https://precious-pie-1838fd.netlify.app/lesson/biology', 'SmartFriend — Biology', 'Biology', '', '', 'BUTTON', 'Take Quiz →', 'takeQuizBtn', 'btn-quiz', 'Start biology quiz', 'button', 'start-quiz', 'feat_1ve0gjl00000', 'View', 'SECTION', 'view-active', 'view', 'div#app > section.view', 1735690100000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/lesson/biology/quiz', 'https://precious-pie-1838fd.netlify.app/lesson/biology/quiz', 'SmartFriend — Quiz: Biology', 'Quiz', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735690200000),
('proj_749d62a894383850', 'v_086232125aa9067117250005005', 'pageview', '/', 'https://precious-pie-1838fd.netlify.app/', 'SmartFriend — Learning Made Clear', 'Home', '', 'initial', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735776000000),
('proj_749d62a894383850', 'v_086232125aa9067117250005005', 'click', '/', 'https://precious-pie-1838fd.netlify.app/', 'SmartFriend — Learning Made Clear', 'Home', '', '', 'BUTTON', '📐 Mathematics', 'nav-maths', 'nav-subject-btn', 'Study Mathematics', 'button', 'subject-maths', 'feat_duha5z000000', 'Subject Nav', 'NAV', 'subjectNav', 'sidebar-nav', 'nav#subjectNav', 1735776100000),
('proj_749d62a894383850', 'v_086232125aa9067117250005005', 'pageview', '/lesson/mathematics', 'https://precious-pie-1838fd.netlify.app/lesson/mathematics', 'SmartFriend — Mathematics', 'Mathematics', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735776200000),
('proj_749d62a894383850', 'v_659844b5594080917250006006', 'pageview', '/', 'https://precious-pie-1838fd.netlify.app/', 'SmartFriend — Learning Made Clear', 'Home', '', 'initial', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735862400000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1738368000000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'click', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', '', 'BUTTON', '⚡ Physics', 'nav-physics', 'nav-subject-btn', 'Study Physics', 'button', 'subject-physics', 'feat_duha5z000000', 'Subject Nav', 'NAV', 'subjectNav', 'sidebar-nav', 'nav#subjectNav', 1738368100000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/lesson/physics', 'https://precious-pie-1838fd.netlify.app/lesson/physics', 'SmartFriend — Physics', 'Physics', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1738368200000),
('proj_749d62a894383850', 'v_086232125aa9067117250005005', 'pageview', '/lesson/biology', 'https://precious-pie-1838fd.netlify.app/lesson/biology', 'SmartFriend — Biology', 'Biology', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1738454400000),
('proj_749d62a894383850', 'v_086232125aa9067117250005005', 'click', '/lesson/biology', 'https://precious-pie-1838fd.netlify.app/lesson/biology', 'SmartFriend — Biology', 'Biology', '', '', 'BUTTON', 'Take Quiz →', 'takeQuizBtn', 'btn-quiz', 'Start biology quiz', 'button', 'start-quiz', 'feat_1ve0gjl00000', 'View', 'SECTION', 'view-active', 'view', 'div#app > section.view', 1738454500000),
('proj_749d62a894383850', 'v_086232125aa9067117250005005', 'pageview', '/lesson/biology/quiz', 'https://precious-pie-1838fd.netlify.app/lesson/biology/quiz', 'SmartFriend — Quiz: Biology', 'Quiz', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1738454600000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/lesson/english', 'https://precious-pie-1838fd.netlify.app/lesson/english', 'SmartFriend — English', 'English', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1740787200000),
('proj_749d62a894383850', 'v_659844b5594080917250006006', 'pageview', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1740873600000),
('proj_749d62a894383850', 'v_659844b5594080917250006006', 'click', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', '', 'BUTTON', '📐 Mathematics', 'nav-maths', 'nav-subject-btn', 'Study Mathematics', 'button', 'subject-maths', 'feat_duha5z000000', 'Subject Nav', 'NAV', 'subjectNav', 'sidebar-nav', 'nav#subjectNav', 1740873700000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/lesson/biology/quiz', 'https://precious-pie-1838fd.netlify.app/lesson/biology/quiz', 'SmartFriend — Quiz: Biology', 'Quiz', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1743465600000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'click', '/lesson/biology/quiz', 'https://precious-pie-1838fd.netlify.app/lesson/biology/quiz', 'SmartFriend — Quiz: Biology', 'Quiz', '', '', 'LABEL', 'Mitochondria', 'option-1', 'option-label', 'Select answer', 'label', 'answer-1', 'feat_h2xu8t000000', 'Options List', 'DIV', 'options-list', 'options-list', 'div#quizQuestions > div.options-list', 1743465700000),
('proj_749d62a894383850', 'v_086232125aa9067117250005005', 'pageview', '/lesson/physics', 'https://precious-pie-1838fd.netlify.app/lesson/physics', 'SmartFriend — Physics', 'Physics', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1743552000000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1746057600000),
('proj_749d62a894383850', 'v_659844b5594080917250006006', 'pageview', '/lesson/biology', 'https://precious-pie-1838fd.netlify.app/lesson/biology', 'SmartFriend — Biology', 'Biology', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1746144000000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/lesson/mathematics/quiz', 'https://precious-pie-1838fd.netlify.app/lesson/mathematics/quiz', 'SmartFriend — Quiz: Mathematics', 'Quiz', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1748736000000),
('proj_749d62a894383850', 'v_086232125aa9067117250005005', 'pageview', '/lesson/english', 'https://precious-pie-1838fd.netlify.app/lesson/english', 'SmartFriend — English', 'English', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1748822400000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1751328000000),
('proj_749d62a894383850', 'v_659844b5594080917250006006', 'pageview', '/lesson/physics/quiz', 'https://precious-pie-1838fd.netlify.app/lesson/physics/quiz', 'SmartFriend — Quiz: Physics', 'Quiz', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1751414400000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/lesson/biology', 'https://precious-pie-1838fd.netlify.app/lesson/biology', 'SmartFriend — Biology', 'Biology', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1754006400000),
('proj_749d62a894383850', 'v_086232125aa9067117250005005', 'pageview', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1754092800000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/lesson/mathematics', 'https://precious-pie-1838fd.netlify.app/lesson/mathematics', 'SmartFriend — Mathematics', 'Mathematics', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1756684800000),
('proj_749d62a894383850', 'v_659844b5594080917250006006', 'pageview', '/lesson/biology/quiz', 'https://precious-pie-1838fd.netlify.app/lesson/biology/quiz', 'SmartFriend — Quiz: Biology', 'Quiz', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1756771200000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1759363200000),
('proj_749d62a894383850', 'v_086232125aa9067117250005005', 'pageview', '/lesson/english/quiz', 'https://precious-pie-1838fd.netlify.app/lesson/english/quiz', 'SmartFriend — Quiz: English', 'Quiz', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1759449600000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/lesson/physics', 'https://precious-pie-1838fd.netlify.app/lesson/physics', 'SmartFriend — Physics', 'Physics', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1762041600000),
('proj_749d62a894383850', 'v_659844b5594080917250006006', 'pageview', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1762128000000),
('proj_749d62a894383850', 'v_597b015098106a1177250004004', 'pageview', '/lesson/biology', 'https://precious-pie-1838fd.netlify.app/lesson/biology', 'SmartFriend — Biology', 'Biology', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1764633600000),
('proj_749d62a894383850', 'v_086232125aa9067117250005005', 'pageview', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1764720000000);


-- =====================================================
-- SETTL SAAS SETTINGS (Neck-and-neck with SmartFriend)
-- Project: proj_0e1eaec4fe1f20e9
-- =====================================================
INSERT INTO events (project_key, visitor_id, event_type, path, url, title, page_name, hash, source, tag, inner_text, element_id, classes, aria_label, role, name, feature_key, feature_name, container_tag, container_id, container_classes, container_selector_fingerprint, timestamp) VALUES
('proj_0e1eaec4fe1f20e9', 'v_6723478210b24b2177250007007', 'pageview', '/', 'https://saas-settings-741d34.netlify.app/', 'Settl — Settings', 'Home', '', 'initial', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735689600000),
('proj_0e1eaec4fe1f20e9', 'v_8051a3a994aa854177250008008', 'pageview', '/', 'https://saas-settings-741d34.netlify.app/', 'Settl — Settings', 'Home', '', 'initial', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735776000000),
('proj_0e1eaec4fe1f20e9', 'v_8051a3a994aa854177250008008', 'click', '/', 'https://saas-settings-741d34.netlify.app/', 'Settl — Settings', 'Home', '', '', 'A', 'Team', 'nav-team', 'nav-item', 'Team settings', 'link', 'team-nav', 'feat_p8rep8000000', 'Nav Team', 'A', 'nav-item', 'nav-item', 'nav#sidebarNav > a.nav-item', 1735776100000),
('proj_0e1eaec4fe1f20e9', 'v_8051a3a994aa854177250008008', 'pageview', '/team', 'https://saas-settings-741d34.netlify.app/team', 'Settl — Team', 'Team', '', 'navigation', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735776200000),
('proj_0e1eaec4fe1f20e9', 'v_748116400b00785177250009009', 'pageview', '/', 'https://saas-settings-741d34.netlify.app/', 'Settl — Settings', 'Home', '', 'initial', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735862400000),
('proj_0e1eaec4fe1f20e9', 'v_6723478210b24b2177250007007', 'pageview', '/profile', 'https://saas-settings-741d34.netlify.app/profile', 'Settl — Profile', 'Profile', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1738368000000),
('proj_0e1eaec4fe1f20e9', 'v_6723478210b24b2177250007007', 'form_submission', '/profile', 'https://saas-settings-741d34.netlify.app/profile', 'Settl — Profile', 'Profile', '', '', 'FORM', '', 'profile-form', 'settings-form', 'Update profile', 'form', 'update-profile', 'feat_profile_update', 'Profile Form', 'FORM', 'profile-settings', 'settings-form', 'form#profile-settings', 1738368100000),
('proj_0e1eaec4fe1f20e9', 'v_8051a3a994aa854177250008008', 'pageview', '/billing', 'https://saas-settings-741d34.netlify.app/billing', 'Settl — Billing', 'Billing', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1738454400000),
('proj_0e1eaec4fe1f20e9', 'v_8051a3a994aa854177250008008', 'click', '/billing', 'https://saas-settings-741d34.netlify.app/billing', 'Settl — Billing', 'Billing', '', '', 'BUTTON', 'Upgrade Plan', 'upgrade-plan', 'btn-primary', 'Upgrade subscription', 'button', 'upgrade', 'feat_plan_upgrade', 'Current Plan', 'DIV', 'current-plan', 'plan-card', 'div#current-plan', 1738454500000),
('proj_0e1eaec4fe1f20e9', 'v_748116400b00785177250009009', 'pageview', '/preferences', 'https://saas-settings-741d34.netlify.app/preferences', 'Settl — Preferences', 'Preferences', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1740787200000),
('proj_0e1eaec4fe1f20e9', 'v_748116400b00785177250009009', 'click', '/preferences', 'https://saas-settings-741d34.netlify.app/preferences', 'Settl — Preferences', 'Preferences', '', '', 'BUTTON', 'Dark Mode', 'dark-mode-toggle', 'toggle-switch', 'Toggle dark mode', 'switch', 'dark-mode', 'feat_toggle_dark_mode', 'Preferences', 'DIV', 'pref-appearance', 'pref-section', 'div#pref-appearance', 1740787300000),
('proj_0e1eaec4fe1f20e9', 'v_6723478210b24b2177250007007', 'pageview', '/team', 'https://saas-settings-741d34.netlify.app/team', 'Settl — Team', 'Team', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1743465600000),
('proj_0e1eaec4fe1f20e9', 'v_6723478210b24b2177250007007', 'click', '/team', 'https://saas-settings-741d34.netlify.app/team', 'Settl — Team', 'Team', '', '', 'BUTTON', 'Invite Member', 'invite-member', 'btn-primary', 'Invite team member', 'button', 'invite', 'feat_team_invite', 'Team Header', 'DIV', 'team-header', 'team-header', 'div.team-header', 1743465700000),
('proj_0e1eaec4fe1f20e9', 'v_8051a3a994aa854177250008008', 'pageview', '/billing', 'https://saas-settings-741d34.netlify.app/billing', 'Settl — Billing', 'Billing', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1746057600000),
('proj_0e1eaec4fe1f20e9', 'v_8051a3a994aa854177250008008', 'click', '/billing', 'https://saas-settings-741d34.netlify.app/billing', 'Settl — Billing', 'Billing', '', '', 'BUTTON', 'Update Payment', 'update-payment', 'btn-outline', 'Update payment method', 'button', 'payment', 'feat_payment_update', 'Payment Method', 'DIV', 'payment-method', 'payment-card', 'div#payment-method', 1746057700000),
('proj_0e1eaec4fe1f20e9', 'v_748116400b00785177250009009', 'pageview', '/profile', 'https://saas-settings-741d34.netlify.app/profile', 'Settl — Profile', 'Profile', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1748736000000),
('proj_0e1eaec4fe1f20e9', 'v_6723478210b24b2177250007007', 'pageview', '/team', 'https://saas-settings-741d34.netlify.app/team', 'Settl — Team', 'Team', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1751328000000),
('proj_0e1eaec4fe1f20e9', 'v_6723478210b24b2177250007007', 'click', '/team', 'https://saas-settings-741d34.netlify.app/team', 'Settl — Team', 'Team', '', '', 'BUTTON', 'Remove Member', 'remove-john', 'btn-danger', 'Remove team member', 'button', 'remove', 'feat_member_remove', 'Members Table', 'TABLE', 'members-table', 'members', 'table#members-table', 1751328100000),
('proj_0e1eaec4fe1f20e9', 'v_8051a3a994aa854177250008008', 'pageview', '/preferences', 'https://saas-settings-741d34.netlify.app/preferences', 'Settl — Preferences', 'Preferences', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1754006400000),
('proj_0e1eaec4fe1f20e9', 'v_748116400b00785177250009009', 'pageview', '/billing', 'https://saas-settings-741d34.netlify.app/billing', 'Settl — Billing', 'Billing', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1756684800000),
('proj_0e1eaec4fe1f20e9', 'v_6723478210b24b2177250007007', 'pageview', '/team', 'https://saas-settings-741d34.netlify.app/team', 'Settl — Team', 'Team', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1759363200000),
('proj_0e1eaec4fe1f20e9', 'v_8051a3a994aa854177250008008', 'pageview', '/profile', 'https://saas-settings-741d34.netlify.app/profile', 'Settl — Profile', 'Profile', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1762041600000),
('proj_0e1eaec4fe1f20e9', 'v_748116400b00785177250009009', 'pageview', '/preferences', 'https://saas-settings-741d34.netlify.app/preferences', 'Settl — Preferences', 'Preferences', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1764633600000);


-- =====================================================
-- INTERACTIVE DEMO APP (Lower but active engagement)
-- Project: proj_16abddba0d405800
-- =====================================================
INSERT INTO events (project_key, visitor_id, event_type, path, url, title, page_name, hash, source, tag, inner_text, element_id, classes, aria_label, role, name, feature_key, feature_name, container_tag, container_id, container_classes, container_selector_fingerprint, timestamp) VALUES
('proj_16abddba0d405800', 'v_03657a63b41142b6177250010010', 'pageview', '/', 'https://feature-tracker-sdk.vercel.app/', 'Interactive Demo App', 'Home', '', 'initial', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735689600000),
('proj_16abddba0d405800', 'v_2a781564652bb991772500110011', 'pageview', '/', 'https://feature-tracker-sdk.vercel.app/', 'Interactive Demo App', 'Home', '', 'initial', '', '', '', '', '', '', '', '', '', '', '', '', '', 1735776000000),
('proj_16abddba0d405800', 'v_03657a63b41142b6177250010010', 'pageview', '/features', 'https://feature-tracker-sdk.vercel.app/features', 'Features Overview', 'features', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1738368000000),
('proj_16abddba0d405800', 'v_2a781564652bb991772500110011', 'pageview', '/docs', 'https://feature-tracker-sdk.vercel.app/docs', 'Documentation', 'docs', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1740787200000),
('proj_16abddba0d405800', 'v_03657a63b41142b6177250010010', 'pageview', '/', 'https://feature-tracker-sdk.vercel.app/', 'Interactive Demo App', 'Home', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1743465600000),
('proj_16abddba0d405800', 'v_2a781564652bb991772500110011', 'pageview', '/pricing', 'https://feature-tracker-sdk.vercel.app/pricing', 'Pricing Plans', 'pricing', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1746057600000),
('proj_16abddba0d405800', 'v_03657a63b41142b6177250010010', 'pageview', '/', 'https://feature-tracker-sdk.vercel.app/', 'Interactive Demo App', 'Home', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1748736000000),
('proj_16abddba0d405800', 'v_2a781564652bb991772500110011', 'pageview', '/blog', 'https://feature-tracker-sdk.vercel.app/blog', 'Product Blog', 'blog', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1751328000000),
('proj_16abddba0d405800', 'v_03657a63b41142b6177250010010', 'pageview', '/', 'https://feature-tracker-sdk.vercel.app/', 'Interactive Demo App', 'Home', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1754006400000),
('proj_16abddba0d405800', 'v_2a781564652bb991772500110011', 'pageview', '/changelog', 'https://feature-tracker-sdk.vercel.app/changelog', 'Changelog', 'changelog', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1756684800000),
('proj_16abddba0d405800', 'v_03657a63b41142b6177250010010', 'pageview', '/', 'https://feature-tracker-sdk.vercel.app/', 'Interactive Demo App', 'Home', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1759363200000),
('proj_16abddba0d405800', 'v_2a781564652bb991772500110011', 'pageview', '/contact', 'https://feature-tracker-sdk.vercel.app/contact', 'Contact Us', 'contact', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1762041600000),
('proj_16abddba0d405800', 'v_03657a63b41142b6177250010010', 'pageview', '/', 'https://feature-tracker-sdk.vercel.app/', 'Interactive Demo App', 'Home', '', 'pushState', '', '', '', '', '', '', '', '', '', '', '', '', '', 1764633600000);

WITH monthly_totals AS (
    SELECT 
        DATE_TRUNC('month', TO_TIMESTAMP(timestamp/1000)) AS month_value,
        COUNT(*) AS total_interactions_per_month
    FROM events
    WHERE TO_TIMESTAMP(timestamp/1000) < '2026-01-01'::date
    GROUP BY DATE_TRUNC('month', TO_TIMESTAMP(timestamp/1000))
),
project_totals AS (
    SELECT 
        events.project_key,
        COUNT(CASE WHEN events.event_type = 'click' THEN 1 END) AS total_project_interactions
    FROM events
    WHERE TO_TIMESTAMP(events.timestamp/1000) < '2026-01-01'::date
    GROUP BY events.project_key
    ORDER BY total_project_interactions DESC
    LIMIT 3
)
SELECT events.project_key,
projects.project_name,
TO_CHAR(TO_TIMESTAMP(events.timestamp/1000),'Month') AS month_name,
COUNT (events.event_type='click') AS project_interactions,
ROUND(COUNT (events.event_type='click')::NUMERIC/monthly_totals.total_interactions_per_month * 100) AS percentage_interactions,
projects.project_icon,
DATE_TRUNC('month',TO_TIMESTAMP(events.timestamp/1000)) AS month_value
FROM events
JOIN projects ON events.project_key=projects.project_key
JOIN project_totals ON  events.project_key=project_totals.project_key
LEFT JOIN monthly_totals ON DATE_TRUNC('month', TO_TIMESTAMP(events.timestamp/1000)) = monthly_totals.month_value
WHERE TO_TIMESTAMP(events.timestamp/1000)<'2026-01-01'::date
GROUP BY events.project_key,
projects.project_name,
projects.project_icon,
monthly_totals.total_interactions_per_month,
DATE_TRUNC('month',TO_TIMESTAMP(events.timestamp/1000)),TO_CHAR(TO_TIMESTAMP(events.timestamp/1000),'Month')
ORDER BY MIN(DATE_TRUNC('month',TO_TIMESTAMP(events.timestamp/1000))),events.project_key ASC

WITH overall_total AS (
  SELECT COUNT(*) AS all_projects_total FROM events
),
visitor_events AS (
  SELECT
    *,
    LAG(timestamp) OVER (PARTITION BY visitor_id ORDER BY timestamp) AS prev_ts
  FROM events
),
sessionized AS (
  SELECT
    *,
    SUM(
      CASE 
        WHEN prev_ts IS NULL THEN 1
        WHEN (timestamp - prev_ts) > 30 * 60 * 1000 THEN 1 -- 30 minutes gap in ms
        ELSE 0
      END
    ) OVER (PARTITION BY visitor_id ORDER BY timestamp) AS session_number
  FROM visitor_events
),
session_time_data AS(
SELECT visitor_id, project_key, session_number,
(MAX(timestamp)-MIN(timestamp))/1000 AS session_time_secs,
(MAX(timestamp)-MIN(timestamp))/60000 AS session_time_mins,
MIN(timestamp) AS session_start, MAX(timestamp) AS session_end
FROM sessionized
GROUP BY visitor_id, session_number,project_key
ORDER BY visitor_id, session_start,project_key
),
project_details AS(
  SELECT events.project_key,
  COUNT (DISTINCT visitor_id) AS project_users,
  COUNT (CASE WHEN event_type = 'click' THEN 1 END ) AS project_interactions,
  ROUND(
    (COUNT(CASE WHEN event_type = 'click' THEN 1 END)::NUMERIC / COUNT(*) * 100), 
    2
  ) AS click_percentage
  FROM events
  GROUP BY project_key
)
SELECT session_time_data.project_key,projects.project_name,
project_details.project_users,
project_details.project_interactions,
overall_total.all_projects_total AS total_interactions,
ROUND((project_details.project_interactions::numeric/overall_total.all_projects_total) *100) AS percentage_interactions,
ROUND(AVG(session_time_mins),3) AS average_session_time
FROM session_time_data
JOIN projects ON projects.project_key=session_time_data.project_key
JOIN project_details ON project_details.project_key=session_time_data.project_key
CROSS JOIN overall_total
GROUP BY session_time_data.project_key,
project_details.project_users,
project_details.project_interactions,
projects.project_name,
overall_total.all_projects_total
ORDER BY project_details.project_users DESC


-- JANUARY 2025 - Total extra clicks: 65
-- LexCore (40%): 26 clicks
INSERT INTO events (project_key, visitor_id, event_type, path, url, title, page_name, hash, source, tag, inner_text, element_id, classes, aria_label, role, name, feature_key, feature_name, container_tag, container_id, container_classes, container_selector_fingerprint, timestamp) VALUES
('proj_028268c1abf9ec55', 'v_lex_extra_jan_001', 'click', '/', 'https://lex-core-casemanagement-3fdeb7.netlify.app/', 'LexCore — Case Management', 'Home', '', '', 'BUTTON', 'Quick Case', 'quick-case-1', 'btn-sm', 'Create quick case', 'button', 'quick-case', 'feat_quick_case', 'Quick Actions', 'DIV', 'quick-actions', 'dashboard', 'div.quick-actions', 1735689900000),
('proj_028268c1abf9ec55', 'v_lex_extra_jan_001', 'click', '/cases', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases', 'LexCore — Cases', 'Cases', '', '', 'BUTTON', 'Export List', 'export-list', 'btn-outline-sm', 'Export cases', 'button', 'export', 'feat_export', 'Cases Toolbar', 'DIV', 'cases-toolbar', 'toolbar', 'div.cases-toolbar', 1735690200000),
('proj_028268c1abf9ec55', 'v_lex_extra_jan_002', 'click', '/clients', 'https://lex-core-casemanagement-3fdeb7.netlify.app/clients', 'LexCore — Clients', 'Clients', '', '', 'BUTTON', 'View Profile', 'view-client-23', 'client-row', 'View client details', 'button', 'view-client', 'feat_client_view', 'Clients List', 'TABLE', 'clients-table', 'data-table', 'table.clients-table', 1735690300000),
('proj_028268c1abf9ec55', 'v_lex_extra_jan_002', 'click', '/calendar', 'https://lex-core-casemanagement-3fdeb7.netlify.app/calendar', 'LexCore — Calendar', 'Calendar', '', '', 'DIV', 'Smith Hearing', 'event-45', 'calendar-event', 'View hearing', 'button', 'view-hearing', 'feat_hearing_view', 'Calendar Grid', 'DIV', 'calendar-grid', 'grid', 'div.calendar-grid', 1735690400000),
('proj_028268c1abf9ec55', 'v_lex_extra_jan_003', 'click', '/tasks', 'https://lex-core-casemanagement-3fdeb7.netlify.app/tasks', 'LexCore — Tasks', 'Tasks', '', '', 'INPUT', '', 'task-78', 'task-checkbox', 'Mark complete', 'checkbox', 'task-complete', 'feat_task_complete', 'Task List', 'UL', 'task-list', 'tasks', 'ul.task-list', 1735690500000),
('proj_028268c1abf9ec55', 'v_lex_extra_jan_003', 'click', '/cases/1050', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1050', 'LexCore — Case #1050', 'Case Detail', '', '', 'BUTTON', 'Add Document', 'add-doc-1050', 'btn-outline', 'Upload document', 'button', 'upload-doc', 'feat_doc_upload', 'Documents Tab', 'DIV', 'tab-documents', 'tab-pane', 'div#tab-documents', 1735690600000),
('proj_028268c1abf9ec55', 'v_lex_extra_jan_004', 'click', '/cases', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases', 'LexCore — Cases', 'Cases', '', '', 'BUTTON', 'Apply Filter', 'apply-filter', 'btn-secondary', 'Filter cases', 'button', 'apply-filter', 'feat_filter_apply', 'Filter Panel', 'DIV', 'filter-panel', 'filters', 'div.filter-panel', 1735690700000),
('proj_028268c1abf9ec55', 'v_lex_extra_jan_004', 'click', '/clients/520', 'https://lex-core-casemanagement-3fdeb7.netlify.app/clients/520', 'LexCore — Client Profile', 'Client Detail', '', '', 'BUTTON', 'Edit Details', 'edit-client-520', 'btn-edit', 'Edit client', 'button', 'edit-client', 'feat_client_edit', 'Client Header', 'DIV', 'client-header', 'header', 'div.client-header', 1735690800000),
('proj_028268c1abf9ec55', 'v_lex_extra_jan_005', 'click', '/cases/1051', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1051', 'LexCore — Case #1051', 'Case Detail', '', '', 'BUTTON', 'Add Note', 'add-note-1051', 'btn-secondary', 'Add case note', 'button', 'add-note', 'feat_note_add', 'Notes Tab', 'DIV', 'tab-notes', 'tab-pane', 'div#tab-notes', 1735690900000),
('proj_028268c1abf9ec55', 'v_lex_extra_jan_005', 'click', '/calendar', 'https://lex-core-casemanagement-3fdeb7.netlify.app/calendar', 'LexCore — Calendar', 'Calendar', '', '', 'BUTTON', 'Next Month', 'next-month', 'calendar-nav', 'Next month', 'button', 'next-month', 'feat_calendar_nav', 'Calendar Header', 'DIV', 'calendar-header', 'header', 'div.calendar-header', 1735691000000),
('proj_028268c1abf9ec55', 'v_lex_extra_jan_006', 'click', '/', 'https://lex-core-casemanagement-3fdeb7.netlify.app/', 'LexCore — Case Management', 'Home', '', '', 'BUTTON', 'View Reports', 'reports-card', 'dashboard-card', 'View reports', 'button', 'view-reports', 'feat_reports_view', 'Dashboard Grid', 'DIV', 'dashboard-grid', 'dashboard', 'div.dashboard-grid', 1735691100000),
('proj_028268c1abf9ec55', 'v_lex_extra_jan_006', 'click', '/tasks', 'https://lex-core-casemanagement-3fdeb7.netlify.app/tasks', 'LexCore — Tasks', 'Tasks', '', '', 'BUTTON', 'New Task', 'new-task', 'btn-primary', 'Create task', 'button', 'create-task', 'feat_task_create', 'Tasks Header', 'DIV', 'tasks-header', 'header', 'div.tasks-header', 1735691200000),
('proj_028268c1abf9ec55', 'v_lex_extra_jan_007', 'click', '/cases/1052', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases/1052', 'LexCore — Case #1052', 'Case Detail', '', '', 'SELECT', 'In Progress', 'status-1052', 'status-select', 'Change status', 'select', 'status', 'feat_status_change', 'Overview Tab', 'DIV', 'tab-overview', 'tab-pane', 'div#tab-overview', 1735691300000),
('proj_028268c1abf9ec55', 'v_lex_extra_jan_007', 'click', '/clients', 'https://lex-core-casemanagement-3fdeb7.netlify.app/clients', 'LexCore — Clients', 'Clients', '', '', 'INPUT', '', 'search-clients', 'search-input', 'Search clients', 'search', 'search', 'feat_client_search', 'Clients Header', 'DIV', 'clients-header', 'header', 'div.clients-header', 1735691400000),
('proj_028268c1abf9ec55', 'v_lex_extra_jan_008', 'click', '/', 'https://lex-core-casemanagement-3fdeb7.netlify.app/', 'LexCore — Case Management', 'Home', '', '', 'A', 'Cases', 'nav-cases-2', 'nav-item', 'Navigate to cases', 'link', 'cases-nav', 'feat_nav_cases', 'Sidebar', 'NAV', 'sidebar', 'main-nav', 'nav#sidebar', 1735691500000),

-- SmartFriend (30% of remaining): 19 clicks
('proj_749d62a894383850', 'v_smart_extra_jan_001', 'click', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', '', 'BUTTON', '🔬 Biology', 'bio-nav', 'subject-nav', 'Study Biology', 'button', 'biology', 'feat_subject_select', 'Subject Nav', 'NAV', 'subject-nav', 'nav', 'nav.subject-nav', 1735689900000),
('proj_749d62a894383850', 'v_smart_extra_jan_001', 'click', '/lesson/biology', 'https://precious-pie-1838fd.netlify.app/lesson/biology', 'SmartFriend — Biology', 'Biology', '', '', 'BUTTON', 'Take Quiz', 'quiz-bio', 'quiz-btn', 'Start quiz', 'button', 'start-quiz', 'feat_quiz_start', 'Lesson View', 'SECTION', 'lesson', 'view', 'section.lesson', 1735690200000),
('proj_749d62a894383850', 'v_smart_extra_jan_002', 'click', '/lesson/biology/quiz', 'https://precious-pie-1838fd.netlify.app/lesson/biology/quiz', 'SmartFriend — Quiz', 'Quiz', '', '', 'LABEL', 'Cell Wall', 'q1-opt2', 'quiz-option', 'Select answer', 'label', 'answer', 'feat_quiz_answer', 'Quiz Card', 'DIV', 'quiz-card', 'question', 'div.quiz-card', 1735690300000),
('proj_749d62a894383850', 'v_smart_extra_jan_002', 'click', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', '', 'BUTTON', '📊 Progress', 'progress-btn', 'nav-btn', 'View progress', 'button', 'progress', 'feat_progress_view', 'Sidebar', 'ASIDE', 'sidebar', 'nav', 'aside#sidebar', 1735690400000),
('proj_749d62a894383850', 'v_smart_extra_jan_003', 'click', '/lesson/mathematics', 'https://precious-pie-1838fd.netlify.app/lesson/mathematics', 'SmartFriend — Mathematics', 'Mathematics', '', '', 'BUTTON', 'Practice Problems', 'practice-btn', 'btn', 'Start practice', 'button', 'practice', 'feat_practice_start', 'Lesson View', 'SECTION', 'lesson', 'view', 'section.lesson', 1735690500000),
('proj_749d62a894383850', 'v_smart_extra_jan_003', 'click', '/lesson/english', 'https://precious-pie-1838fd.netlify.app/lesson/english', 'SmartFriend — English', 'English', '', '', 'BUTTON', 'Take Quiz', 'quiz-eng', 'quiz-btn', 'Start quiz', 'button', 'start-quiz', 'feat_quiz_start', 'Lesson View', 'SECTION', 'lesson', 'view', 'section.lesson', 1735690600000),
('proj_749d62a894383850', 'v_smart_extra_jan_004', 'click', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', '', 'BUTTON', '⚡ Physics', 'physics-nav', 'subject-nav', 'Study Physics', 'button', 'physics', 'feat_subject_select', 'Subject Nav', 'NAV', 'subject-nav', 'nav', 'nav.subject-nav', 1735690700000),

-- Settl (30% of remaining): 20 clicks
('proj_0e1eaec4fe1f20e9', 'v_settl_extra_jan_001', 'click', '/', 'https://saas-settings-741d34.netlify.app/', 'Settl — Settings', 'Home', '', '', 'A', 'Billing', 'nav-billing', 'nav-item', 'Billing settings', 'link', 'billing', 'feat_nav_billing', 'Sidebar', 'NAV', 'sidebar', 'nav', 'nav#sidebar', 1735689900000),
('proj_0e1eaec4fe1f20e9', 'v_settl_extra_jan_001', 'click', '/billing', 'https://saas-settings-741d34.netlify.app/billing', 'Settl — Billing', 'Billing', '', '', 'BUTTON', 'Upgrade Plan', 'upgrade-pro', 'btn-primary', 'Upgrade to Pro', 'button', 'upgrade', 'feat_plan_upgrade', 'Current Plan', 'DIV', 'current-plan', 'plan-card', 'div.current-plan', 1735690200000),
('proj_0e1eaec4fe1f20e9', 'v_settl_extra_jan_002', 'click', '/team', 'https://saas-settings-741d34.netlify.app/team', 'Settl — Team', 'Team', '', '', 'BUTTON', 'Add Member', 'add-member', 'btn-primary', 'Add team member', 'button', 'add', 'feat_team_add', 'Team Header', 'DIV', 'team-header', 'header', 'div.team-header', 1735690300000),
('proj_0e1eaec4fe1f20e9', 'v_settl_extra_jan_002', 'click', '/profile', 'https://saas-settings-741d34.netlify.app/profile', 'Settl — Profile', 'Profile', '', '', 'BUTTON', 'Save Changes', 'save-profile', 'btn-accent', 'Save profile', 'button', 'save', 'feat_profile_save', 'Profile Form', 'FORM', 'profile-form', 'form', 'form.profile-form', 1735690400000),
('proj_0e1eaec4fe1f20e9', 'v_settl_extra_jan_003', 'click', '/preferences', 'https://saas-settings-741d34.netlify.app/preferences', 'Settl — Preferences', 'Preferences', '', '', 'BUTTON', 'Dark Mode', 'dark-toggle', 'toggle', 'Toggle theme', 'switch', 'dark-mode', 'feat_toggle_theme', 'Appearance', 'DIV', 'appearance', 'pref-section', 'div.appearance', 1735690500000),
('proj_0e1eaec4fe1f20e9', 'v_settl_extra_jan_003', 'click', '/team', 'https://saas-settings-741d34.netlify.app/team', 'Settl — Team', 'Team', '', '', 'SELECT', 'Admin', 'role-user3', 'role-select', 'Change role', 'select', 'role', 'feat_role_change', 'Members Table', 'TABLE', 'members-table', 'table', 'table.members-table', 1735690600000),
('proj_0e1eaec4fe1f20e9', 'v_settl_extra_jan_004', 'click', '/billing', 'https://saas-settings-741d34.netlify.app/billing', 'Settl — Billing', 'Billing', '', '', 'BUTTON', 'Update Payment', 'update-payment', 'btn-outline', 'Update card', 'button', 'payment', 'feat_payment_update', 'Payment Method', 'DIV', 'payment-method', 'payment-card', 'div.payment-method', 1735690700000),
('proj_0e1eaec4fe1f20e9', 'v_settl_extra_jan_004', 'click', '/team', 'https://saas-settings-741d34.netlify.app/team', 'Settl — Team', 'Team', '', '', 'BUTTON', 'Remove Member', 'remove-sarah', 'btn-danger', 'Remove member', 'button', 'remove', 'feat_member_remove', 'Members Table', 'TABLE', 'members-table', 'table', 'table.members-table', 1735690800000);

-- FEBRUARY 2025 - Total extra clicks: 72
-- LexCore (52%): 37 clicks
INSERT INTO events (project_key, visitor_id, event_type, path, url, title, page_name, hash, source, tag, inner_text, element_id, classes, aria_label, role, name, feature_key, feature_name, container_tag, container_id, container_classes, container_selector_fingerprint, timestamp) VALUES
('proj_028268c1abf9ec55', 'v_lex_extra_feb_001', 'click', '/', 'https://lex-core-casemanagement-3fdeb7.netlify.app/', 'LexCore — Case Management', 'Home', '', '', 'BUTTON', 'New Case', 'quick-case-feb1', 'btn-primary', 'Create case', 'button', 'create', 'feat_case_create', 'Quick Actions', 'DIV', 'quick-actions', 'dashboard', 'div.quick-actions', 1738368000000),
('proj_028268c1abf9ec55', 'v_lex_extra_feb_001', 'click', '/cases', 'https://lex-core-casemanagement-3fdeb7.netlify.app/cases', 'LexCore — Cases', 'Cases', '', '', 'BUTTON', 'Filter by Status', 'filter-status', 'btn-filter', 'Filter cases', 'button', 'filter', 'feat_filter', 'Cases Toolbar', 'DIV', 'cases-toolbar', 'toolbar', 'div.cases-toolbar', 1738368100000),
-- ... (35 more LexCore February clicks)

-- SmartFriend (24%): 17 clicks
('proj_749d62a894383850', 'v_smart_extra_feb_001', 'click', '/dashboard', 'https://precious-pie-1838fd.netlify.app/dashboard', 'SmartFriend — Dashboard', 'Dashboard', '', '', 'BUTTON', '📐 Mathematics', 'math-nav', 'subject-nav', 'Study Math', 'button', 'math', 'feat_subject_select', 'Subject Nav', 'NAV', 'subject-nav', 'nav', 'nav.subject-nav', 1738368200000),
-- ... (16 more SmartFriend February clicks)

-- Settl (24%): 18 clicks
('proj_0e1eaec4fe1f20e9', 'v_settl_extra_feb_001', 'click', '/', 'https://saas-settings-741d34.netlify.app/', 'Settl — Settings', 'Home', '', '', 'A', 'Profile', 'nav-profile', 'nav-item', 'Profile settings', 'link', 'profile', 'feat_nav_profile', 'Sidebar', 'NAV', 'sidebar', 'nav', 'nav#sidebar', 1738368300000),
-- ... (17 more Settl February clicks)

-- MARCH 2025 - Total extra clicks: 58
-- LexCore (60%): 35 clicks
-- SmartFriend (20%): 11 clicks
-- Settl (20%): 12 clicks

-- APRIL 2025 - Total extra clicks: 65
-- LexCore (45%): 29 clicks
-- SmartFriend (27.5%): 18 clicks
-- Settl (27.5%): 18 clicks

-- MAY 2025 - Total extra clicks: 70
-- LexCore (55%): 38 clicks
-- SmartFriend (22.5%): 16 clicks
-- Settl (22.5%): 16 clicks

-- JUNE 2025 - Total extra clicks: 62
-- LexCore (65%): 40 clicks
-- SmartFriend (17.5%): 11 clicks
-- Settl (17.5%): 11 clicks

-- JULY 2025 - Total extra clicks: 68
-- LexCore (48%): 33 clicks
-- SmartFriend (26%): 17 clicks
-- Settl (26%): 18 clicks

-- AUGUST 2025 - Total extra clicks: 55
-- LexCore (58%): 32 clicks
-- SmartFriend (21%): 11 clicks
-- Settl (21%): 12 clicks

-- SEPTEMBER 2025 - Total extra clicks: 60
-- LexCore (53%): 32 clicks
-- SmartFriend (23.5%): 14 clicks
-- Settl (23.5%): 14 clicks

-- OCTOBER 2025 - Total extra clicks: 64
-- LexCore (47%): 30 clicks
-- SmartFriend (26.5%): 17 clicks
-- Settl (26.5%): 17 clicks

-- NOVEMBER 2025 - Total extra clicks: 71
-- LexCore (51%): 36 clicks
-- SmartFriend (24.5%): 17 clicks
-- Settl (24.5%): 18 clicks

-- DECEMBER 2025 - Total extra clicks: 66
-- LexCore (49%): 32 clicks
-- SmartFriend (25.5%): 17 clicks
-- Settl (25.5%): 17 clicks


