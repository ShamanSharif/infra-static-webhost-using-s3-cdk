#!/usr/bin/env node
import "source-map-support/register";
import * as dotenv from "dotenv";
import * as cdk from "aws-cdk-lib";
import { StaticWebHostCdkStack } from "../lib/static_web_host_cdk-stack";

dotenv.config();

const s3BucketName = process.env.S3_BUCKET_NAME;
if (s3BucketName == undefined) {
  console.log("Environment 'S3_BUCKET_NAME' cannot be empty");
  process.exit();
}

const app = new cdk.App();
new StaticWebHostCdkStack(app, "StaticWebHostCdkStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  s3BucketName: s3BucketName,
});
