import bcrypt from "bcrypt"
import {genMagicToken,sendMagicLink,findTokenByEmail,sendVerificationEmail,verifyMagicLinkToken,verifyOtpService}from "../services/authServices.js"
import {getUserByEmail,getUserById,deleteMagicTokenByEmail,updateVerified, deleteMagicTokenById} from "../model/authModel.js"
import passport from "../config/passport.js"


//to check if user is logged in
export async function checkUser(req, res) {
  if (!req.user) {
    // destroy stale session if it exists
    if (req.session) {
      return req.session.destroy(() => {
        res.clearCookie("connect.sid");
        return res.status(401).json({success: false,message: "Not authorized"});
      });
    }
    return res.status(401).json({success: false,message: "Not authorized"});
  }
  return res.status(200).json({ success: true, user: req.user });
}

export async function getUserData(req,res){
  //user should be logged in and have a session
  const userId=req.user?req.user.id:req.query.id
  const user= await getUserById(userId)
  if(user){
    return res.status(200).json(user)
  }else{
    return res.status(401).json({header:"Session Ended",message:"User is not logged in to session",success:false})
  }
}

export async function googleAuth(req,res,next){
  //to logout any existing session from the user
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
//runs after google auth is successfu;
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

//Sends a magic link to the provided email for account verification/signup.
//Rejects the request if the user already has a verified account.
export async function requestMagicLink(req, res) {
  //console.log("controller,",req.body)
  try {
    const {email}  = req.body;
    //console.log(email)
    const existingUser=await getUserByEmail(email)
    //console.log("existingUser:",existingUser)
    //if user is verified already check
    if(existingUser?.verified){
      return res.status(400).json({header:"You already have an account",message:"Your Account already exists, Please login",success:false})
    }else{
    //Delete Old Magic Token 
    await deleteMagicTokenById(existingUser.id)
    // generate new secure token and store it
    const token =await genMagicToken(email);
    // send email. I decided to send success because of the time it takes to send the email
    res.status(200).json({ message: "Magic link sent. Please check your email" });
    // send email in background
    await sendMagicLink(email, token).catch(err =>
      console.error("Email failed:", err)
    )}
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function verify(req,res,next){
    //console.log(req.query.token)
    try {
      //getting email and token from request query
        const {email,token}= req.query
        if (!token||!email) {
        return res.status(400).json({header:"Invalid link",message:"This login link is invalid. Please request a new magic link to continue."});
        }
        const result=await verifyMagicLinkToken(email,token)
        //console.log("isValid:",isValid)
        if(result.success){
          const user=await updateVerified(email);
          //console.log(user)
          req.login(user,(err)=>{
                if(err){return next(err)}
                return res.status(200).json({message:"User Authenticated Successfully",success:true})
            })  
        }else{
           return res.status(401).json(result)  
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
    // Calling service to verify otp
    const result = await verifyOtpService(email, otp);
    if(result.success){
      const user = await getUserByEmail(email);
      req.login(user, (err) => {
      if (err) return next(err);
      delete req.session.pendingEmail;
      return res.status(200).json({header:result.header,message: "Otp Verified Successfully",success: true,});
    });
    }else{
      return res.status(400).json({header:result.header,message:result.message,success:false})
    }
  } catch (error) {
    return res.status(400).json({success: false,message: error.message});
  }
};