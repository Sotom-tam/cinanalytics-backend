import pool from "../db.js"

export async function storeUserEmail(email){
    console.log("model",email)
    const result =await pool.query('INSERT INTO users (email) VALUES ($1) RETURNING *;',[email])
    console.log(result)
    const user=result.rows[0]
    return user
}
export async function getUserByEmail(email){
    const result =await pool.query(`SELECT * FROM users WHERE email=$1`,[email])
    if(result.rows.length>0){
        //console.log(result.rows[0])
        return result.rows[0]
    }else{
        return "User not Found"
    }
}
getUserByEmail("email@gmail.com")
export async function storeMagicToken(user_id,token){
    const result =await pool.query(`INSERT INTO magic_tokens (user_id,token_hash)
        VALUES ($1,$2) RETURNING *`,[user_id,token])
    if(result.rows.length>0){
        return true
    }else{
        return false
    }
}

export async function getTokenByUserId(userId){
    try {
        const result = await pool.query(`SELECT * FROM magic_tokens WHERE user_id=$1`,[userId])
        //console.log("token ",result.rows[0])
        if(result.rows.length>0){
            return result.rows[0]
        }
    } catch (error) {
        console.log(error)
    }
    
}
export async function storeOtp(email,otpHash) {
    console.log(email,otpHash)
    try {
        const result =await pool.query(`INSERT INTO otp (email,otp_hash) VALUES($1,$2) RETURNING *;`,[email,otpHash])
        if(result.rows.length>0){
            return result.rows[0]
        }
    } catch (error) {
        console.log(error)
    }
}
export const getOtpByEmail = async (email) => {
  const result =await pool.query(`SELECT otp_hash FROM otp WHERE email = $1`,[email]);
  return result.rows[0];
};
export const deleteOtp = async (email) => {
  await pool.query(`DELETE FROM otp WHERE email = $1`,[email]);
};