import pool from "../db.js"


//function to store the project details
export async function addNewProject(projectUrl,projectKey,projectName){
    //console.log(projectUrl,projectKey)
    const result = await pool.query('INSERT INTO projects (project_url,project_key,project_name) VALUES ($1,$2,$3) RETURNING *;',[projectUrl,projectKey,projectName])
    console.log(result.rows[0])
    return result.rows[0]
}

export async function getProjectByKey(projectKey) {
    const result = await pool.query('SELECT * FROM projects WHERE project_key=$1;',[projectKey])
    return result.rows[0]
}

export async function getProjectByUrl(projectUrl) {
    const result = await pool.query('SELECT * FROM projects WHERE project_url=$1;',[projectUrl])
    return result.rows[0]
}
export async function getAllProjects(){
    const result=await pool.query('SELECT * FROM projects')
    return result.rows
    
}
//function to update the project with it's name and icon from The Site
export async function updateProjects(projectIcon,projectKey) {
    const result = await pool.query('UPDATE projects SET project_icon=$1,verified=true WHERE project_key=$2 RETURNING *;',[projectIcon,projectKey])
    return result.rows[0]
}

