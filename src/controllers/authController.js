import bcrypt from "bcrypt"
import {genMagicToken,sendMagicLink,findTokenByEmail,sendVerificationEmail,verifyOtpService}from "../services/authServices.js"
import {getUserByEmail,} from "../model/authModel.js"
import passport from "../config/passport.js"

export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});
export const googleCallback = [
    passport.authenticate("google"),
    (req, res) => {
    res.status(200).json({message:"User Login Successful",success:true});
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
  console.log("controller,",req.body)
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
    sendMagicLink(email, token).catch(err =>
      console.error("Email failed:", err)
    );
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
        const storedToken = await findTokenByEmail(email);
        console.log("stored Token",storedToken)
        if (!storedToken) {
            return res.status(400).json({message:"Token not found",success:false});
        }
        const isValid= await bcrypt.compare(token,storedToken);
        console.log(isValid)
        if(isValid){
            req.login(user,(err)=>{
                if(err){return next(err)}
                return res.status(200).json({message:"User Authenticated Successfully",success:true})
            })  
        }
        //if isValid false
        return res.status(401).json({message:"Invalid token",success:false})        
    } catch (error) {
        res.status(500).send("Verification failed");
    }
}

export async function sendOtp(req, res, next) {
  try {
    const { email } = req.body;

    const user = await getUserByEmail(email);
    console.log("LOGIN USER:", user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.login(user, async (err) => {
      if (err) return next(err);
      await sendVerificationEmail(user.email);
      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
      });
    });

  } catch (err) {
    next(err);
  }
}

export const verifyOtp = async (req, res, next) => {
  try {
    // 1️⃣ Check if user exists in session
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please request OTP again.",
      });
    }

    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    const email = req.user.email;

    // 4️⃣ Call service to verify
    const result = await verifyOtpService(email, otp);
    // req.logout((err) => {
    //   if (err) return next(err);
    // });

    return res.status(200).json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};