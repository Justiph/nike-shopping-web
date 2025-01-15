const app = require("./app");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

const logger = require("./app/Log/logger");


app.listen(PORT, () => {
  logger.info({ message: `Server is running on port ${PORT} ` });
  console.log(`Server is running on http://localhost:${PORT}`);
});