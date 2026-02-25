
import {Router} from "express"

import {addNewProjectControl} from "../controllers/projectController.js"

const router=Router()

router.post("/add-project",addNewProjectControl)


export default router