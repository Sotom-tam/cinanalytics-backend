import {addNewProjectServices} from "../model/projectServices.js"


export async function addNewProjectControl(req,res){
    try {
        const {projectUrl}=req.body
        const result= await addNewProjectServices(projectUrl) 
        res.status(200).json({message:"Project Saved",projectKey:result.project_key,success:true})
    } catch (error) {
        res.status(500).json({erorr:"error "})
    }
}