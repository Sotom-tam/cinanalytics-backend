import bcrypt from "bcrypt"
import crypto from "crypto"
import { sendEmail } from "../utilis/sendmail.js"
import {getUserByEmail,storeUserEmail,storeMagicToken,getTokenByUserId,storeOtp,getOtpByEmail,deleteOtp} from "../model/authModel.js"
import { get } from "https"


export async function sendUserEmail(email){
    const userId=await storeUserEmail()
    if(userId){
        return userId
    }
    //hashing token to add to the table

}
export async function genMagicToken(email){
    const user=await storeUserEmail(email)
    console.log(user)
    const token=crypto.randomBytes(32).toString("base64url")
    console.log(token)
    //hashing token to add to the table
    const tokenHash= await bcrypt.hash(token,10)
    //store token
    await storeMagicToken(user.id,tokenHash)
    return token
}

export async function sendMagicLink(email, token) {
    //console.log(email,token)
  try {
    const magicLink = `https://cin-analytics.vercel.app/verify.html?token=${token}&email=${email}`;

    const response = await sendEmail({
      to: email,
      subject: "Your magic login link",
      html: `
        <h2>Login to your account</h2>
        <p>Click the button below to sign in:</p>
        <a href="${magicLink}" 
           style="padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">
           Sign in
        </a>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    return response;
  } catch (error) {
    console.error("Error sending magic link:", error);
    throw error;
  }
}
export async function findTokenByEmail(email){
    const user=await getUserByEmail(email)
    console.log("user with that email:",user)
    const userId= user.id
    const magicTokens = await getTokenByUserId(userId)
    console.log(magicTokens)
    return magicTokens
}
export async function sendVerificationEmail(email){
    const result=await getOtpByEmail(email)
    //console.log("result:")
    await deleteOtp(email)
    const otp= await genOtp();
    const otpHash=await bcrypt.hash(otp.toString(),10)
    const storedOtp=await storeOtp(email,otpHash)
    if(storedOtp){
        const response=await verficationEmail(email,otp)
        //console.log(response)
        return (response)
    }
}
export async function genOtp(){
    const otp=Math.floor(100000+Math.random()*900000)
    return otp
}
export async function verficationEmail(email,otp){
  const response=  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}`,
  });
    return response
}

export const verifyOtpService= async (email, otp) => {
  //console.log("verify service",email,otp)
  const record = await getOtpByEmail(email);

  if (record.length<0) {
    throw new Error("OTP not found");
  }
  //console.log(record,record.otp_hash)
  const isMatch= await bcrypt.compare(otp,record.otp_hash)
  console.log(isMatch)
  if (!isMatch) {
    throw new Error("Invalid OTP");
  }
  if (new Date() > record.expires) {
    await deleteOtp(email); // remove expired OTP
    throw new Error("OTP expired");
  }
  // OTP is valid → remove it
  await deleteOtp(email);
  return { message: "OTP verified successfully",success:true };
};