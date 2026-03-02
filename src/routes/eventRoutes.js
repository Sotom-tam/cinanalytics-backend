import {Router} from "express"
import { storeEvent,fetchFeatureData,fetchDashboard,fetchProjectData} from "../controllers/eventController.js"

const router=Router()

router.post("/",storeEvent)
router.get("/",fetchFeatureData)
router.get("/dashboard-data",fetchDashboard)
router.post("/project-data",fetchProjectData)

export default router

