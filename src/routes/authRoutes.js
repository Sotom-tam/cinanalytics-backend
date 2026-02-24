
import {Router} from "express"

import {requestMagicLink,verify,googleAuth,googleCallback,sendOtp,verifyOtp}from "../controllers/authController.js"

const router=Router()

router.post("/signup",requestMagicLink)
router.get("/verify",verify)
router.post("/send-otp",sendOtp)
router.post("/verify-otp",verifyOtp)
router.get("/google",googleAuth)
router.get("/google/callback",googleCallback)


export default router