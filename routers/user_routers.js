const express = require("express");
const userController = require("../controllers/user_controller");
const authController = require("../controllers/auth_controller");
const router = express.Router();
const fileUploader = require("../configs/cloudinary.config");

router.route("/").get(userController.getUser);
router.route("/").post(authController.protect, userController.getDetailUser);
router.route("/sign-up").post(userController.createUser);
router.route("/upload-avatar").post(authController.protect, fileUploader.single("file"), userController.uploadAvatar);
router.route("/update").post(authController.protect, userController.updateUser);
router.route("/test").get(authController.protect, userController.test);

module.exports = router;
