const express = require("express");
const interviewRouter = express.Router();
const authUser = require("../middleware/auth.middleware");
const upload = require("../middleware/file.middleware");
const { generateInterViewReportController } = require("../controllers/interview.controller");

// description generate new interview report on the basis of user self secription, resume pdf
// @routes post /api/interview/
// @access private
// 

interviewRouter.post(
  "/",
  authUser,
  upload.single("resume"),
  generateInterViewReportController
);

module.exports = interviewRouter;