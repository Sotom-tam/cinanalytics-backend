import pool from "../db.js"


export async  function getProjectByProjectKey(projectKey){
  const result =await pool.query(`SELECT * FROM projects WHERE project_key=$1`,[projectKey])
  console.log(result.rows)
  return result.rows[0]
}

export async function getSummaryStats() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const { rows } = await pool.query(`
    WITH connected_projects AS(
      SELECT 
      COUNT(*) AS connected_projects_count
      FROM projects
      WHERE verified=true
    )
    SELECT connected_projects.connected_projects_count AS connected_projects,
          COUNT(DISTINCT CASE WHEN timestamp >= $1 THEN project_key END) AS active_projects,
          COUNT(DISTINCT CASE WHEN timestamp > $1 THEN visitor_id END) AS active_users,
          COUNT(DISTINCT CASE WHEN event_type != 'pageview' THEN feature_key END) AS features_tracked
    FROM events
    CROSS JOIN connected_projects
    GROUP BY connected_projects.connected_projects_count
    `,[cutoff]);
  console.log("Model Row:",rows)
  return rows[0];
}

export async function getLeastUsedFeatures() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  //console.log(cutoff)
  const featureCount=await pool.query(`SELECT events.project_key,
  COUNT(DISTINCT events.feature_key) AS feature_count,
  COUNT(*) AS project_total_interactions
    FROM events
  
  GROUP BY events.project_key`)
  const result = await pool.query(`WITH monthly_project_totals AS (
  -- First, get total interactions per project per month
  SELECT 
      events.project_key,
      DATE_TRUNC('month', TO_TIMESTAMP(events.timestamp/1000)) AS month_date,
      TO_CHAR(TO_TIMESTAMP(events.timestamp/1000), 'Month') AS month_name,
      EXTRACT(MONTH FROM TO_TIMESTAMP(events.timestamp/1000)) AS month_num,
      EXTRACT(YEAR FROM TO_TIMESTAMP(events.timestamp/1000)) AS year,
      TO_CHAR(TO_TIMESTAMP(events.timestamp/1000), 'YYYY-MM') AS year_month,
      COUNT(*) AS total_project_interactions
  FROM events
  WHERE event_type != 'pageview'
    AND feature_key IS NOT NULL
  GROUP BY 
      events.project_key,
      DATE_TRUNC('month', TO_TIMESTAMP(events.timestamp/1000)),
      TO_CHAR(TO_TIMESTAMP(events.timestamp/1000), 'Month'),
      EXTRACT(MONTH FROM TO_TIMESTAMP(events.timestamp/1000)),
      EXTRACT(YEAR FROM TO_TIMESTAMP(events.timestamp/1000)),
      TO_CHAR(TO_TIMESTAMP(events.timestamp/1000), 'YYYY-MM')
),
feature_monthly_counts AS (
  -- Then, get interactions per feature per project per month
  SELECT 
      events.project_key,
      events.feature_key,
      events.feature_name,
      DATE_TRUNC('month', TO_TIMESTAMP(events.timestamp/1000)) AS month_date,
      TO_CHAR(TO_TIMESTAMP(events.timestamp/1000), 'Month') AS month_name,
      EXTRACT(MONTH FROM TO_TIMESTAMP(events.timestamp/1000)) AS month_num,
      EXTRACT(YEAR FROM TO_TIMESTAMP(events.timestamp/1000)) AS year,
      TO_CHAR(TO_TIMESTAMP(events.timestamp/1000), 'YYYY-MM') AS year_month,
      COUNT(*) AS feature_interactions
  FROM events
  WHERE event_type != 'pageview'
    AND feature_key IS NOT NULL
  GROUP BY 
      events.project_key,
      events.feature_key,
      events.feature_name,
      DATE_TRUNC('month', TO_TIMESTAMP(events.timestamp/1000)),
      TO_CHAR(TO_TIMESTAMP(events.timestamp/1000), 'Month'),
      EXTRACT(MONTH FROM TO_TIMESTAMP(events.timestamp/1000)),
      EXTRACT(YEAR FROM TO_TIMESTAMP(events.timestamp/1000)),
      TO_CHAR(TO_TIMESTAMP(events.timestamp/1000), 'YYYY-MM')
),
ranked_features AS (
  -- Rank features within each project and month by interactions (ascending)
  -- Added feature_name to ORDER BY for alphabetical tie-breaking
  SELECT 
      f.project_key,
      f.feature_key,
      f.feature_name,
      f.month_name,
      f.month_num,
      f.year,
      f.year_month,
      f.feature_interactions,
      p.total_project_interactions,
      ROUND(
        (f.feature_interactions * 100.0) / NULLIF(p.total_project_interactions, 0),
        1
      ) AS percentage,
      ROW_NUMBER() OVER (
        PARTITION BY f.project_key, f.year_month
        ORDER BY f.feature_interactions ASC, f.feature_name ASC  -- 👈 Alphabetical tie-breaker
      ) AS rank_in_month
  FROM feature_monthly_counts f
  JOIN monthly_project_totals p 
      ON f.project_key = p.project_key 
      AND f.year_month = p.year_month
)
-- Get the TOP 2 least used features (rank 1 and 2) for each project each month
SELECT 
    r.project_key,
    p.project_name,
    p.project_icon,
    r.month_name,
    r.year,
    r.year_month,
    CASE 
        WHEN r.month_num BETWEEN 1 AND 3 THEN 'Q1'
        WHEN r.month_num BETWEEN 4 AND 6 THEN 'Q2'
        WHEN r.month_num BETWEEN 7 AND 9 THEN 'Q3'
        WHEN r.month_num BETWEEN 10 AND 12 THEN 'Q4'
    END AS quarter,
    CONCAT(
        'Q',
        CASE 
            WHEN r.month_num BETWEEN 1 AND 3 THEN '1'
            WHEN r.month_num BETWEEN 4 AND 6 THEN '2'
            WHEN r.month_num BETWEEN 7 AND 9 THEN '3'
            WHEN r.month_num BETWEEN 10 AND 12 THEN '4'
        END,
        '-',
        r.year
    ) AS quarter_year,
    r.feature_key,
    r.feature_name,
    r.feature_interactions,
    r.total_project_interactions,
    r.percentage
FROM ranked_features r
JOIN projects p ON r.project_key = p.project_key
WHERE p.verified = true     -- Only verified projects
  AND r.rank_in_month <= 2   -- ONLY ranks 1 and 2 (top 2 least used)
ORDER BY 
    r.year ASC,
    r.month_num ASC,
    r.project_key ASC,
    r.rank_in_month ASC;`);
  //console.log(result.rows)
  return result.rows
}

