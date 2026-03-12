import {getProjectSummaryData,getProjectFeatureData,getSummaryStats,getTop3PerformingProjects,getProjectByProjectKey,getLeastUsedFeatures,getAllFeatures} from "../model/eventModel.js"
import {getDuplicateEvents,getClicksAfterPageView,deleteEventById,getInsightsByProjectKey} from "../model/eventModel.js"
import {getLeastUsedFeaturesByProject,getMostUsedFeaturesByProject,getLeastVisitedPagesByProject,getMostVisitedPagesByProject} from "../model/eventModel.js"
import {getProjectInsights,getKeyInsightProjectOverview} from "../config/inisights.js"
export async function getFeatureData() {
    const data=await getAllFeatures()
    return data
}

export async function getFeatureDataByProjectKey() {
    const data=await getAllFeatures()
    return data
}


export async function getDashBoardDataAcrossProject(){
    const summaryData=await getSummaryStats()
    const leastUsedFeatures=await getLeastUsedFeatures()
    const projectPeformanceData=await getTop3PerformingProjects()
    return{
        summaryData:summaryData,
        leastUsedFeatures:leastUsedFeatures,
        chartData:projectPeformanceData,
    }
}

export async function getDashBoardKeyInsights(){
    const summaryData=await getSummaryStats()
    const leastUsedFeatures=await getLeastUsedFeatures()
    const projectPeformanceData=await getTop3PerformingProjects()
    const keyInsights=await getKeyInsightProjectOverview({
        summaryData:summaryData,
        leastUsedFeatures:leastUsedFeatures,
        chartData:projectPeformanceData,
    })
    return{
        keyInsights:keyInsights,
    }
}

export async function getProjectData(projectKey){
    const allProjectData= await getProjectSummaryData()
    const projectData= allProjectData.find((project)=>{
        return project.project_key===projectKey
    })
    const allfeatures= await getProjectFeatureData()
    const projectFeature= allfeatures.find((project)=>{
        return project.project_key===projectKey
    })
    const projectOverview=await getProjectByProjectKey(projectKey)
    const mostUsedFeatures=await getMostUsedFeaturesByProject(projectKey)
    const leastUsedFeatures=await getLeastUsedFeaturesByProject(projectKey)
    const mostVisitedPages=await getMostVisitedPagesByProject(projectKey)
    const leastVisitedPages=await getLeastVisitedPagesByProject(projectKey)
    // console.log("Project Overview:",projectOverview,"\n",
    //      "Project Data:",projectData,"\n",
    //    "Most Used Features:", mostUsedFeatures,"\n",
    //    "Least Used Features:",leastUsedFeatures,"\n",
    //    "Most Visited Pages:",mostVisitedPages,"\n",
    //    "Least Visited Pages:",leastVisitedPages
    // )
    return {
        projectData:projectData,
        projectOverview:projectOverview,
        projectFeature:projectFeature,
        mostUsedFeatures: mostUsedFeatures,
        leastUsedFeatures:leastUsedFeatures,
        mostVisitedPages:mostVisitedPages,
        leastVisitedPages:leastVisitedPages,
    }
}


export async function getProjectInsightsData(projectKey){
    const currentDate=Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    try {
        const insights= await getInsightsByProjectKey(projectKey)
        let keyInsights
        if(insights){
        if(currentDate>=insights.created_at+sevenDays) {//generate new insights
            const projectData=await getProjectData(projectKey)
            keyInsights=await getProjectInsights(projectData,projectKey)
            return keyInsights
        }else{
            console.log(insights)
            return insights.insights
        }}else{//generate new insights if they don't already exist
            const projectData= await getProjectData(projectKey)
            keyInsights=await getProjectInsights(projectData,projectKey)
            console.log("Insights:",keyInsights)
            return keyInsights
        }
    } catch (error) {
        console.log(error)
        return error
    }
    
}


export async function deduplicationService(event) {
    const {visitorId,featureKey,path,projectKey,eventType,timestamp}=event
    const duplicateEvent= await getDuplicateEvents({visitorId,featureKey,path,projectKey,eventType,timestamp})
    const clickAfterPageView=await getClicksAfterPageView({visitorId,path,projectKey,timestamp,eventType})
    console.log("duplicate:",duplicateEvent,"click after:",clickAfterPageView)
    if(duplicateEvent||clickAfterPageView){
        console.log("Duplicate Project")
        console.log("Duplicate Event:",event)
        return {message:"Duplicate Project",duplicateEvent:true}
    }else{
        return {message:"Not a Duplicate",duplicateEvent:false}
    }
    
}
export async function deduplicationDeleteService(event) {
    const {visitorId,featureKey,path,projectKey,eventType,timestamp}=event
    const duplicateEvents= await getDuplicateEvents({visitorId,featureKey,path,projectKey,eventType,timestamp})
    const clicksAfterPageView=await getClicksAfterPageView({visitorId,path,projectKey,timestamp,eventType})
    console.log(duplicateEvents,clicksAfterPageView)
    const eventsToDelete = [
    ...(duplicateEvents || []),
    ...(clicksAfterPageView || []),
  ];
  console.log("Events to delete",eventsToDelete)
  if (eventsToDelete.length === 0) return;//no events

  // Proper async handling
  await Promise.all(
    eventsToDelete.map((ev) => deleteEventById(ev.id))
  );

  console.log(`Deleted ${eventsToDelete.length} noisy events`);
}
const event = {
  visitorId: "v_086232125aa906711772440002560",
  eventType: "click",
  path: "/tasks",
  featureKey: null,
  projectKey: "proj_028268c1abf9ec55",
  timestamp: 1772441435335
};
