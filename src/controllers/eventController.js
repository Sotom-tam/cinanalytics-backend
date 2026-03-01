import { insertEvent,getProjectByProjectKey } from "../model/eventModel.js"
import {getFeatureData,getDashBoardDataAcrossProject,getProjectData} from "../services/eventServices.js"


export async function fetchDashboard(req,res){
    try {
        const {summaryData,leastUsedFeatures}=await getDashBoardDataAcrossProject()
        console.log(summaryData,leastUsedFeatures)
        return res.status(200).json({summaryData:summaryData,leastUsedFeatures:leastUsedFeatures})        
    } catch (error) {
        console.log("Error:",error)
        res.status(500).json({error:error})
    }
    
}

export async function fetchProjectData(req,res){
    try {
       const {projectKey}=req.body
    if(!projectKey){
        const project=await getProjectByProjectKey()
        if(project){
            const projectData=await getProjectData(projectKey)
            console.log("Project Data:",data)
            return res.status(200).json({projectData,success:true})
        }else{
            return res.status(500).json({message:"Something went wrong",success:false})
        }
    }else{
        return res.status(400).json({message:"Invalid Project key",success:false})
    } 
    } catch (error) {
        console.log("Error:",error)
        res.status(500).json({error:error})
    }
    
    
}


export async function fetchFeatureData(req,res) {
    const data=await getFeatureData()
    console.log(data)
    return res.json(data)
}

export async function storeEvent(req,res) {
    const eventData=req.body
    console.log("Event Data",eventData)
    const result=await insertEvent(eventData) 
    console.log(result)
    return res.status(200).json({message:"Success"})
}

