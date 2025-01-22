import { asyncHandler } from "../utils/asyncHandlerr.js";
import { ApiError } from "../utils/apiError.js"; 
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudnary.js"; 
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefereshToken=async(userId)=>{
    try {
        const user=  await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken= user.generateRefreshToken()

        user.refreshToken=refreshToken
        await  user.save({ ValidateBeforeSave:false })

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"something want wrong while generating refresh and access token");
         
    }
}


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
    // console.log("email: ",email);
    console.log("body",req.body)

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

 const loginUser=asyncHandler(async (req,res) => {
    

    //req body-->data
    //username or email
    //find user
    //password check
    //access and refresh token
    //send cookie

    const{email,username,password}=req.body
    // console.log(req.body)
      
    if(!(username || email)){
        throw new ApiError(400,"username or password is required");
        
    }
   const user=await User.findOne({
        $or:[{email},{username}]
    })
    if(!user){
        throw new ApiError(404,"User dose not exist");
        
    }
   const isPasswordValid= await user.isPasswordCorrect(password)

   if(!isPasswordValid){
    throw new ApiError(400,"invelid username or password this is me ...........");
    
   }
   const {accessToken,refreshToken} = await generateAccessAndRefereshToken(user._id)

    const loggedInUser=await User.findById(user._id).select(
        "-password -refreshToken"  
    );
    //  console.log(loggedInUser)
 
    
    //cookies

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
     .json(
        new ApiResponse(
            200,
            {
                 user:loggedInUser,accessToken,refreshToken
            },
             "User logged In successfully"
        )
    )

 })

 const logoutUser=asyncHandler(async (req,res)=>{
     await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user LogOut Successfully"))
 })



 const refreshAccessToken=asyncHandler(async (req,res)=>{
   const incommingRefreshToken= req.cookies.refreshToken || req.body.refreshToken


   if(!incommingRefreshToken){
    throw new ApiError(401,"Unauthorise request")
   }
   try {
    const decodedToken=jwt.verify(
     incommingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
    )  
    const user=await User.findById(decodedToken?._id)
 
    if(!user){
     throw new ApiError(401,"invalid refresh token")
    }
    
    if(incommingRefreshToken !== user?.refreshToken){
     throw new ApiError(401,"refresh token is expired or used")
    }
 
    const options={
     httpOnly:true,
     secure:true
    }
 
    const {accessToken,newrefreshToken}= await generateAccessAndRefereshToken(user._id)
    
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json(
     new ApiResponse(
         200,
         {accessToken,refreshToken:newrefreshToken},
         "Access token refresh successfully"
     )
    )
   } catch (error) {
    throw new ApiError(401,error?.message || "invalid refresh token")
   }
 })



 const changeCurrentpassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body


    const user= await User.findById(req.user?._id)
    const isPasswordcorrect= await user.isPasswordCorrect(oldPassword)

    if(!isPasswordcorrect){
        throw new ApiError(400,"Invalid old password");
        
    }

    user.password=newPassword
   await user.save({ValidateBeforeSave:false})

   return res
   .status(200)
   .json(new ApiResponse( 200, {} ,"Password changed successfully"))
 })


const getCurrentuser=asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current User featched successfully")
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body

    //change a user full name and email
    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user=await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            fullName,
            email,

        }
    },
    {new:true}
    ).select("-password")
    
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account detail updated"))
})

const updateuseravatar=asyncHandler(async(req,res)=>{

    const avatarlocalpath=req.file?.path


    if(!avatarlocalpath){
        throw new ApiResponse(400,"Avatar file is missing")
    }

    const avatar=await uploadOnCloudinary(avatarlocalpath)
    
    if(!avatar.url){
        throw new ApiResponse(400,"error while uploading on avatar")
    }

   const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{avatar:avatar.url}
        },
        {new:true}
    ).select("-password")
   
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar is updated successfully"))

})


const updateuserCoverImage=asyncHandler(async(req,res)=>{

    const coverImagelocalpath=req.file?.path

    if(!coverImagelocalpath){
        throw new ApiResponse(400,"CoverImage file is missing")
    }
    const coverImage=await uploadOnCloudinary(coverImagelocalpath)
    
    if(!coverImage.url){
        throw new ApiResponse(400,"error while uploading on coverImage")
    }

   const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{coverImage:coverImage.url}
        },
        {new:true}
    ).select("-password")
   
    return res
    .status(200)
    .json(new ApiResponse(200,user,"CoverImage is updated successfully"))

})


const getUserChannelProfile=asyncHandler(async(req,res)=>{
    
    const {username} =req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing..");
        
    }
  
   const channel= await User.aggregate([
       {
         $match:{
            username: username?.toLowerCase()
         }
       },
       {
          $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"chennel",
            as:"subscribers"
          }
       },
       {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribersTo"
        }
       },
       {
        $addFields:{
            subscribersCount:{
                $size:"$subscribers"
            },
            chennelSubscribedToCount:{
                $size:"$subscribersTo"
            },
            isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }
        }
       },
       {
        $project:{
            fullName:1,
            username:1,
            subscribersCount:1,
            chennelSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1
        }
       }
   ])

   if(!channel?.length){
      throw new ApiError(404,"chennel does not exist");
      
   }

   return res
   .status(200)
   .json(
    new ApiResponse(200,channel[0],"User chennel fetched successfully")
   )

})


const getWatchHistory=asyncHandler(async(req,res)=>{
    
     const user=await User.aggregate([
        {
            $match:{
               _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
          $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
                {
                    $lookup:{
                        from:"user",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $project:{
                                    fullName:1,
                                    username:1,
                                    avatar:1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                    }
                }
            ]
          }
        }
     ])

     return res
     .status(200)
     .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        )
     )

})

export {
    reqisterUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentpassword,
    getCurrentuser,
    updateAccountDetails,
    updateuseravatar,
    updateuserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
