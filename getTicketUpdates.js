require("dotenv").config();
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cron = require("node-cron");
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_REGION });

// URL for data
const URL = process.env.MATCH_URL;
const notificationMessage = `RCB-CSK match is available for booking. Please book the tickets from this link -  ${URL}`;

// function to get the raw data
const getRawData = (URL) => {
  return fetch(URL)
    .then((response) => response.text())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      //Send email
      console.log(`Error in fetching page information`);
    });
};

const getTicketUpdates = async () => {
  const bookmyshowData = await getRawData(URL);
  const parsedData = cheerio.load(bookmyshowData);
  const ticketStatus = parsedData("button").text();
  console.log(`Ticket Status for RCB-CSK match is ${ticketStatus}`);
  if (ticketStatus == "Book") {
    console.log("RCB-CSK match is available for booking");
    await sendTextAndSms();
    console.log(`Successfully sent email and sms of ticket status`);
  }
};

const sendTextAndSms = async (message) => {
  try {
    const params = {
      Message: notificationMessage,
      TopicArn: process.env.AWS_TOPIC_ARN,
    };

    // Create promise and SNS service object
    const publishTextPromise = new AWS.SNS({ apiVersion: "2010-03-31" })
      .publish(params)
      .promise();

    publishTextPromise
      .then(function (data) {
        console.log("Messages Sent. MessageID is " + data.MessageId);
      })
      .catch(function (err) {
        console.error(err, err.stack);
      });
  } catch (error) {
    this.logger.error(`Failed to send email. Reason - ${error}`);
  }
};

cron.schedule(process.env.CRON_DURATION, () => {
  getTicketUpdates();
});
