import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import * as ssm from '@aws-cdk/aws-ssm'
import { Duration } from '@aws-cdk/core'
import apigateway = require("@aws-cdk/aws-apigateway");
import { generateSha256 } from '../src/utils/util'

export class SampleLambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const override = new lambda.Function(this, 'lambdaEdge', {
      code: lambda.Code.asset('src/'),
      handler: `lambda/edge.handler`,
      runtime: lambda.Runtime.NODEJS_10_X,
      timeout: Duration.seconds(3)
    })

    const version = override.addVersion(':sha256:' + generateSha256('./lambda/index.js'))

    // the main magic to easily pass the lambda version to stack in another region
    new cdk.CfnOutput(this, 'lambdaEdge', {
      value: cdk.Fn.join(":", [
        override.functionArn,
        version.version
      ])
    });
    
  }
}
