import { Router } from "express";
import { reqisterUser,loginUser,logoutUser,refreshAccessToken,changeCurrentpassword,
    getCurrentuser,
    updateAccountDetails,
    updateuseravatar,
    updateuserCoverImage,
    getUserChannelProfile,
    getWatchHistory} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router=Router()


router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },{
            name:"coverImage",
            maxCount:1
        }
    ]),
    reqisterUser)

    router.route("/login").post(loginUser)

    //secured Routes

    router.route("/logout").post(verifyJWT,logoutUser )
    router.route("/refresh-token").post(refreshAccessToken)
    router.route("/change-password").post(verifyJWT,changeCurrentpassword)
    router.route("/current-user").get(verifyJWT,getCurrentuser)
    router.route("/update-account").patch(verifyJWT,updateAccountDetails)
    router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateuseravatar)
    // removing / from  upload.single("/coverImage") to ->
    router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateuserCoverImage)
    router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
    router.route("/history").get(verifyJWT,getWatchHistory)


export default router

