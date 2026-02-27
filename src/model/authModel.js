import pool from "../db.js"
import { findTokenByEmail } from "../services/authServices.js"

export async function storeUserEmail(email){
    //console.log("model",email)
    const result =await pool.query('INSERT INTO users (email) VALUES ($1) RETURNING *;',[email])
    //console.log(result)
    const user=result.rows[0]
    return user
}
export async function storeUserData(email,name,picture){
    const result = await pool.query(
    'INSERT INTO users (email,name,picture_url,verified) VALUES ($1,$2,$3,true) RETURNING *;',
    [email, name, picture]
    )
    return result.rows[0]
    
}

export const deleteUser = async (email) => {
  await pool.query(`DELETE FROM users WHERE email = $1`,[email]);
};

export async function getUserByEmail(email){
    const result =await pool.query(`SELECT * FROM users WHERE email=$1;`,[email])
    //console.log("get user:",result.rows)
    if(result.rows.length>0){
        console.log(result.rows[0])
        return result.rows[0]
    }else{
        return false
    }
}

//getUserByEmail("sotom.tamunowari@stu.cu.edu.ng")
export async function getUserById(id){
    const result =await pool.query(`SELECT * FROM users WHERE id=$1;`,[id])
    //console.log(result)
    if(result.rows.length>0){
        //console.log(result.rows[0])add .
        return result.rows[0]
    }else{
        return false
    }
}

export async function storeMagicToken(user_id,token){
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const result =await pool.query(`INSERT INTO magic_tokens (user_id,token_hash,expires)
        VALUES ($1,$2,$3) RETURNING *`,[user_id,token,expires])
    if(result.rows.length>0){
        return true
    }else{
        return false
    }
}

export async function getTokenByUserId(userId){
    try {
        const result = await pool.query(`SELECT * FROM magic_tokens WHERE user_id=$1`,[userId])
        console.log("token ",result.rows[0],result.rows.length)
        if(result.rows.length>0){
            //console.log("sending")
            return result.rows[0]
        }
    } catch (error) {
        console.log(error)
    }
    
}
export async function getMagicTokenByEmail(email){
    const id=await pool.query('SELECT id FROM users WHERE email=$1',[email])
    const userId=id.rows[0].id
    console.log(userId)
    const result =await pool.query(`SELECT * FROM magic_tokens WHERE user_id = $1`,[userId]);
    console.log(result.rows)
    return result.rows;
};
//getMagicTokenByEmail("sotomtamunowari@gmail.com")
export async function deleteMagicTokenByEmail (email){
  await pool.query(`DELETE FROM magic_tokens WHERE email = $1`,[email]);
};
export async function deleteMagicTokenById(userId) {
  await pool.query(`DELETE FROM magic_tokens WHERE user_id = $1`, [userId]);
}
export async function deleteExpiredMagicTokens() {
  const result = await pool.query(
    `DELETE FROM magic_tokens WHERE expires < NOW() RETURNING id`
  );
  return result.rowCount;
}

export async function storeOtp(email,otpHash) {
    
    console.log(email,otpHash)
    //const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    try {
        const result =await pool.query(`INSERT INTO otp_tokens (email,otp_hash,expires) VALUES($1,$2,NOW() + INTERVAL '15 minutes') RETURNING *;`,[email,otpHash])
        if(result.rows.length>0){
            return result.rows[0]
        }
    } catch (error) {
        console.log(error)
    }
}
export async function checkOtp(email){
    try {
        const result =await pool.query(`SELECT otp_hash FROM otp_tokens WHERE email = $1`,[email]);
        if(result.rows.length>1){
            deleteOtp(email)
        }
        return result.rows
    } catch (error) {
        console.log(error)
    }
}
export const getOtpByEmail = async (email) => {
  const result =await pool.query(`SELECT * FROM otp_tokens WHERE email = $1`,[email]);
  //console.log("result.rows",result.rows)
  return result.rows;
};
export const deleteOtp = async (email) => {
  await pool.query(`DELETE FROM otp_tokens WHERE email = $1`,[email]);
};

export async function updateUser(email,name,picture){
    const result = await pool.query(`UPDATE users SET name = $1,
        picture_url = $2,
        verified=true
        WHERE email = $3 RETURNING *; `,[name,picture,email]
    )
    return result.rows[0]
}

export async function updateVerified(email){
    const result=await pool.query(`UPDATE users SET verified = true WHERE email = $1 RETURNING *`, [email]);
    return result.rows[0]
}