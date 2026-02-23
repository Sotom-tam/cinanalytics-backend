import { featureCount } from "../model/eventModel.js"


export async function getFeatureData(req,res) {
    const data=await featureCount()
    return data
}