import { asyncHandler } from "../utils/asyncHandlerr.js";


const reqisterUser=asyncHandler( async(req,res)=>{
    res.status(200).json({
        message:"this is me"
    })
} )

export {reqisterUser}
