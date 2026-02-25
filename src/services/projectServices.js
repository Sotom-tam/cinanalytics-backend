import crypto from "crypto"

import {addNewProject} from "../model/projectModel.js"

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