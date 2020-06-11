import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import * as ssm from '@aws-cdk/aws-ssm'
import apigateway = require("@aws-cdk/aws-apigateway");
import { Duration } from '@aws-cdk/core'
import * as cfn from '@aws-cdk/aws-cloudformation'
import * as cr from '@aws-cdk/custom-resources'
import { LambdaEdgeEventType, LambdaFunctionAssociation } from '@aws-cdk/aws-cloudfront'
import { generateSha256, sleep } from '../src/utils/util'
import { PreProcess } from './aws-api-stack-preprocess'
import fs = require('fs')

export class SampleAws3Stack extends cdk.Stack {
  response: any

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)
    
    const bundleLayer = new lambda.LayerVersion(this, 'lambdaBundleLayer', {
      layerVersionName: 'aws-api-bundle-layer',
      code: new lambda.AssetCode(PreProcess.BUNDLE_LAYER_BASE_DIR),
      compatibleRuntimes: [lambda.Runtime.NODEJS_10_X],
    })

    const lambdaProvider = new lambda.SingletonFunction(this, 'Provider', {
      uuid: 'f7d4f730-4ee1-11e8-9c2d-fa7ae01bbebc', 
      // code: lambda.Code.fromAsset('src/'),
      // handler: `lambda/stack.handler`,
      layers: [bundleLayer],
      code: new lambda.InlineCode(fs.readFileSync('src/lambda/stack.js', { encoding: 'utf-8' })),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(60),
      runtime: lambda.Runtime.NODEJS_10_X,
    })

    // const completedProvider = new lambda.SingletonFunction(this, 'Completed', {
    //   uuid: 'f7d4f730-4ee1-11e8-9c2d-fa7ae01bbebc', 
    //   code: lambda.Code.fromAsset('src/'),
    //   layers: [bundleLayer],
    //   handler: `lambda/completed.handler`,
    //   timeout: cdk.Duration.seconds(10),
    //   runtime: lambda.Runtime.NODEJS_10_X,
    // })

   
    lambdaProvider.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudformation:DescribeStacks'],
        resources: [`arn:aws:cloudformation:*:*:stack/SampleLambdaStack/*`]
      })
    );

    // const provider = new cr.Provider(this, 'StackOutputProvider', {
    //   onEventHandler: lambdaProvider,
    // })

   // This basically goes to another region to edge stack and grabs the version output
    const stackOutput = new cfn.CustomResource(this, 'StackOutput', {
      // provider: provider,
      provider: cfn.CustomResourceProvider.fromLambda(lambdaProvider),
      properties: {
        StackName: 'SampleLambdaStack',
        OutputKey: 'LambdaOutput',
        LambdaHash: ':sha256:' + generateSha256('./lambda/index.js')
      }
    })

    const testAppBucket = new s3.Bucket(this, 's3-cloudfront-test-123')

    const oai = new cloudfront.OriginAccessIdentity(this, 's3-cloudfront-test-cf-oai')

    const policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      principals: [new iam.CanonicalUserPrincipal(oai.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
      resources: [testAppBucket.bucketArn + '/*'],
    })
    testAppBucket.addToResourcePolicy(policy)

    this.response = stackOutput.getAtt('Output').toString()

    const version = lambda.Version.fromVersionArn(this, 'Version', this.response)
    
    new cloudfront.CloudFrontWebDistribution(this, 'WebsiteDistribution', {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: testAppBucket,
            originAccessIdentity: oai,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              minTtl: cdk.Duration.seconds(0),
              maxTtl: cdk.Duration.days(365),
              defaultTtl: cdk.Duration.days(1),
              lambdaFunctionAssociations: [{
                eventType: LambdaEdgeEventType.ORIGIN_RESPONSE,
                lambdaFunction: version
              }]
            },
          ],
        },
      ],

      errorConfigurations: [
        {
          errorCode: 403,
          responsePagePath: '/index.html',
          responseCode: 200,
          errorCachingMinTtl: 0,
        },
        {
          errorCode: 404,
          responsePagePath: '/index.html',
          responseCode: 200,
          errorCachingMinTtl: 0,
        },
      ],
    })

    new cdk.CfnOutput(this, 'LambdaEdge', {
      value: this.response
    })
  }

}

PreProcess.generateBundlePackage()