export async function getTop3PerformingProjects() {
  const result=await pool.query(`
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
    TO_CHAR(TO_TIMESTAMP(events.timestamp/1000),'Month') AS Month,
    TO_CHAR(TO_TIMESTAMP(events.timestamp/1000),'YYYY') AS Year,
    COUNT (events.event_type='click') AS project_interactions,
    ROUND(COUNT (events.event_type='click')::NUMERIC/monthly_totals.total_interactions_per_month * 100) AS percentage_interactions,
    projects.project_icon,
    DATE_TRUNC('month',TO_TIMESTAMP(events.timestamp/1000)) AS month_value
    FROM events
    JOIN projects ON events.project_key=projects.project_key
    JOIN project_totals ON  events.project_key=project_totals.project_key
    LEFT JOIN monthly_totals ON DATE_TRUNC('month', TO_TIMESTAMP(events.timestamp/1000)) = monthly_totals.month_value
    GROUP BY events.project_key,
    projects.project_name,
    projects.project_icon,
    monthly_totals.total_interactions_per_month,
    DATE_TRUNC('month',TO_TIMESTAMP(events.timestamp/1000)),TO_CHAR(TO_TIMESTAMP(events.timestamp/1000),'Month'),
    DATE_TRUNC('month',TO_TIMESTAMP(events.timestamp/1000)),TO_CHAR(TO_TIMESTAMP(events.timestamp/1000),'YYYY')
    ORDER BY MIN(DATE_TRUNC('month',TO_TIMESTAMP(events.timestamp/1000))) DESC,events.project_key ASC`)
  //console.log(result.rows)
  return result.rows
}



