const express = require("express");
const blogController = require("../controllers/blog_controller");
const authController = require("../controllers/auth_controller");
const router = express.Router();

router.route("/").get(blogController.getBlogs);
router.route("/relationship").get(blogController.getRelationshipBlogs);
router.route("/reactions").post(blogController.postReactionBlogs);

module.exports = router;
