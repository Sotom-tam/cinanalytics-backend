import { insertInto } from "../model/eventModel.js"
import {getFeatureData} from "../services/eventServices.js"

export async function fetchFeatureData(req,res) {
    const data=await getFeatureData()
    console.log(data)
    return res.json(data)
}

export async function storeEvent(req,res) {
    const eventData=req.body
    console.log("Event Data",eventData)
    const result=await insertInto(eventData) 
    console.log(result)
}