export async function getProjectSummaryData(){
  const result=await pool.query(`
  WITH date_ranges AS (
  SELECT 
    -- This week (last 7 days)
    EXTRACT(epoch FROM NOW() - INTERVAL '7 days') * 1000 AS this_week_start,
    EXTRACT(epoch FROM NOW()) * 1000 AS this_week_end,
    -- Last week (previous 7 days)
    EXTRACT(epoch FROM NOW() - INTERVAL '14 days') * 1000 AS last_week_start,
    EXTRACT(epoch FROM NOW() - INTERVAL '7 days') * 1000 AS last_week_end
  ),
  -- Overall total (for percentage calculation)
  overall_total AS (
    SELECT COUNT(*) AS all_projects_total FROM events
  ),
  -- This week's data
  this_week_events AS (
    SELECT 
      project_key,
      visitor_id,
      event_type,
      timestamp
    FROM events
    WHERE timestamp >= (SELECT this_week_start FROM date_ranges)
      AND timestamp < (SELECT this_week_end FROM date_ranges)
  ),
  this_week_visitor_events AS (
    SELECT
      *,
      LAG(timestamp) OVER (PARTITION BY visitor_id ORDER BY timestamp) AS prev_ts
    FROM this_week_events
  ),
  this_week_sessionized AS (
    SELECT
      *,
      SUM(
        CASE 
          WHEN prev_ts IS NULL THEN 1
          WHEN (timestamp - prev_ts) > 30 * 60 * 1000 THEN 1
          ELSE 0
        END
      ) OVER (PARTITION BY visitor_id ORDER BY timestamp) AS session_number
    FROM this_week_visitor_events
  ),
  this_week_session_time AS (
    SELECT 
      visitor_id, 
      project_key, 
      session_number,
      event_type,  -- Include event_type here
      (MAX(timestamp) OVER (PARTITION BY visitor_id, session_number, project_key) - 
       MIN(timestamp) OVER (PARTITION BY visitor_id, session_number, project_key))/1000 AS session_time_secs,
      (MAX(timestamp) OVER (PARTITION BY visitor_id, session_number, project_key) - 
       MIN(timestamp) OVER (PARTITION BY visitor_id, session_number, project_key))/60000 AS session_time_mins
    FROM this_week_sessionized
  ),
  this_week_project_stats AS (
    SELECT 
      project_key,
      COUNT(DISTINCT visitor_id) AS active_users_this_week,
      COUNT(CASE WHEN event_type = 'click' THEN 1 END) AS interactions_this_week,
      ROUND(AVG(session_time_mins), 1) AS avg_session_time_this_week
    FROM this_week_session_time
    GROUP BY project_key
  ),
  
  -- Last week's data
  last_week_events AS (
    SELECT 
      project_key,
      visitor_id,
      event_type,
      timestamp
    FROM events
    WHERE timestamp >= (SELECT last_week_start FROM date_ranges)
      AND timestamp < (SELECT last_week_end FROM date_ranges)
  ),
  last_week_visitor_events AS (
    SELECT
      *,
      LAG(timestamp) OVER (PARTITION BY visitor_id ORDER BY timestamp) AS prev_ts
    FROM last_week_events
  ),
  last_week_sessionized AS (
    SELECT
      *,
      SUM(
        CASE 
          WHEN prev_ts IS NULL THEN 1
          WHEN (timestamp - prev_ts) > 30 * 60 * 1000 THEN 1
          ELSE 0
        END
      ) OVER (PARTITION BY visitor_id ORDER BY timestamp) AS session_number
    FROM last_week_visitor_events
  ),
  last_week_session_time AS (
    SELECT 
      visitor_id, 
      project_key, 
      session_number,
      event_type,  -- Include event_type here
      (MAX(timestamp) OVER (PARTITION BY visitor_id, session_number, project_key) - 
       MIN(timestamp) OVER (PARTITION BY visitor_id, session_number, project_key))/1000 AS session_time_secs,
      (MAX(timestamp) OVER (PARTITION BY visitor_id, session_number, project_key) - 
       MIN(timestamp) OVER (PARTITION BY visitor_id, session_number, project_key))/60000 AS session_time_mins
    FROM last_week_sessionized
  ),
  last_week_project_stats AS (
    SELECT 
      project_key,
      COUNT(DISTINCT visitor_id) AS active_users_last_week,
      COUNT(CASE WHEN event_type = 'click' THEN 1 END) AS interactions_last_week,
      ROUND(AVG(session_time_mins), 1) AS avg_session_time_last_week
    FROM last_week_session_time
    GROUP BY project_key
  )
-- Final SELECT combining all metrics
SELECT 
  COALESCE(tw.project_key, lw.project_key) AS project_key,
  projects.project_name,
  projects.project_icon,
  -- This week stats
  COALESCE(tw.interactions_this_week, 0) AS project_interactions_this_week,
  COALESCE(lw.interactions_last_week, 0) AS project_interactions_last_week,
  CASE 
    WHEN COALESCE(lw.interactions_last_week, 0) > 0 
    THEN ROUND(
      (
        (COALESCE(tw.interactions_this_week, 0) - lw.interactions_last_week)::NUMERIC
        / lw.interactions_last_week)* 100
      ,1)
    ELSE 0
  END AS project_interactions_change_percent,

  COALESCE(tw.active_users_this_week, 0) AS active_users_this_week,
  COALESCE(lw.active_users_last_week, 0) AS active_users_last_week,

  COALESCE(tw.avg_session_time_this_week, 0) AS avg_session_time_this_week,
  COALESCE(lw.avg_session_time_last_week, 0) AS avg_session_time_last_week,
  CASE
  WHEN COALESCE(lw.avg_session_time_last_week, 0) > 0
  THEN ROUND(
    (
      (COALESCE(tw.avg_session_time_this_week, 0) - lw.avg_session_time_last_week)::NUMERIC
      / lw.avg_session_time_last_week
    ) * 100
  ,1)
  ELSE 0
END AS avg_session_time_change_percent
FROM projects
LEFT JOIN this_week_project_stats tw ON projects.project_key = tw.project_key
LEFT JOIN last_week_project_stats lw ON projects.project_key = lw.project_key
CROSS JOIN overall_total
WHERE 
  -- Only show projects that have activity in either week
  COALESCE(tw.active_users_this_week, lw.active_users_last_week, 0) > 0
ORDER BY COALESCE(tw.interactions_this_week, 0) DESC;`)
  //console.log(result.rows)
  return result.rows
}
//getProjectSummaryData()

