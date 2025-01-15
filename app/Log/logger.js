const { createLogger, format, transports } = require("winston");
const LogstashTransport = require("winston-logstash/lib/winston-logstash-latest");

const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new LogstashTransport({
      //host: "logstash", //docker
      host: "13.55.24.6", //dev
      port: 5000,
      applicationName: "nikeyyyapp",
      debug: true,
    }),
  ],
});
logger.info({ message: "Test JSON log", level: "info" }, (err) => {
  if (err) {
    console.error("Error sending log to Logstash:", err);
  } else {
    console.log("Log sent successfully to Logstash");
  }
});

module.exports = logger;
