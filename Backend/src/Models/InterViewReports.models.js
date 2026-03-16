const mongoose = require('mongoose');
// ** job description
//  resume
// self description
// matchScore :Number
//  technical question  : [{
// question ,answer, intention}]
// behavioural questions :[{
// question ,answer, intention}]
// skills gap :[
// skill :" ",
// severity:""{type: string, enum:["low","medium","high"]}
// 
// ]
// preparation plans:[{
// day:number,focus:string,tasks:"string"
// }]


const technicalQuestionSchema = new mongoose.Schema({
    question:{
      type:String,
      required:[true, "Technical question is required"]
    }, 
    intention:{
      type:String,
      required:[true,"Intention is required"]
    },
    answer:{
      type:String,
      required:[true,"Answer is required"]
    }
  },{
      _id:false
});

const behaviouralQuestionSchema = new mongoose.Schema({
    question:{
      type:String,
      required:[true, "Technical question is required"]
    }, 
    intention:{
      type:String,
      required:[true,"Intention is required"]
    },
    answer:{
      type:String,
      required:[true,"Answer is required"]
    }
  },{
      _id:false
    }
)

const skillGapSchema = new mongoose.Schema({
  skill:{
  type:String,
  required:[true, "Skill is required"]
},
severity:{
  type:String,
  enum:["low","medium","high"],
  required:[true,"Severity is required"]
}
},{
_id: false
})

const preparationPlanSchema = new mongoose.Schema({
  day:{
    type:Number,
    required:[true, "Day is required"]
  },
  focus:{
    type:String,
    required: [true,"Focus is required"]
  },
  tasks:[{
      type:String,
      required:[true, "Task is required"]
  }]
})

const interviewReportSchema = new mongoose.Schema({
  jobDescription:{
    type:String,
    required:[true,"Job description is required"]
  },
  resume:{
    type:String
  },
  selfDescription:{
    type:String,
  },
  matchScore:{
    type:Number,
    min:0,
    max:100
  },
  technicalQuestions:[technicalQuestionSchema],
  behaviouralQuestions: [behaviouralQuestionSchema],
  skillGaps:[skillGapSchema],
  preparationPlan:[preparationPlanSchema] 
},{
  timestamps:true
})

const interviewReportModel = mongoose.model("InterviewReport",interviewReportSchema);

module.exports = interviewReportModel;