export async function getProjectFeatureData(){
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const result = await pool.query(`
      WITH feature_usage AS (
    SELECT
      events.project_key,
      projects.project_name,
      events.feature_key,
      events.feature_name,
      COUNT(*) AS total_interactions,
      COUNT(DISTINCT events.visitor_id) AS unique_users,
      -- Categorize features based on usage
      CASE 
        WHEN COUNT(*) = 1 THEN 'unused'
        WHEN COUNT(*) < 3 THEN 'least_used'
        ELSE 'active'
      END AS feature_status
    FROM events
    JOIN projects ON events.project_key = projects.project_key
    WHERE 
      events.timestamp >= $1
      AND events.feature_key IS NOT NULL
    GROUP BY 
      events.project_key, 
      projects.project_name,
      projects.project_icon,
      events.feature_key, 
      events.feature_name
  )
  SELECT 
    project_key,
    project_name,
    COUNT(*) AS total_features,
    COUNT(CASE WHEN feature_status = 'active' THEN 1 END) AS active_features,
    COUNT(CASE WHEN feature_status = 'least_used' THEN 1 END) AS least_used_features,
    COUNT(CASE WHEN feature_status = 'unused' THEN 1 END) AS unused_features  
  FROM feature_usage
  GROUP BY project_key, project_name
  ORDER BY active_features DESC;`,[cutoff])
  //console.log(result.rows)
  return result.rows
}


