import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { app } from "../app.js";


const connectDB=async()=>{
    try {
       const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERRe: ",error)
            throw error
        })
         console.log(`\n MONGO DB CONNECTED!! BD HOST:${connectionInstance.connection.host}`)
        
    } catch (error) {
        console.log("MONGODB CONNECTION FAILS",error)
        process.exit(1)
    }
}

export default connectDB