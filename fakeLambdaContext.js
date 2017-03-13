module.exports = {
  event: {
    // scheduled event type
    // from: https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/EventTypes.html?shortFooter=true#schedule_event_type
    "id": "53dc4d37-cffa-4f76-80c9-8b7d4a4d2eaa",
    "detail-type": "Scheduled Event",
    "source": "aws.events",
    "account": "123456789012",
    "time": "2015-10-08T16:53:06Z",
    "region": "us-east-1",
    "resources": [
      "arn:aws:events:us-east-1:123456789012:rule/MyScheduledRule"
    ],
    "detail": {}
  },
  context: {
    //from http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
    functionName:  null,
    awsRequestId:  null,
    logGroupName:  null,
    logStreamName: null,
    clientContext: null,
    // identity:      null, // if (typeof context.identity !== 'undefined') // cognito
  },
  callback: (err, results) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(results);
    process.exit(0);
  }
};