export async function getLeastUsedFeaturesByProject(projectKey) {
  const result = await pool.query(`
  WITH project_feature_details as(
  SELECT events.project_key,
  COUNT( events.feature_key) as project_feature_interactions,
  COUNT(DISTINCT events.feature_key) as project_feature_count
  FROM events
  GROUP BY events.project_key
),
feature_details as(
  SELECT events.project_key,events.feature_key,events.feature_name,
  TO_CHAR(DATE_TRUNC('month',TO_TIMESTAMP(events.timestamp/1000)),'Month') as month,
  DATE_TRUNC('month', TO_TIMESTAMP(events.timestamp/1000)) AS month_bucket,
  COUNT(events.feature_key) as feature_interactions,
  COUNT(DISTINCT events.visitor_id) as unique_users
  FROM events
  WHERE events.event_type='click'
  GROUP BY events.project_key,
  events.feature_key,
  events.feature_name,
  DATE_TRUNC('month',TO_TIMESTAMP(events.timestamp/1000))
)
SELECT * FROM (
SELECT feature_details.project_key,
feature_details.feature_key,
feature_details.feature_name,
feature_details.month_bucket,
TO_CHAR(month_bucket,'FMMonth') AS month_name,
CASE
  WHEN EXTRACT(MONTH FROM feature_details.month_bucket) BETWEEN 1 AND 3 THEN 'Q1'
  WHEN EXTRACT(MONTH FROM feature_details.month_bucket) BETWEEN 4 AND 6 THEN 'Q2'
  WHEN EXTRACT(MONTH FROM feature_details.month_bucket) BETWEEN 7 AND 9 THEN 'Q3'
  WHEN EXTRACT(MONTH FROM feature_details.month_bucket) BETWEEN 10 AND 12 THEN 'Q4'
END AS quarter,
TO_CHAR(feature_details.month_bucket,'YYYY') as year,
feature_details.feature_interactions as total_interactions,
feature_details.unique_users,

ROW_NUMBER() OVER (
  PARTITION BY feature_details.month_bucket
  ORDER BY feature_details.feature_interactions ASC
) as feature_rank_month,

COUNT(*) OVER (
  PARTITION BY feature_details.project_key, feature_details.month_bucket
) as max_rank,

 -- total interactions per month
SUM(feature_details.feature_interactions) 
OVER (PARTITION BY feature_details.project_key, feature_details.month_bucket) 
AS feature_interactions_month,

ROUND(feature_details.feature_interactions*100/(
  SUM(feature_details.feature_interactions)
  OVER (PARTITION BY feature_details.project_key, feature_details.month_bucket)
  ),
1) as feature_usage,

project_feature_details.project_feature_interactions,
project_feature_details.project_feature_count as project_feature_count
FROM feature_details
JOIN project_feature_details ON project_feature_details.project_key=feature_details.project_key
WHERE feature_details.feature_interactions>1
AND feature_details.project_key=$1

GROUP BY feature_details.project_key,
feature_details.feature_key,
feature_details.feature_name,
feature_details.feature_interactions,
feature_details.unique_users,
project_feature_details.project_feature_count,
project_feature_details.project_feature_interactions,
feature_details.month_bucket
) as ranked_features
WHERE ranked_features.feature_rank_month <=CEIL(max_rank/2.0)
ORDER BY ranked_features.project_key ASC,ranked_features.month_bucket ASC,ranked_features.feature_rank_month ASC`,
  [projectKey]
  );
  //console.log(result.rows,result.rows.length)
  return result.rows
}
//getLeastUsedFeaturesByProject('proj_0e1eaec4fe1f20e9')
export async function getMostUsedFeaturesByProject(projectKey) {
  const result = await pool.query(`
  WITH project_feature_details as(
  SELECT events.project_key,
  COUNT( events.feature_key) as project_feature_interactions,
  COUNT(DISTINCT events.feature_key) as project_feature_count
  FROM events
  GROUP BY events.project_key
),
feature_details as(
  SELECT events.project_key,events.feature_key,events.feature_name,
  TO_CHAR(DATE_TRUNC('month',TO_TIMESTAMP(events.timestamp/1000)),'Month') as month,
  DATE_TRUNC('month', TO_TIMESTAMP(events.timestamp/1000)) AS month_bucket,
  COUNT(events.feature_key) as feature_interactions,
  COUNT(DISTINCT events.visitor_id) as unique_users
  FROM events
  WHERE events.event_type='click'
  GROUP BY events.project_key,
  events.feature_key,
  events.feature_name,
  DATE_TRUNC('month',TO_TIMESTAMP(events.timestamp/1000))
)
SELECT * FROM (
SELECT feature_details.project_key,
feature_details.feature_key,
feature_details.feature_name,
feature_details.month_bucket,
TO_CHAR(month_bucket,'FMMonth') AS month_name,
CASE
  WHEN EXTRACT(MONTH FROM feature_details.month_bucket) BETWEEN 1 AND 3 THEN 'Q1'
  WHEN EXTRACT(MONTH FROM feature_details.month_bucket) BETWEEN 4 AND 6 THEN 'Q2'
  WHEN EXTRACT(MONTH FROM feature_details.month_bucket) BETWEEN 7 AND 9 THEN 'Q3'
  WHEN EXTRACT(MONTH FROM feature_details.month_bucket) BETWEEN 10 AND 12 THEN 'Q4'
END AS quarter,
TO_CHAR(feature_details.month_bucket,'YYYY') as year,
feature_details.feature_interactions as total_interactions,
feature_details.unique_users,
ROW_NUMBER() OVER (
  PARTITION BY feature_details.month_bucket
  ORDER BY feature_details.feature_interactions ASC
) as feature_rank_month,

COUNT(*) OVER (
  PARTITION BY feature_details.project_key, feature_details.month_bucket
) as max_rank,

 -- total interactions per month
SUM(feature_details.feature_interactions) 
OVER (PARTITION BY feature_details.project_key, feature_details.month_bucket) 
AS feature_interactions_month,

ROUND(feature_details.feature_interactions*100/(
  SUM(feature_details.feature_interactions)
  OVER (PARTITION BY feature_details.project_key, feature_details.month_bucket)
  ),
1) as feature_usage,

project_feature_details.project_feature_interactions,
project_feature_details.project_feature_count as project_feature_count
FROM feature_details
JOIN project_feature_details ON project_feature_details.project_key=feature_details.project_key
WHERE feature_details.feature_interactions>1
AND feature_details.project_key=$1

GROUP BY feature_details.project_key,
feature_details.feature_key,
feature_details.feature_name,
feature_details.feature_interactions,
feature_details.unique_users,
project_feature_details.project_feature_count,
project_feature_details.project_feature_interactions,
feature_details.month_bucket
) as ranked_features
WHERE ranked_features.feature_rank_month >CEIL(max_rank/2.0)
ORDER BY ranked_features.project_key ASC,ranked_features.month_bucket ASC,ranked_features.feature_rank_month DESC`,[projectKey]);
  //console.log(result.rows)
  return result.rows
}

