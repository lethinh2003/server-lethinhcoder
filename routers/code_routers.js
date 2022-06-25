const express = require("express");
const codeController = require("../controllers/code_controller");
const authController = require("../controllers/auth_controller");
const router = express.Router();

router.route("/").get(codeController.getCodes);
router.route("/relationship").get(codeController.getRelationshipCodes);
router.route("/reactions").post(codeController.postReactionBlogs);
router.route("/download").post(authController.protect, codeController.downloadCode);

module.exports = router;
