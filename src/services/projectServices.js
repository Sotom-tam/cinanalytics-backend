import crypto from "crypto"

import {addNewProject,updateProjects} from "../model/projectModel.js"

export async function addNewProjectServices(projectUrl,projectName){
   
    const projectKey= "proj_"+generateKey(projectUrl)
    //console.log(projectKey,projectUrl)
    const result= await addNewProject(projectUrl,projectKey,projectName)
    return result
}



function generateKey(url) {
  return crypto
    .createHash('sha256')
    .update(url)
    .digest('hex')
    .slice(0, 16); // shorten it
}
export async function verifyProjectServices(projectIcon,projectKey){
    const result =await updateProjects(projectIcon,projectKey)
    return result
}

