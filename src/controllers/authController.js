import bcrypt from "bcrypt"
import pool from "../db.js"
import {genMagicToken,sendMagicLink,findTokenByEmail,sendVerificationEmail,verifyOtpService}from "../services/authServices.js"
import {getUserByEmail,getUserById,deleteMagicToken,updateVerified} from "../model/authModel.js"
import passport from "../config/passport.js"


//to check if user is logged in
export async function checkUser(req, res) {
  if (!req.user) {
    // destroy stale session if it exists
    if (req.session) {
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
      });
    }
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  return res.status(200).json({ success: true, user: req.user });
}

export async function getUserData(req,res){
  //user should be logged in and have a session
  if(req.user){
    console.log(req.user)
  const userId=req.user.id
  const user= await getUserById(userId)
  if(user){
    return res.status(200).json(user)
  }else{
    return res.status(401).json({header:"Wrong Email",message:"This email is not registered on Cinalytics",success:false})
  }
  }else{
    const userId=req.query.id
    console.log(userId)
    const user= await getUserById(userId)
    if(user){
      console.log(user)
    return res.status(200).json(user)
  }else{
    return res.status(401).json({message:"This email is not registered on Cinalytics",success:false})
  }
  }
}

export async function googleAuth(req,res,next){
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      passport.authenticate("google", {
        scope: ["profile", "email"],
        failureRedirect: `${process.env.FRONTEND_URL}`,
      })(req, res, next);
    });
  });
}

export const googleCallback = [
    passport.authenticate("google",{
    failureRedirect: `${process.env.FRONTEND_URL}`,
    session: true
  }),
  (req, res, next) => {
    // Ensure user is fully logged in before redirect
    req.login(req.user, (err) => {
      if (err) return next(err);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard.html`);
    });
  },
];
export async function login(req,res,next){
    const email=req.body.email
    const user=await getUserByEmail(email)
    if(!user){
        return res.status(401).json({header:"Wrong Email",message:"This email is not registered on Cinalytics",success:false})
    }
    req.login(user,(err)=>{
        if(err){return next(err)}
        return res.status(200).json({message:"User Authenticated Successfully",success:true})
    })     
}
export async function requestMagicLink(req, res) {
  //console.log("controller,",req.body)
  try {
    const email  = req.body.email;
    console.log(email)
    const isUser=await getUserByEmail(email)
    console.log(isUser)
    if(isUser.email&&isUser.verified===true){
      return res.status(400).json({header:"You Already Have an Account",message:"Your Account already exists, Please login",success:false})
    }else{
      // generate secure token
    const token =await genMagicToken(email);
    //console.log(token)
    // TODO: store hashed token in DB here
    // send email
    res.status(200).json({ message: "Magic link sent. Please check your email" });
    // send email in background
    //console.log("📨 Attempting SMTP connection...");
    await sendMagicLink(email, token).catch(err =>
      console.error("Email failed:", err)
    );
    //console.log("✅ Email sent");
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function verify(req,res,next){
    //console.log(req.query.token)
    try {
        const {email,token}= req.query
        console.log("user email:",email,"Token in url:",token)
        if (!token) {
        return res.status(400).send("Invalid link");
        }
        const user=await getUserByEmail(email)
        console.log(user)
        const tokens = await findTokenByEmail(email);
        console.log("stored Token",tokens.token_hash)
        if (!tokens) {
          return res.status(400).json({header:"Wrong Token",message:"Token not found",success:false});
        }
        const isValid= await bcrypt.compare(token,tokens.token_hash);
        //console.log("isValid:",isValid)
        if(isValid){
         // console.log("in is valid",isValid)
          const user=await updateVerified(email);
          //console.log(user)
          req.login(user,(err)=>{
                if(err){return next(err)}
                return res.status(200).json({message:"User Authenticated Successfully",success:true})
            })  
        }else{
           return res.status(401).json({message:"Invalid token",success:false})  
        }  
    } catch (error) {
      console.log(error)
      res.status(500).json({message:"Verification failed"});
    }
}

export async function sendOtp(req, res, next) {
  try {
    const email = req.body.email;
    //console.log(email)
    const user = await getUserByEmail(email);
    //console.log("LOGIN USER:", user);
    if (!user) {
      return res.status(404).json({
        success: false,
        header:"Wrong Email",
        message: "This email is not registered on Cinalytics",
      });
    }
    req.login(user,async(err)=>{
      if(err){return next(err)}
      req.session.pendingEmail = email;
      req.session.otpPending = true;
      //console.log("req session email",req.session.pendingEmail)
      await sendVerificationEmail(user.email);
      req.session.save(() => {
      return res.status(200).json({ success: true, message: "OTP sent" });
    });
})
  } catch (err) {
    next(err);
  }
}

export const verifyOtp = async (req, res, next) => {
  try {
    const { otp ,email} = req.body;
    console.log(email,otp)   
    const user = await getUserByEmail(email);
    // Calling service to verify otp
    const result = await verifyOtpService(email, otp);
    if(result.success){
      req.login(user, (err) => {
      if (err) return next(err);
      delete req.session.pendingEmail;
      return res.status(200).json({message: "Otp Verified Successfully",success: true,});
    });
    }else{
      return res.status(400).json({header:"Wrong Otp Code",message:result.message,success:false})
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};