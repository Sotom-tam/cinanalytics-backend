import {getSummaryStats,getProjectByProjectKey,getLeastUsedFeatures,getAllFeatures} from "../model/eventModel.js"
import {getLeastUsedFeaturesByProject,getMostUsedFeaturesByProject,getLeastVisitedPagesByProject,getMostVisitedPagesByProject} from "../model/eventModel.js"

export async function getFeatureData() {
    const data=await getAllFeatures()
    return data
}

export async function getFeatureDataByProjctKey() {
    const data=await getAllFeatures()
    return data
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

export async function getDashBoardDataAcrossProject(){
    const summaryData=await getSummaryStats()
    const leastUsedFeatures=await getLeastUsedFeatures()
    return{summaryData:summaryData,leastUsedFeatures:leastUsedFeatures}
}
