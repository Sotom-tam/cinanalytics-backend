
import {Router} from "express"

import {checkUser,logoutUser,requestMagicLink,verify,googleAuth,googleCallback,sendOtp,verifyOtp,getUserData}from "../controllers/authController.js"

const router=Router()

router.post("/signup",requestMagicLink)
router.get("/verify",verify)
router.post("/send-otp",sendOtp)
router.post("/verify-otp",verifyOtp)
router.get("/google",googleAuth)
router.get("/google/callback",googleCallback)
router.get("/get-user",getUserData)
router.get("/check-user",checkUser)
router.get("/logout-user",logoutUser)

export default router