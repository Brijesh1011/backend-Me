import { Router } from "express";
import { reqisterUser,loginUser,logoutUser } from "../controllers/user.controller.js";
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



export default router

