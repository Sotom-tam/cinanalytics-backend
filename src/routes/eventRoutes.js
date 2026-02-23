import {Router} from "express"
import { storeEvent,fetchFeatureData } from "../controllers/eventController.js"

const router=Router()

router.post("/",storeEvent)
router.get("/",fetchFeatureData)

export default router