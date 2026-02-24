import bcrypt from "bcrypt"
import {genMagicToken,sendMagicLink,findTokenByEmail,sendVerificationEmail,verifyOtpService}from "../services/authServices.js"
import {getUserByEmail,getUserById,deleteMagicToken} from "../model/authModel.js"
import passport from "../config/passport.js"


export async function getUserData(req,res){
  //user should be logged in and have a session
  if(req.user){
    console.log(req.user)
  const userId=req.user.id
  const user= await getUserById(userId)
  if(user){
    return res.status(200).json(user)
  }else{
    return res.status(404).json({message:"User not Found",success:false})
  }
  }else{
    const userId=req.query.id
    console.log(userId)
    const user= await getUserById(userId)
    if(user){
      console.log(user)
    return res.status(200).json(user)
  }else{
    return res.status(404).json({message:"User not Found",success:false})
  }
  }
}

export const googleAuth = passport.authenticate("google", {
  failureRedirect: `${process.env.FRONTEND_URL}`,
  scope: ["profile", "email"],
});
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
        return res.status(401).json({message:"User not Found",success:false})
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
    // generate secure token
    const token =await genMagicToken(email);
    //console.log(token)
    // TODO: store hashed token in DB here
    // send email
    res.json({ message: "Magic link sent" });
    // send email in background
    console.log("📨 Attempting SMTP connection...");
    await sendMagicLink(email, token).catch(err =>
      console.error("Email failed:", err)
    );
    console.log("✅ Email sent");
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
          console.log("yoo")
          return res.status(400).json({message:"Token not found",success:false});
        }
        // if(new Date() > tokens.expires){
        //   console.log("(error)")
        //   await deleteMagicToken(email)
        //   return res.status(404).json({message:"Token has Expired",success:false})
        // }
        const isValid= await bcrypt.compare(token,tokens.token_hash);
        console.log("isValid:",isValid)
        if(isValid){
            req.login(user,(err)=>{
                if(err){return next(err)}
                return res.status(200).json({message:"User Authenticated Successfully",success:true})
            })  
        }
        if(!isValid){
           return res.status(401).json({message:"Invalid token",success:false})  
        }  
    } catch (error) {
        res.status(500).send("Verification failed");
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
        message: "User not found",
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
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }    
    console.log(email)
    const user = await getUserByEmail(email);
    // 4️⃣ Call service to verify
    if(!email){
      console.log("email not found")
      return res.status(400).json({
        success: false,
        message: "No email attached to session. Please login again.",
      });
    }
    const result = await verifyOtpService(email, otp);
    req.login(user, (err) => {
      if (err) return next(err);
      delete req.session.pendingEmail;
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};