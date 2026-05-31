const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require("cors");
const { errorHandler, asyncHandler } = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/validation');
const logger = require('./utils/logger');

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Sanitize all incoming requests
app.use(sanitizeInput);
const allowedOrigins = [
  "http://localhost:5173",
  "https://resume-maker-c6ko.vercel.app",
  "https://resume-maker-khaki-nine.vercel.app" // ✅ ADD THIS
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests without origin (Postman, mobile apps)
    if (!origin) return callback(null, true);

    // allow exact domains
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // 🔥 allow ONLY your Vercel preview domains
   if (
      origin.endsWith(".vercel.app") &&
      origin.includes("resume-maker")
    ) {
      return callback(null, true);
    }

    // block everything else
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
// require all the routes here
const authRouter = require('./routes/auth.routes');
const interviewRouter = require("./routes/interview.routes");
const resumeRoutes = require("./routes/resume.routes");
const monitoringRoutes = require("./routes/monitoring.routes");
const adminRoutes = require("./routes/admin.routes");



// using all the routes here
app.use('/api/auth', authRouter);
app.use('/api/interview',interviewRouter);
app.use("/api/resume", resumeRoutes);
app.use("/api/monitor", monitoringRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Route not found',
    errorCode: 'NOT_FOUND'
  });
});

// ✅ Global error handler (MUST be last)
app.use(errorHandler);

module.exports = app;
