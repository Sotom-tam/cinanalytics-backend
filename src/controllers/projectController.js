import {addNewProjectServices,verifyProjectServices} from "../services/projectServices.js"
import {getAllProjects,getProjectByKey,getProjectByUrl} from "../model/projectModel.js"

//This route gets all projects stored in the project table
export async function getAllProjectsController(req,res){
    try {
        const projects=await getAllProjects()
        if(!projects){
            return res.status(500).json({message:"Something went wrong",success:false})
        }else{
            return res.status(200).json({header:"Successful",projects:projects,success:true})
        }
    } catch (error) {
        console.log("Error:",error)
        res.status(500).json({erorr:error}) 
    }
}
//to add a new project to the project table
export async function addNewProjectControl(req,res){
    try {
        const {projectUrl,projectName}=req.body
        //console.log(projectUrl)
        const project=await getProjectByUrl(projectUrl)
        if(project){return res.status(400).json({header:"Project Already Exists",message:"This website URL has already been registered as a project. Please verify the URL or open the existing project to continue.",success:false})}      
        const result= await addNewProjectServices(projectUrl,projectName) 
        res.status(200).json({message:"Project Saved",projectKey:result.project_key,success:true})
    } catch (error) {
        console.log("Error:",error)
        res.status(500).json({erorr:error})
    }
}
//This route is for the SDK
//the SDK sends a request here to verify that it's active on the project
export async function verifyProjectControl(req,res){
    const {projectKey,projectName}=req.body
    try {
        //if thesame app tries to send initialse again we need to block it
        const project=await getProjectByKey(projectKey)
        //to check for if the project key does not exist
        if(!project){
            return res.status(400).json({header:"Invalid Project Key",message:"This project key is invalid",success:false})
        }
        if(project.verified){
            return res.status(200).json({message:"You are Verified"})
        }else{//if project with that key has not been verified before
            const {projectIcon,projectKey}=req.body
            const result=await verifyProjectServices(projectIcon,projectKey)
            return res.status(200).json({message:"Project Verified",projectName:projectName,projectKey:projectKey,success:true})
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({erorr:error})
    }
}

export async function verify(req,res){
    const {projectKey}=req.body
    try{
        const project= await getProjectByKey(projectKey)
        console.log(project)
        const isVerified=project.verified
        
        if(isVerified){
            return  res.status(200).json({message:"Project Verified",projectName:project.projectName,projectKey:projectKey,success:true})
        }else{
            return res.status(400).json({message:"Verification Failed, ensure link in in head tag and try again.",success:false})
        }
    }catch(error){
        console.log(error)
    }
}

