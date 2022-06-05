const express = require("express");
const commentController = require("../controllers/repcomment_controller");
const authController = require("../controllers/auth_controller");
const router = express.Router();

router.route("/").get(commentController.getComments);
router.route("/").post(authController.protect, commentController.deleteComments);
router.route("/delete").post(authController.protect, commentController.deleteComments);

module.exports = router;
