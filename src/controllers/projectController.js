import {addNewProjectServices,verifyProjectServices} from "../services/projectServices.js"
import {getProjectByKey} from "../model/projectModel.js"

export async function addNewProjectControl(req,res){
    try {
        const {projectUrl}=req.body
        //console.log(projectUrl)
        const result= await addNewProjectServices(projectUrl) 
        res.status(200).json({message:"Project Saved",projectKey:result.project_key,success:true})
    } catch (error) {
        res.status(500).json({erorr:error})
    }
}

export async function verifyProjectControl(req,res){
    console.log(req.body)
    try {
        const result=await verifyProjectServices(req.body.projectName,req.body.projectKey)
        res.redirect(`http://localhost:4000/api/project/verify?projectKey=${result.project_key}`)
    } catch (error) {
        console.log(error)
        res.status(500).json({erorr:error})
    }
}

export async function verify(req,res){
    const {projectKey,projectName}=req.query
    try{
        const project= await getProjectByKey(projectKey)
        console.log(project)
        const isVerified=project.verified
        
        if(isVerified){
            return  res.status(200).json({message:"Project Verified",projectName:projectName,projectKey:projectKey,success:true})
        }else{
            return res.status(400).json({message:"Verification Failed, ensure link in in head tag and try again.",success:false})
        }
    }catch(error){
        console.log(error)
    }
}

