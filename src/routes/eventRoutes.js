import {Router} from "express"
import {deduplicationControlller,storeEvent,fetchFeatureData,fetchDashboard,fetchDashboardInisights,fetchProjectData,fetchProjectInsights} from "../controllers/eventController.js"

const router=Router()

router.post("/",storeEvent)
router.get("/",fetchFeatureData)
router.get("/dashboard-data",fetchDashboard)
router.post("/project-data",fetchProjectData)
router.post("/project-insights",fetchProjectInsights)

export default router