export async function getLeastVisitedPagesByProject(projectKey) {
  const result = await pool.query(
    `WITH pageviews AS (
  SELECT
    project_key,
    visitor_id,
    page_name,
    timestamp,
    DATE_TRUNC('month', TO_TIMESTAMP(timestamp/1000)) AS month_bucket
  FROM events
  WHERE event_type = 'pageview'
),

ordered_pageviews AS (
  SELECT
    *,
    LEAD(timestamp) OVER (
      PARTITION BY visitor_id
      ORDER BY timestamp
    ) AS next_timestamp
  FROM pageviews
),

page_times AS (
  SELECT
    project_key,
    page_name,
    month_bucket,
    (next_timestamp - timestamp)/1000.0 AS time_on_page_seconds
  FROM ordered_pageviews
  WHERE next_timestamp IS NOT NULL
    AND (next_timestamp - timestamp) <= 30 * 60 * 1000
),

page_interactions AS (
  SELECT
    project_key,
    page_name,
    month_bucket,
    COUNT(*) AS page_interactions,
    COUNT(DISTINCT visitor_id) AS unique_users
  FROM pageviews
  GROUP BY project_key, page_name, month_bucket
),

/* NEW: total interactions per project per month */
project_month_totals AS (
  SELECT
    project_key,
    month_bucket,
    SUM(page_interactions) AS total_project_interactions_month
  FROM page_interactions
  GROUP BY project_key, month_bucket
),

ranked_pages AS (
  SELECT
    pi.project_key,
    pi.page_name,
    pi.month_bucket,
    pi.page_interactions,
    pi.unique_users,
    pmt.total_project_interactions_month,

    ROUND(
      (pi.page_interactions * 100.0) /
      pmt.total_project_interactions_month,
      2
    ) AS feature_usage_percent,

    COALESCE(ROUND(AVG(pt.time_on_page_seconds),2),0) AS avg_seconds_on_page,

    RANK() OVER (
      PARTITION BY pi.project_key, pi.month_bucket
      ORDER BY pi.page_interactions DESC
    ) AS page_rank

  FROM page_interactions pi

  LEFT JOIN page_times pt
    ON pi.project_key = pt.project_key
    AND pi.page_name = pt.page_name
    AND pi.month_bucket = pt.month_bucket

  JOIN project_month_totals pmt
    ON pi.project_key = pmt.project_key
    AND pi.month_bucket = pmt.month_bucket

  GROUP BY
    pi.project_key,
    pi.page_name,
    pi.month_bucket,
    pi.page_interactions,
    pi.unique_users,
    pmt.total_project_interactions_month
)

SELECT
  project_key,
  page_name,
  TO_CHAR(month_bucket,'Month') AS month_name,
  TO_CHAR(month_bucket,'YYYY') AS year,

  CASE
    WHEN EXTRACT(MONTH FROM month_bucket) BETWEEN 1 AND 3 THEN 'Q1'
    WHEN EXTRACT(MONTH FROM month_bucket) BETWEEN 4 AND 6 THEN 'Q2'
    WHEN EXTRACT(MONTH FROM month_bucket) BETWEEN 7 AND 9 THEN 'Q3'
    WHEN EXTRACT(MONTH FROM month_bucket) BETWEEN 10 AND 12 THEN 'Q4'
  END AS quarter,

  avg_seconds_on_page,
  page_interactions AS page_visits,
  total_project_interactions_month,
  feature_usage_percent,
  unique_users,
  page_rank

FROM ranked_pages

WHERE page_rank =1
AND project_key = $1

ORDER BY project_key, month_bucket ASC;`,
    [projectKey]
  );
  //console.log("pages:",result.rows)
  return result.rows
}

//getMostVisitedPagesByProject('proj_16abddba0d405800')

