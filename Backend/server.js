const app = require('./src/app');
require('dotenv').config();

const port = 3000;

const connectDB = require('./src/config/database');
connectDB();

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
