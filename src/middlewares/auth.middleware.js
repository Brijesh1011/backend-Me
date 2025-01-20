import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandlerr.js";
import  jwt  from "jsonwebtoken";

//logout user middleware

export const verifyJWT=asyncHandler(async(req,res,next)=>{

 try {
     const token=req.cookies?.accessToken || req.header("Authorization")?.replce("Bearer","")
    //  console.log("Tokent:",token)
     if(!token){
       throw new ApiError(401,"Unauthorizes request")
     }
    
    const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)  
    
     const user= await User.findById(decodedToken?._id).select("-password -refreshToken")
    
     if(!user){
       
       
   
       throw new ApiError(401,"Invalid Token access")
     }
     
       req.user=user;
     next()
 } catch (error) {
    throw new ApiError(401,error?.message || "Invalid access token")
 }

})