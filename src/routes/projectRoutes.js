
import {Router} from "express"

import {getAllProjectsController,addNewProjectControl,verifyProjectControl,verify} from "../controllers/projectController.js"

const router=Router()

router.get("/all",getAllProjectsController)
router.post("/add-project",addNewProjectControl)
router.post("/verify-project",verifyProjectControl)
router.post("/verify",verify)


export default router