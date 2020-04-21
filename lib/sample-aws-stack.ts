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
import { generateSha256 } from '../src/utils/util'
import { LambdaEdgeEventType } from '@aws-cdk/aws-cloudfront'

export class SampleAwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // const lambdaProvider = new lambda.SingletonFunction(this, 'Provider', {
    //   uuid: 'f7d4f730-4ee1-11e8-9c2d-fa7ae01bbebc',
    //   code: lambda.Code.asset('./cfn'),
    //   handler: 'stack.handler',
    //   timeout: Duration.seconds(3),
    //   runtime: lambda.Runtime.NODEJS_10_X,
    // })

    // const stackOutput = new cfn.CustomResource(this, 'StackOutput', {
    //   provider: new cr.Provider(this, 'StackOutputProvider', {
    //     onEventHandler: lambdaProvider
    //   }),
    //   properties: {
    //     StackName: id,
    //     OutputKey: 'LambdaOutput',
    //     // just to change custom resource on code update
    //     LambdaHash: generateSha256('./src/lambda/edge.handler')
    //   }
    // })

    const override = new lambda.Function(this, 'lambdaEdge', {
      code: lambda.Code.asset('src/'),
      handler: `lambda/edge.handler`,
      runtime: lambda.Runtime.NODEJS_10_X,
      timeout: Duration.seconds(3)
    })

   const version = override.addVersion(':sha256:' + generateSha256('./src/lambda/edge.js'))

    // // the main magic to easily pass the lambda version to stack in another region
    // const a = new cdk.CfnOutput(this, 'lambdaEdge', {
    //   value: cdk.Fn.join(":", [
    //     override.functionArn,
    //     version.version
    //   ])
    // });

    const testAppBucket = new s3.Bucket(this, 's3-cloudfront-test-123')

    const oai = new cloudfront.OriginAccessIdentity(this, 's3-cloudfront-test-cf-oai')

    const policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      principals: [new iam.CanonicalUserPrincipal(oai.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
      resources: [testAppBucket.bucketArn + '/*'],
    })
    testAppBucket.addToResourcePolicy(policy)



    const cfs = new cloudfront.CloudFrontWebDistribution(this, 'WebsiteDistribution', {
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
              lambdaFunctionAssociations: [
                {
                  eventType: LambdaEdgeEventType.ORIGIN_RESPONSE,
                  lambdaFunction: version
                }
              ]
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

    // const cfDist = cf.node.findChild('CFDistribution') as cloudfront.CfnDistribution;

    // const lambdaEdge = new lambda.Function(this, 'lambdaEdge', {
    //   code: lambda.Code.asset('src/'),
    //   handler: `lambda/edge.handler`,
    //   runtime: lambda.Runtime.NODEJS_10_X,
    //   timeout: Duration.seconds(3)
    // })

    // // // // Manually add the LambdaFunctionAssociations by adding an override
    // cfDist.addOverride('Properties.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations', [{
    //   EventType: 'origin-response',
    //   LambdaFunction: lambdaEdge
    // }]);
    
    
  }
}
