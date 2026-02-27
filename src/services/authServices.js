import bcrypt from "bcrypt"
import pool from "../db.js"
import crypto from "crypto"
import { sendEmail } from "../utils/sendmail.js"
import {getUserByEmail,deleteMagicTokenByEmail,getMagicTokenByEmail,storeUserEmail,storeMagicToken,getTokenByUserId,storeOtp,getOtpByEmail,deleteOtp,deleteUser, deleteMagicTokenById} from "../model/authModel.js"
import { get } from "https"




export async function genMagicToken(email){
    let user = await getUserByEmail(email);
    if (!user) {
      user = await storeUserEmail(email);
    }
  //await deleteUser(email)
    //console.log(user)
    const token=crypto.randomBytes(32).toString("base64url")
    //console.log(token)
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
      subject: "Your Account Verification link",
      html:`<div style="margin:0;padding:0;background-color:#f4f7fb;font-family:'Inter',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">
          <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px 30px;">
            
            <!-- Logo -->
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <h1 style="margin:0;font-size:26px;font-weight:700;color:#1ABAFF;">
                  Cinalytics
                </h1>
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td align="center" style="padding-bottom:10px;">
                <h2 style="margin:0;font-size:22px;font-weight:600;color:#111;">
                  Verify Your Account
                </h2>
              </td>
            </tr>

            <!-- Message -->
            <tr>
              <td align="center" style="padding:15px 0 25px 0;color:#555;font-size:15px;line-height:1.6;">
                Welcome to Cinalytics 👋<br/>
                Click the button below to confirm your email address and activate your account.
              </td>
            </tr>

            <!-- Button -->
            <tr>
              <td align="center" style="padding-bottom:25px;">
                <a href="${magicLink}"
                   style="display:inline-block;padding:14px 28px;background-color:#1F0E4F;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
                   Verify Account
                </a>
              </td>
            </tr>

            <!-- Expiry -->
            <tr>
              <td align="center" style="color:#888;font-size:13px;line-height:1.6;">
                This link will expire in <strong>15 minutes</strong>.<br/>
                If you didn’t create this account, you can safely ignore this email.
              </td>
            </tr>

          </table>

          <!-- Footer -->
          <table width="500" cellpadding="0" cellspacing="0" style="margin-top:20px;">
            <tr>
              <td align="center" style="color:#aaa;font-size:12px;">
                © ${new Date().getFullYear()} Cinalytics. All rights reserved.
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </div>
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
  const response = await sendEmail({
  to: email,
  subject: "Your Cinalytics OTP Code",
  html: `
    <div style="margin:0;padding:0;background-color:#f4f7fb;font-family:'Inter',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
          <td align="center">
            <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px 30px;">
              
              <!-- Logo -->
              <tr>
                <td align="center" style="padding-bottom:20px;">
                  <h1 style="margin:0;font-size:26px;font-weight:700;color:#1ABAFF;">
                    Cinalytics
                  </h1>
                </td>
              </tr>

              <!-- Title -->
              <tr>
                <td align="center" style="padding-bottom:10px;">
                  <h2 style="margin:0;font-size:22px;font-weight:600;color:#111;">
                    Your One-Time Passcode
                  </h2>
                </td>
              </tr>

              <!-- Message -->
              <tr>
                <td align="center" style="padding:15px 0;color:#555;font-size:15px;line-height:1.6;">
                  Use the verification code below to continue.
                </td>
              </tr>

              <!-- OTP Box -->
              <tr>
                <td align="center" style="padding:20px 0;">
                  <div style="display:inline-block;padding:16px 30px;
                              font-size:28px;
                              letter-spacing:6px;
                              font-weight:700;
                              background:#f4f7fb;
                              border-radius:10px;
                              color:#1F0E4F;">
                    ${otp}
                  </div>
                </td>
              </tr>

              <!-- Expiry -->
              <tr>
                <td align="center" style="color:#888;font-size:13px;line-height:1.6;">
                  This code expires in <strong>10 minutes</strong>.<br/>
                  Do not share this code with anyone.
                </td>
              </tr>

            </table>

            <!-- Footer -->
            <table width="500" cellpadding="0" cellspacing="0" style="margin-top:20px;">
              <tr>
                <td align="center" style="color:#aaa;font-size:12px;">
                  © ${new Date().getFullYear()} Cinalytics. All rights reserved.
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
    </div>
  `,
});
    return response
}
export async function verifyMagicLinkToken(email,token){
  const user=await getUserByEmail(email)
  const storedToken = await getMagicTokenByEmail(email);
  console.log(storedToken)
  if(!(storedToken.length>0)){
    return {header:"Invalid or Expired Link",message:"This login link is invalid or has expired. Please request a new magic link to continue.",success:false}
  }
  if (new Date() > new Date(storedToken[0].expires)) {
    await deleteMagicTokenById(user.id);
    return { header:"Expired Link",message:"This login link has expired. Please request a new magic link to continue.",success:false,expired: true };
  }
  console.log(storedToken[0].token_hash)
  console.log(token)
  const isValid= await bcrypt.compare(token,storedToken[0].token_hash);
  console.log(isValid)
  if(isValid){
    await deleteMagicTokenById(user.id)
    return {header:"Verified",message:"The Magic Link is verified",success:true}
  }else{
    return {header:"Invalid Link",message:"This login link has expired. Please request a new magic link to continue.",success:false}
  }
}

export async function verifyOtpService (email, otp) {
  //console.log("verify service",email,otp)
  //to get the Otp stored in the otps table
  const storedOtp = await getOtpByEmail(email);

  if (!storedOtp||storedOtp.length===0) {
    return {header:"Invalid or Expired Otp",message:"The verification code is invalid or has expired. Please request a new one.",success:false};
  }
  if (new Date() > new Date(record[0].expires)) {
    await deleteOtp(email); // remove expired OTP
    return {header:"Expired Otp",message:"Your verification code has expired. Request a new code to continue",success:false};
  }
  //console.log(record,record.otp_hash)
  const isMatch= await bcrypt.compare(otp,record[0].otp_hash)
  //console.log(isMatch)
  if (!isMatch) {
    return {header:"Invalid Otp",message:"Invalid OTP. Please check the code and try again.",success:false,};
  }else{
    // OTP is valid → remove it
    await deleteOtp(email);
    return {header:"Otp Verified",meesage:"Logging you In",success:true};
  }
  
  
};