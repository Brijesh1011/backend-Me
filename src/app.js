import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"})) //convert space  or spaicial charecter from url like %20

app.use(express.static("public")) //some file store or anything store
app.use(cookieParser())


//routes

import userRouter from './routes/user.routes.js'


//routee decleration

app.use("/api/v1/users",userRouter)

// http://localhost:8000/api/v1/users/register

export {app}