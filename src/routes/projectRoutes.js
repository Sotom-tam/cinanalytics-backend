
import {Router} from "express"

import {addNewProjectControl,verifyProjectControl} from "../controllers/projectController.js"

const router=Router()

router.post("/add-project",addNewProjectControl)
router.post("/verify-project",verifyProjectControl)


export default router