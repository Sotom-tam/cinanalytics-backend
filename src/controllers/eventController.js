import { insertEvent,getProjectByProjectKey } from "../model/eventModel.js"

import {deduplicationService} from "../services/eventServices.js"
import {getFeatureData,getDashBoardDataAcrossProject,getDashBoardKeyInsights,getProjectData,getProjectInsightsData} from "../services/eventServices.js"


//deduplication middleware to prevent storing duplicate and clicks that are tied to page views
export async function deduplicationControlller(req,res,next) {
    const event=req.body
    console.log("The Event:",event)
    const result=await deduplicationService(event)
    if(result.duplicateEvent){
        console.log("duplicate")
        return res.status(200).json({message:"Duplicate Event not saved"})
    }else{
        console.log("not duplicate")
        next(event)
    }
}
export async function fetchDashboard(req,res){
    try {
        const {summaryData,leastUsedFeatures,chartData,keyInsights}=await getDashBoardDataAcrossProject()
        //console.log(summaryData,leastUsedFeatures)
        return res.status(200).json({
            summaryData:summaryData,
            leastUsedFeatures:leastUsedFeatures,
            chartData:chartData,
            keyInsights:keyInsights,
        })        
    } catch (error) {
        console.log("Error:",error)
        res.status(500).json({error:error})
    }
    
}

export async function fetchDashboardInisights(req,res){
    try {
        const {keyInsights}=await getDashBoardKeyInsights()
        //console.log(summaryData,leastUsedFeatures)
        return res.status(200).json({
            keyInsights:keyInsights,
        })        
    } catch (error) {
        console.log("Error:",error)
        res.status(500).json({error:error})
    }
    
}

export async function fetchProjectData(req,res){
    try {
       const {projectKey}=req.body
       //console.log(projectKey)
    if(projectKey){
        const project=await getProjectByProjectKey(projectKey)
        //console.log('Project Found:',project)
        if(project){
            const projectData=await getProjectData(projectKey)
            //console.log("Project Data:",projectData)

            return res.status(200).json({projectData,success:true})
        }else{
            return res.status(400).json({message:"Project not saved on Cinalytics",success:false})
        }
    }else{
        return res.status(400).json({message:"Project Key not found",success:false})
    } 
    } catch (error) {
        console.log("Error:",error)
        res.status(500).json({error:error})
    }
    
    
}

export async function fetchProjectInsights(req,res){
    try {
       const {projectKey}=req.body
       //console.log(projectKey)
    if(projectKey){
        const project=await getProjectByProjectKey(projectKey)
        //console.log('Project Found:',project)
        if(project){
            const projectInsights=await getProjectInsightsData(projectKey)
            console.log("Project Insights:",projectInsights)
            return res.status(200).json({projectInsights:projectInsights,success:true})
        }else{
            return res.status(400).json({message:"Project not saved on Cinalytics",success:false})
        }
    }else{
        return res.status(400).json({message:"Project Key not found",success:false})
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

