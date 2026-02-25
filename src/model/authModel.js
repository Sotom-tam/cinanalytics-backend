import pool from "../db.js"

export async function storeUserEmail(email){
    //console.log("model",email)
    const result =await pool.query('INSERT INTO users (email) VALUES ($1) RETURNING *;',[email])
    //console.log(result)
    const user=result.rows[0]
    return user
}
export async function storeUserData(email,name,picture){
    try {
        //console.log("model",email)
        const result =await pool.query('INSERT INTO users (email,name,picture_url) VALUES ($1,$2,$3) RETURNING *;',[email,name,picture])
        //console.log(result)
        const user=result.rows[0]
        return user
    } catch (error) {
        console.log({error:error,message:"sql error"})
    }
    
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
            console.log("sending")
            return result.rows[0]
        }
    } catch (error) {
        console.log(error)
    }
    
}
export const getMagicTokenByEmail = async (email) => {
  const result =await pool.query(`SELECT * FROM magic_tokens WHERE email = $1`,[email]);
  return result.rows[0];
};

export const deleteMagicToken = async (email) => {
  await pool.query(`DELETE FROM magic_tokens WHERE email = $1`,[email]);
};

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
  return result.rows[0];
};
export const deleteOtp = async (email) => {
  await pool.query(`DELETE FROM otp_tokens WHERE email = $1`,[email]);
};

export async function updateUser(email,name,picture){
    const result = await pool.query(`UPDATE users SET name = $1,
        picture_url = $2
        WHERE email = $3 RETURNING *; `,[name,picture,email]
    )
    return result.rows[0]
}