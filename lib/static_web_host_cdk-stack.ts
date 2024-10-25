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

    const bucket = new s3.Bucket(this, props.s3BucketName, {
      accessControl: s3.BucketAccessControl.PRIVATE,
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
        },
      }
    );

    new cdk.CfnOutput(this, "WebsiteURL", {
      value: distribution.distributionDomainName,
    });
  }
}