export async function getMostVisitedPagesByProject(projectKey) {
  const result = await pool.query(
    `WITH pageviews AS (
  SELECT
    project_key,
    visitor_id,
    page_name,
    timestamp,
    DATE_TRUNC('month', TO_TIMESTAMP(timestamp/1000)) AS month_bucket
  FROM events
  WHERE event_type = 'pageview'
),

ordered_pageviews AS (
  SELECT
    *,
    LEAD(timestamp) OVER (
      PARTITION BY visitor_id
      ORDER BY timestamp
    ) AS next_timestamp
  FROM pageviews
),

page_times AS (
  SELECT
    project_key,
    page_name,
    month_bucket,
    (next_timestamp - timestamp)/1000.0 AS time_on_page_seconds
  FROM ordered_pageviews
  WHERE next_timestamp IS NOT NULL
    AND (next_timestamp - timestamp) <= 30 * 60 * 1000
),

page_interactions AS (
  SELECT
    project_key,
    page_name,
    month_bucket,
    COUNT(*) AS page_interactions,
    COUNT(DISTINCT visitor_id) AS unique_users
  FROM pageviews
  GROUP BY project_key, page_name, month_bucket
),

/* NEW: total interactions per project per month */
project_month_totals AS (
  SELECT
    project_key,
    month_bucket,
    SUM(page_interactions) AS total_project_interactions_month
  FROM page_interactions
  GROUP BY project_key, month_bucket
),

ranked_pages AS (
  SELECT
    pi.project_key,
    pi.page_name,
    pi.month_bucket,
    pi.page_interactions,
    pi.unique_users,
    pmt.total_project_interactions_month,

    ROUND(
      (pi.page_interactions * 100.0) /
      pmt.total_project_interactions_month,
      2
    ) AS feature_usage_percent,

    COALESCE(ROUND(AVG(pt.time_on_page_seconds),2),0) AS avg_seconds_on_page,

    RANK() OVER (
      PARTITION BY pi.project_key, pi.month_bucket
      ORDER BY pi.page_interactions DESC
    ) AS page_rank

  FROM page_interactions pi

  LEFT JOIN page_times pt
    ON pi.project_key = pt.project_key
    AND pi.page_name = pt.page_name
    AND pi.month_bucket = pt.month_bucket

  JOIN project_month_totals pmt
    ON pi.project_key = pmt.project_key
    AND pi.month_bucket = pmt.month_bucket

  GROUP BY
    pi.project_key,
    pi.page_name,
    pi.month_bucket,
    pi.page_interactions,
    pi.unique_users,
    pmt.total_project_interactions_month
)

SELECT
  project_key,
  page_name,
  TO_CHAR(month_bucket,'Month') AS month_name,
  TO_CHAR(month_bucket,'YYYY') AS year,

  CASE
    WHEN EXTRACT(MONTH FROM month_bucket) BETWEEN 1 AND 3 THEN 'Q1'
    WHEN EXTRACT(MONTH FROM month_bucket) BETWEEN 4 AND 6 THEN 'Q2'
    WHEN EXTRACT(MONTH FROM month_bucket) BETWEEN 7 AND 9 THEN 'Q3'
    WHEN EXTRACT(MONTH FROM month_bucket) BETWEEN 10 AND 12 THEN 'Q4'
  END AS quarter,

  avg_seconds_on_page,
  page_interactions AS page_visits,
  total_project_interactions_month,
  feature_usage_percent,
  unique_users,
  page_rank

FROM ranked_pages

WHERE page_rank > 1
AND project_key = $1

ORDER BY project_key, month_bucket; ASC`,
    [projectKey]
  );
  //console.log("pages:",result.rows)
  return result.rows
}

//This route here is like a middleware
//to preprocess the events before they get to the databse/
//it checks for duplicate events, keeps the first one and deletes the other ones
//also check for clicks that cause page to change delete click and keeps page view
//query function to check for duplicate clicks
export async function getDuplicateEvents(event) {
  const {visitorId,featureKey,path,projectKey,eventType,timestamp}=event
  const result= await pool.query(`SELECT * FROM events
    WHERE visitor_id=$1
      AND event_type=$2
      AND path=$3
      AND COALESCE(feature_key,'')=COALESCE($4,'')
      AND project_key=$5
      AND timestamp>=$6
      AND ($6-timestamp)<3000 `,[visitorId,eventType,path,featureKey,projectKey,timestamp]
    )
  //SO if there is an event that's already saved, that's a duplicate of the one to insert
  //we don't wanna save the duplicate
  //also checking the timing, it won't save if the events are not more than 3 seconds 
  //console.log(result.rows.length)
  if(result.rows.length===0){//no duplicate
    return false
  }else{
    return result.rows
  }
}
export async function getClicksAfterPageView(event) {
  const {visitorId,path,projectKey,timestamp,eventType}=event
  const result= await pool.query(`SELECT * FROM events
    WHERE path=$1
    AND event_type='pageview'
    AND $5='click'
    AND visitor_id=$2
    AND project_key=$3
    AND timestamp <$4
  `,[path,visitorId,projectKey,timestamp,eventType]
    )
  //SO if there is an event that's already saved, that's a duplicate of the one to insert
  //we don't wanna save the duplicate
  //also checking the timing, it won't save if the events are not more than 3 seconds 
  //console.log("Length:",result.rows,result.rows.length)
  if(result.rows.length===0){//no duplicate
    return false
  }else{
    return true
  }
}
export async function deleteEventById(id){
  const result = await pool.query('DELETE FROM events WHERE id=$1 RETURNING *',[id])
  return result.rows[0].id
}


//to get all the features and details about them like this:
// {
//     feature_key: 'feat_102nr4h00000',
//     feature_name: 'Sidebar',
//     project_key: 'proj_749d62a894383850',
//     project_name: 'SmartFriend',
//     total_interactions: '2',
//     unique_users: '2'
// }



