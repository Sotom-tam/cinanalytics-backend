import pool from "../db.js"


export async  function getProjectByProjectKey(projectKey){
  const result =await pool.query(`SELECT * FROM projects WHERE project_key=$1`,[projectKey])
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

  const result = await pool.query(
    `SELECT
      events.project_key,
      events.feature_key,
      events.feature_name,
      projects.project_name,
      projects.project_icon,
      COUNT(*)                   AS total_interactions,
      COUNT(DISTINCT events.visitor_id) AS unique_users
    FROM events
    JOIN projects ON events.project_key=projects.project_key
    WHERE event_type != 'pageview'
      AND feature_key IS NOT NULL
      AND timestamp >= $1
    GROUP BY events.project_key, events.feature_key, events.feature_name,projects.project_name,projects.project_icon
    HAVING COUNT(*) < 2
    ORDER BY events.project_key, total_interactions ASC;`,
    [cutoff]
  );
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
    ORDER BY MIN(DATE_TRUNC('month',TO_TIMESTAMP(events.timestamp/1000))),events.project_key ASC`)

  //console.log(result.rows)
  return result.rows
}

export async function getLeastUsedFeaturesByProject(projectKey) {

  const result = await pool.query(
    `SELECT
      events.project_key,
      events.feature_key,
      events.feature_name,
      projects.project_icon,
      COUNT(*) AS total_interactions,
      COUNT(DISTINCT events.visitor_id) AS unique_users
    FROM events
    JOIN projects ON events.project_key=projects.project_key
    WHERE event_type != 'pageview'
      AND events.feature_key IS NOT NULL
      AND events.project_key=$1
    GROUP BY events.project_key, events.feature_key, events.feature_name,projects.project_icon
    HAVING COUNT(*) < 2
    ORDER BY events.project_key, total_interactions ASC;`,
    [projectKey]
  );
  //console.log(result.rows)
  return result.rows
}


export async function getMostUsedFeaturesByProject(projectKey) {

  const result = await pool.query(
    `SELECT
      events.project_key,
      events.feature_key,
      events.feature_name,
      projects.project_icon,
      COUNT(*) AS total_interactions,
      COUNT(DISTINCT events.visitor_id) AS unique_users
    FROM events
    JOIN projects ON events.project_key=projects.project_key
    WHERE event_type != 'pageview'
      AND events.feature_key IS NOT NULL
      AND events.project_key=$1
    GROUP BY events.project_key, events.feature_key, events.feature_name,projects.project_icon
    HAVING COUNT(*) >= 2
    ORDER BY events.project_key, total_interactions ASC;`,
    [projectKey]
  );
  //console.log(result.rows)
  return result.rows
}


export async function getLeastVisitedPagesByProject(projectKey) {

  const result = await pool.query(
    `SELECT
      events.project_key,
      events.page_name,
      projects.project_icon,
      COUNT(*) AS total_interactions,
      COUNT(DISTINCT events.visitor_id) AS unique_users
    FROM events
    JOIN projects ON events.project_key=projects.project_key
    WHERE event_type = 'pageview'
      AND events.project_key=$1
    GROUP BY events.project_key,events.page_name,projects.project_icon
    HAVING COUNT(*) < 2
    ORDER BY events.project_key, total_interactions ASC;`,
    [projectKey]
  );
  //console.log("pages:",result.rows)
  return result.rows
}


export async function getMostVisitedPagesByProject(projectKey) {

  const result = await pool.query(
    `SELECT
      events.project_key,
      events.page_name,
      projects.project_icon,
      COUNT(*) AS total_interactions,
      COUNT(DISTINCT events.visitor_id) AS unique_users
    FROM events
    JOIN projects ON events.project_key=projects.project_key
    WHERE event_type = 'pageview'
      AND events.project_key=$1
    GROUP BY events.project_key,events.page_name,projects.project_icon
    HAVING COUNT(*) >= 2
    ORDER BY events.project_key, total_interactions ASC;`,
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
    ORDER BY events.project_key, total_interactions DESC;`,
    [cutoff]
  );
  //console.log(result.rows)
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

