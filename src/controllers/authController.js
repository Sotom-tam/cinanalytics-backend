
import {sendUserEmail,genMagicToken} from "../services/authServices.js"

export const isAuthenticated=(req,res,next)=>{
    if(req.isAuthenticated()){
        next()
    }
    res.json({message:"User Not authorised Redirect to guest",userRole:"guest",isAuthenticated:false})
}

export const handleAuth=async(req,res,next)=>{
    const email=req.body.email
    try {
        const result=await genMagicToken(email)
        console.log(result)
    } catch (error) {
        console.log(error)
    }
}

