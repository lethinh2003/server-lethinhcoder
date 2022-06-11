const express = require("express");
const adminController = require("../controllers/admin_controller");
const authController = require("../controllers/auth_controller");
const router = express.Router();

router.route("/source-codes").get(authController.protect, authController.reStrictTo("admin"), adminController.getSourceCodes);
router.route("/source-codes").post(authController.protect, authController.reStrictTo("admin"), adminController.createSourceCodes);

router
  .route("/source-codes/detail/:codeID")
  .get(authController.protect, authController.reStrictTo("admin"), adminController.getDetailSourceCode);
router
  .route("/source-codes/detail/:codeID")
  .post(authController.protect, authController.reStrictTo("admin"), adminController.updateDetailSourceCode);
router
  .route("/source-codes/detail/:codeID")
  .delete(authController.protect, authController.reStrictTo("admin"), adminController.deleteDetailSourceCode);

////BLOGS
router.route("/blogs").get(authController.protect, authController.reStrictTo("admin"), adminController.getBlogs);
router.route("/blogs").post(authController.protect, authController.reStrictTo("admin"), adminController.createBlog);
router.route("/blogs/detail/:blogID").get(authController.protect, authController.reStrictTo("admin"), adminController.getDetailBlog);
router.route("/blogs/detail/:blogID").post(authController.protect, authController.reStrictTo("admin"), adminController.updateDetailBlog);
router.route("/blogs/detail/:blogID").delete(authController.protect, authController.reStrictTo("admin"), adminController.deleteDetailBlog);

//OVERVIEW
router.route("/overview").get(authController.protect, authController.reStrictTo("admin"), adminController.getOverview);
router
  .route("/history-download-code")
  .get(authController.protect, authController.reStrictTo("admin"), adminController.getHistoryDownloadCode);
router.route("/users").get(authController.protect, authController.reStrictTo("admin"), adminController.getUsers);
router.route("/history-comments").get(authController.protect, authController.reStrictTo("admin"), adminController.getHistoryComments);
router
  .route("/history-rep-comments")
  .get(authController.protect, authController.reStrictTo("admin"), adminController.getHistoryRepComments);

module.exports = router;
