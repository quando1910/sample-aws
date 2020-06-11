exports.handler = (event, context) => {
    console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));
  
    const aws = require("aws-sdk");
    const response = require('cfn-response');
  
    const {RequestType, ResourceProperties: {StackName, OutputKey}} = event;
  
    if (RequestType === 'Delete') {
      return response.send(event, context, response.SUCCESS);
    }
  
    const cfn = new aws.CloudFormation({region: 'us-east-1'});
  
    cfn.describeStacks({StackName}, (err, {Stacks}) => {
      if (err) {
        console.log("Error during stack describe:\n", err);
        return response.send(event, context, response.FAILED, err);
      }
  
      const Output = Stacks[0].Outputs
        .filter(out => out.OutputKey === OutputKey)
        .map(out => out.OutputValue)
        .join();
  
      response.send(event, context, response.SUCCESS, {Output});
    });
  };