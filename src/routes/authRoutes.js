
import {Router} from "express"

import {handleAuth}from "../controllers/authController.js"

const router=Router()

router.post("/signup",handleAuth)
router.get("google/signup",handleAuth)
router.post("/login",handleAuth);
router.delete("/logout",handleAuth);


export default router