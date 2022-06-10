const express = require("express");
const codeController = require("../controllers/code_controller");
const authController = require("../controllers/auth_controller");
const router = express.Router();

// router.route("/").get(codeController.getBlogs);
router.route("/relationship").get(codeController.getRelationshipCodes);
router.route("/reactions").post(codeController.postReactionBlogs);

module.exports = router;
