#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { SampleAwsStack } from '../lib/sample-aws-stack';
import { SampleLambdaStack } from '../lib/sample-lambda-stack';

const app = new cdk.App();
// const ls = new SampleLambdaStack(app, 'SampleLambdaStack', {
//   env: {
//     region: 'us-east-1'
//   }
// })

// new SampleAwsStack(app, 'SampleAwsStack').addDependency(ls)
new SampleAwsStack(app, 'SampleAwsStack', {
  env: {
    region: 'us-east-1'
  }
})
