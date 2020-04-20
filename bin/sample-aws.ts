#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { SampleAwsStack } from '../lib/sample-aws-stack';

const app = new cdk.App();
new SampleAwsStack(app, 'SampleAwsStack');
