import pool from "../db.js"


//function to store the project details
export async function addNewProject(projectUrl,projectKey){
    const result = await pool.query('INSERT INTO projects (name,project_key) VALUES ($1) RETURNING *;',[projectUrl,projectKey])
    return result.rows[0]
}

export async function getProjectByKey(projectKey) {
    const result = await pool.query('SELECT * FROM projects WHERE project_key=$1;',[projectKey])
    return result.rows[0]
}

export async function updateProjectsWithName(projectName) {
    const result = await pool.query('UPDATE projects SET project_name=$1 RETURNING *;',[projectName])
    return result.rows[0]
}