export async function getAllFeatures() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const result = await pool.query(
    `SELECT events.feature_key,events.feature_name,events.project_key,projects.project_name,
      COUNT(*) AS total_interactions,
      COUNT(DISTINCT visitor_id) AS unique_users,
      ROUND(COUNT(*)::DECIMAL /NULLIF(COUNT(DISTINCT visitor_id), 0),1) AS feature_engagement
    FROM events
    JOIN projects ON events.project_key=projects.project_key
    WHERE events.event_type != 'pageview'
      AND events.feature_key IS NOT NULL
      AND events.timestamp >= $1
    GROUP BY events.feature_key, events.feature_name, events.project_key,projects.project_name
    ORDER BY total_interactions DESC;`,
    [cutoff]
  );
  console.log("All features:",result.rows)
  return result.rows
}
//Looks like
// {
//     project_key: 'proj_16abddba0d405800',
//     total_interactions: '21',
//     unique_users: '3',
//     total_features: '5',
//     engagement: '7.00'
//  }
export async function getProjectAllProject() {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);

  const result = await pool.query(
    `WITH feature_stats AS (
  SELECT
    project_key,
    feature_key,
    feature_name,
    COUNT(*) AS interactions,
    COUNT(DISTINCT visitor_id) AS unique_users,
    ROUND(
      COUNT(*)::DECIMAL /
      NULLIF(COUNT(DISTINCT visitor_id), 0),
      2
    ) AS feature_engagement
  FROM events
  WHERE event_type != 'pageview'
    AND feature_key IS NOT NULL
    AND timestamp >= $1
  GROUP BY project_key, feature_key, feature_name
),

project_user_stats AS (
  -- ✅ TRUE unique users per project (FIXED)
  SELECT
    project_key,
    COUNT(DISTINCT visitor_id) AS unique_users
  FROM events
  WHERE event_type != 'pageview'
    AND timestamp >= $1
  GROUP BY project_key
),

project_stats AS (
  SELECT
    f.project_key,

    COUNT(DISTINCT f.feature_key) AS total_features,

    COUNT(DISTINCT CASE
      WHEN f.interactions > 2 THEN f.feature_key
    END) AS active_features,

    SUM(f.interactions) AS total_interactions,

    u.unique_users,

    ROUND(
      SUM(f.interactions)::DECIMAL /
      NULLIF(u.unique_users, 0),
      2
    ) AS project_engagement,

    MIN(f.feature_engagement) AS least_used_engagement,

    (ARRAY_AGG(f.feature_name ORDER BY f.feature_engagement ASC))[1]
      AS least_used_feature,

    (ARRAY_AGG(f.feature_key ORDER BY f.feature_engagement ASC))[1]
      AS least_used_feature_key

  FROM feature_stats f
  JOIN project_user_stats u
    ON f.project_key = u.project_key
  GROUP BY f.project_key, u.unique_users
)

SELECT
  project_key,
  total_features,
  active_features,
  total_features - active_features AS inactive_features,
  total_interactions,
  unique_users,
  project_engagement,
  least_used_feature,
  least_used_feature_key,
  least_used_engagement
FROM project_stats
ORDER BY project_engagement DESC;`,
    [cutoff]
  );
  //console.log(result.rows)
  return result.rows;
}



//to store event in event table
export async function insertEvent(data) {
  console.log("Inserting event:", data);

  const eventType = data.eventType || "unknown";

  const result = await pool.query(
    `INSERT INTO events (
      project_key,
      visitor_id,
      event_type,

      path,
      url,
      title,

      page_name,
      hash,
      source,

      tag,
      inner_text,
      element_id,
      classes,
      aria_label,
      role,
      name,
      feature_key,
      feature_name,
      container_tag,
      container_id,
      container_classes,
      container_selector_fingerprint,

      timestamp
    ) VALUES (
      $1,  $2,  $3,
      $4,  $5,  $6,
      $7,  $8,  $9,
      $10, $11, $12,
      $13, $14, $15,
      $16, $17, $18,
      $19, $20, $21,
      $22, $23
    ) RETURNING *;`,
    [
      data.projectKey,                        // $1
      data.visitorId,                         // $2
      eventType,                              // $3

      data.path         || null,              // $4
      data.url          || null,              // $5
      data.title        || null,              // $6

      data.pageName     || null,              // $7  pageview only
      data.hash         || null,              // $8  pageview only
      data.source       || null,              // $9  pageview only

      data.tag          || null,              // $10 interaction only
      data.innerText    || null,              // $11 interaction only
      data.id           || null,              // $12 interaction only
      data.classes      || null,              // $13 interaction only
      data.ariaLabel    || null,              // $14 interaction only
      data.role         || null,              // $15 interaction only
      data.name         || null,              // $16 interaction only
      data.featureKey   || null,              // $17 interaction only
      data.featureName  || null,              // $18 interaction only
      data.containerTag || null,              // $19 interaction only
      data.containerId  || null,              // $20 interaction only
      data.containerClasses            || null, // $21 interaction only
      data.containerSelectorFingerPrint || null, // $22 interaction only

      data.timestamp,                         // $23
    ]
  );

  return result.rows[0];
}

