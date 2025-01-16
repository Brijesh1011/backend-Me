import { asyncHandler } from "../utils/asyncHandlerr.js";
import { ApiError } from "../utils/apiError.js"; 
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudnary.js"; 
import { ApiResponse } from "../utils/ApiResponse.js";


const reqisterUser=asyncHandler( async(req,res)=>{
    //get user details from frontend
    //validation-not empty
    // check if user already exists :email  username
    //check for images ,check for avatar
    //upload on cloudinary,avatar
    //create user object-create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res
    
    const {fullName,email,username,password}=req.body
    console.log("email: ",email);

    if (
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ) {
        throw new ApiError(400,"all filds are required")
    }
    
     const existedUser=await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or USername is already exist")
    }

   const avatarLocalpath= req.files?.avatar[0]?.path;
   //const coverImageLocalpath=req.files?.coverImage[0]?.path;

   let coverImageLocalpath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
     coverImageLocalpath=req.files.coverImage[0].path
   }

   if(!avatarLocalpath){
      throw new ApiError(400,"Avatar is requied")
   }

   const avatar= await uploadOnCloudinary(avatarLocalpath)
   const coverImage= await uploadOnCloudinary(coverImageLocalpath)
   

   if(!avatar){
    throw new ApiError(409,"User with email or USername is already exist")
   }

   const user= await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
   })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser){
        throw new ApiError(500,"Somethig want wrong while registring the User")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Register Done")
    )

} )

export {reqisterUser}
