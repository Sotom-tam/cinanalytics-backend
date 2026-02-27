
import {Router} from "express"

import {addNewProjectControl,verifyProjectControl,verify} from "../controllers/projectController.js"

const router=Router()

router.post("/add-project",addNewProjectControl)
router.post("/verify-project",verifyProjectControl)
router.post("/verify",verify)


export default router