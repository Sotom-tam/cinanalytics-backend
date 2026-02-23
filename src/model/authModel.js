import pool from "../db.js"

export async function storeUserEmail(email){
    const result =await pool.query('INSERT INTO users (email) VALUES (1$) RETURNING *',[email])
    const user=result.rows[0]
    return user.id
}
export async function getUserByEmail(email){
    const result =await pool.query(`SELECT * FROM users WHERE email=$1`,[email])
    if(result.rows.length>0){
        return result.rows[0]
    }else{
        return "User not Found"
    }
}

export async function storeMagicToken(user_id,token){
    const result =await pool.query(`INSERT INTO magic_tokens (user_id,token_hash)
        VALUES ($1,$2) RETURNING *`,[user_id,token])
    if(result.rows>0){
        return true
    }else{
        return false
    }
}
