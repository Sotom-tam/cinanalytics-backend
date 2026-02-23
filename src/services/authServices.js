import bcrypt from "bcrypt"
import crypto from "js-crypto-random"
import {getUserByEmail,storeUserEmail,storeMagicToken } from "../model/authModel.js"

export async function sendUserEmail(email){
    const userId=storeUserEmail()
    if(userId){
        return userId
    }
    //hashing token to add to the table

}
export async function genMagicToken(email){
    const userId=getUserByEmail(email)
    const token=crypto.getRandomBytes(32).toString("hex")
    console.log(token)
    //hashing token to add to the table
    const tokenHash= await bcrypt.hash(token,10)
    const success=await storeMagicToken(userId,tokenHash)
    console.log(success)
}