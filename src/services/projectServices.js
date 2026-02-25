import crypto from "crypto"

import {addNewProject,updateProjectsWithName} from "../model/projectModel.js"

export async function addNewProjectServices(projectUrl){
    const projectKey= generateKey(projectUrl)
    const result= await addNewProject(projectUrl,projectKey)
    return result
}

function generateKey(url) {
  return crypto
    .createHash('sha256')
    .update(url)
    .digest('hex')
    .slice(0, 16); // shorten it
}
export async function verifyProjectServices(projectName,projectKey){
    const result =await updateProjectsWithName(projectName)
    return result.project_name
}

