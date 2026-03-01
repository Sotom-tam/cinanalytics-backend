import pool from "../db.js"

//to select a particular
export async function featureCount(){
    const result=await pool.query(`
    SELECT 
	'Feature-' || ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS feature_name,
	COUNT(*) AS event_count
    FROM events
    GROUP BY (feature_key)
    ORDER BY event_count DESC;`)
    //console.log(result.rows)
    return result.rows
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

