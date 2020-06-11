exports.SUCCESS = "SUCCESS";
exports.FAILED = "FAILED";

export function handler(event: any, context: any) {
  const {RequestType, ResourceProperties: {Response, OutputKey}} = event

  var https = require("https");
  var url = require("url");

  var responseBody = JSON.stringify({
    IsComplete: !!Response,
    Data: Response
  })

  var parsedUrl = url.parse(event.ResponseURL);
  var options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: "PUT",
    headers: {
      "content-type": "",
      "content-length": responseBody.length
    }
  };

  var request = https.request(options, function(response: any) {
    console.log("Status code: " + response.statusCode);
    console.log("Status message: " + response.statusMessage);
    context.done();
  });

  request.on("error", function(error: any) {
    console.log("send(..) failed executing https.request(..): " + error);
    context.done();
  });

  request.write(responseBody);
  request.end();
}
