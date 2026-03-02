import {getSummaryStats,getTopPerformingProject,getProjectByProjectKey,getLeastUsedFeatures,getAllFeatures} from "../model/eventModel.js"
import {getDuplicateEvents,getClicksAfterPageView,deleteEventById} from "../model/eventModel.js"
import {getLeastUsedFeaturesByProject,getMostUsedFeaturesByProject,getLeastVisitedPagesByProject,getMostVisitedPagesByProject} from "../model/eventModel.js"

export async function getFeatureData() {
    const data=await getAllFeatures()
    return data
}

export async function getFeatureDataByProjctKey() {
    const data=await getAllFeatures()
    return data
}


export async function getDashBoardDataAcrossProject(){
    const summaryData=await getSummaryStats()
    const leastUsedFeatures=await getLeastUsedFeatures()
    const projectPeformnaceData=await getTopPerformingProject()
    return{summaryData:summaryData,leastUsedFeatures:leastUsedFeatures,projectPeformnaceData:projectPeformnaceData}
}

export async function getProjectData(projectKey){
    const projectData=await getProjectByProjectKey(projectKey)
    const mostUsedFeatures=await getMostUsedFeaturesByProject(projectKey)
    const leastUsedFeatures=await getLeastUsedFeaturesByProject(projectKey)
    const mostVisitedPages=await getMostVisitedPagesByProject(projectKey)
    const leastVisitedPages=await getLeastVisitedPagesByProject(projectKey)
    // console.log("Project Overview:",projectData,"\n",
    //    "Most Used Features:", mostUsedFeatures,"\n",
    //    "Least Used Features:",leastUsedFeatures,"\n",
    //    "Most Visited Pages:",mostVisitedPages,"\n",
    //    "Least Visited Pages:",leastVisitedPages
    // )
    return {
        projectOverview:projectData,
        mostUsedFeatures: mostUsedFeatures,
        leastUsedFeatures:leastUsedFeatures,
        mostVisitedPages:mostVisitedPages,
        leastVisitedPages:leastVisitedPages,
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
