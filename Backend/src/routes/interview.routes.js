const express = require("express");
const interviewRouter = express.Router();
const authUser = require("../middleware/auth.middleware");
const upload = require("../middleware/file.middleware");
const { generateInterViewReportController, getInterviewReportByIdController } = require("../controllers/interview.controller");

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

// @route Get api/interview/report/:interviewId
// @description get interview report by interviewId
// @access private
// 

interviewRouter.get("/report/:interviewId",authUser, getInterviewReportByIdController);



// 
// @route Get /api/interview/
//description get all interview reports of logged in user.
// @access private 

interviewRouter.get("/", authUser, getAllInterview);
module.exports = interviewRouter;