const express = require("express");
const emailnotifyController = require("../controllers/emailnotify_controller");
const router = express.Router();
router.route("/").post(emailnotifyController.createNewEmailNotify);

module.exports = router;
