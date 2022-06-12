const express = require("express");
const emailnotifyController = require("../controllers/emailnotify_controller");
const router = express.Router();
router.route("/").post(emailnotifyController.createNewEmailNotify);
router.route("/unsubscribe").post(emailnotifyController.deleteEmailNotify);

module.exports = router;
