import {Pool} from "pg"
// import dotenv from "dotenv"

// dotenv.config()

//setting up database connection
// const pool= new Pool({
//     user:process.env.DATABASE_USER,
//     database:process.env.DATABASE_NAME,
//     password:process.env.DATABASE_PASSWORD,
//     host:"localhost",
//     port:5432,
// })


const pool= new Pool({
    user:"postgres",
    database:"event-tracker",
    password:"Blessed1@cu",
    host:"localhost",
    port:5432,
})


//testing 
// async function test(){
//     const result= await pool.query('SELECT * FROM products WHERE id=1')
//     console.log(result.rows)
// }
// test()

export default pool