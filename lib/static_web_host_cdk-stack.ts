import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deployment from "aws-cdk-lib/aws-s3-deployment";
import * as cloudFront from "aws-cdk-lib/aws-cloudfront";
import * as cloudFrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";

import * as path from "path";

interface StaticWebHostCdkStackProps extends cdk.StackProps {
  s3BucketName: string;
}

export class StaticWebHostCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StaticWebHostCdkStackProps) {
    super(scope, id, props);

    // Add tags for resource management
    cdk.Tags.of(this).add("Project", "Website");
    cdk.Tags.of(this).add("Environment", "Development");

    const bucket = new s3.Bucket(this, props.s3BucketName, {
      accessControl: s3.BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - use RETAIN for production
    });

    new s3Deployment.BucketDeployment(
      this,
      `${props.s3BucketName}+Deployment`,
      {
        destinationBucket: bucket,
        sources: [s3Deployment.Source.asset(path.resolve(__dirname, "./dist"))],
      }
    );

    const originAccessIdentity = new cloudFront.OriginAccessIdentity(
      this,
      `${props.s3BucketName}+AccessIdentity`
    );
    bucket.grantRead(originAccessIdentity);

    const bucketOrigin =
      cloudFrontOrigins.S3BucketOrigin.withOriginAccessIdentity(bucket, {
        originAccessIdentity: originAccessIdentity,
      });

    const distribution = new cloudFront.Distribution(
      this,
      `${props.s3BucketName}+Distribution`,
      {
        defaultRootObject: "index.html",
        defaultBehavior: {
          origin: bucketOrigin,
          viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudFront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
        ],
      }
    );

    new cdk.CfnOutput(this, "WebsiteURL", {
      value: `https://${distribution.distributionDomainName}`,
      description: "Website URL",
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
      description: "CloudFront Distribution ID",
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
      description: "S3 Bucket Name",
    });
  }
}
