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
export async function insertInto(data) {
    console.log("data:",data)
    const values=[data.visitorId,
    data.eventType,
    data.innerText,
    data.parentElement,
    data.tag,
    data.id,
    data.classes,
    data.ariaLabel,
    data.role,
    data.name,
    data.page,
    data.baseUrl,
    data.timeStamp]
    console.log(values.length)
    const result=await pool.query(` INSERT INTO events (
      visitor_id,
      event_type,
      element_text,
      parent_tag,
      element_tag,
      element_id,
      element_classes,
      element_aria_label,
      element_role,
      element_name,
      page,
      base_url,
      timestamp,
      selector_finger_print,
      feature_key)
    VALUES (
      $1,$2,$3,$4,$5,
      $6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15)
    RETURNING *;`,
  [
    data.visitorId,
    data.eventType,
    data.innerText,
    data.parentElement,
    data.tag,
    data.id,
    data.classes,
    data.ariaLabel,
    data.role,
    data.name,
    data.page,
    data.baseUrl,
    data.timeStamp,
    data.selectorFingerPrint,
    data.featureKey
  ])

    return result.rows
}

