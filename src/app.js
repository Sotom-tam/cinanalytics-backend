import "dotenv/config"


import express from "express"
import cors from "cors"
import passport from "passport"
import session from "express-session"
import connectSession from "connect-pg-simple"
import pool from "./db.js"
import authRoutes from "./routes/authRoutes.js"
import eventRoutes from "./routes/eventRoutes.js"
import productRoutes from "./routes/projectRoutes.js"
import {getAllProjectUrl} from "./model/projectModel.js"

const app=express()
app.set("trust proxy", 1);

app.use(express.json())

const projects = await getAllProjectUrl();
const allowedOrigins = projects.map(p => p.project_url).filter(Boolean);
app.use(cors({
    origin:allowedOrigins,
    credentials:true
}))

const isProd = process.env.PRODUCTION === "production";
//console.log(isProd)
const pgSession=connectSession(session)
app.use(session({
    name: "connect.sid",
    store:new pgSession({
        pool:pool,
        tableName:"sessions"
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie:{maxAge:1000*60*60,
        sameSite:isProd?"none":"lax",
        httpOnly:true,
        secure:isProd,
    }
}))


app.use(passport.initialize())
app.use(passport.session())

app.use("/api/auth",authRoutes)
app.use("/api/events",eventRoutes)
app.use("/api/project",productRoutes)

const port=process.env.PORT || 4000;



app.listen(port,()=>{
    console.log(`Server Listening on ${port}`)
})