import pool from "../db.js"


//function to store the project details
export async function addNewProject(projectUrl,projectKey){
    //console.log(projectUrl,projectKey)
    const result = await pool.query('INSERT INTO projects (project_url,project_key) VALUES ($1,$2) RETURNING *;',[projectUrl,projectKey])
    console.log(result.rows[0])
    return result.rows[0]
}

export async function getProjectByKey(projectKey) {
    const result = await pool.query('SELECT * FROM projects WHERE project_key=$1;',[projectKey])
    return result.rows[0]
}

export async function updateProjects(projectName,projectKey) {
    const result = await pool.query('UPDATE projects SET project_name=$1, verified=true WHERE project_key=$2 RETURNING *;',[projectName,projectKey])
    return result.rows[0]
}

