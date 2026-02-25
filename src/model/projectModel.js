import pool from "../db.js"
import crypto from "crypt"

//function to store the project details
export async function addNewProject(projectUrl,projectKey){
    const result = await pool.query('INSERT INTO projects (name,project_key) VALUES ($1) RETURNING *',[projectUrl,projectKey])
    return result.rows[0]
}

