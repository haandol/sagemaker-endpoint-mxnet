import * as path from 'path'
import * as childProcess from 'child_process';

import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as sagemaker from '@aws-cdk/aws-sagemaker';

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // image should be changed if you changed region
    const region = 'ap-northeast-1';
    const image = `763104351884.dkr.ecr.ap-northeast-1.amazonaws.com/mxnet-inference:1.6.0-gpu-py3`;

    // bucketName should contain keyword `sagemaker` for IAM Role
    const bucketName = 'sagemaker-yolo-bucket-dongkyl';
    const bucket = `s3://${bucketName}`

    const modelName = 'yolo3-0';
    const modelDataUrl = `${bucket}/${modelName}/model.tar.gz`;

    const entryPoint = 'inference.py';
    const instanceType = 'ml.p3.2xlarge';

    this.generateAndUploadModel(modelDataUrl);

    const role = new iam.Role(this, `${id}ModelRole`, {
      roleName: `${id}ModelRole`,
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      managedPolicies: [
        { managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonSageMakerFullAccess' }
      ]
    });
    const model = new sagemaker.CfnModel(this, `${id}Model`, {
      modelName,
      executionRoleArn: role.roleArn,
      primaryContainer: {
        image, 
        modelDataUrl,
        environment: {
          SAGEMAKER_SUBMIT_DIRECTORY: modelDataUrl,
          SAGEMAKER_PROGRAM: entryPoint,
          SAGEMAKER_REGION: region,
          SAGEMAKER_CONTAINER_LOG_LEVEL: 20,
          SAGEMAKER_ENABLE_CLOUDWATCH_METRICS: false,
        },
      }
    });
    model.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const endpointConfig = new sagemaker.CfnEndpointConfig(this, `${id}EndpointConfig`, {
      endpointConfigName: `${modelName}Config`,
      productionVariants: [
        {
          initialInstanceCount: 1,
          initialVariantWeight: 1,
          instanceType,
          modelName: model.attrModelName,
          variantName: 'AllTraffic'
        }
      ]
    });
    endpointConfig.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    endpointConfig.addDependsOn(model);

    const endpoint = new sagemaker.CfnEndpoint(this, `${id}Endpoint`, {
      endpointConfigName: `${modelName}Config`,
      endpointName: `${modelName}Endpoint`,
    });
    endpoint.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    endpoint.addDependsOn(endpointConfig);

    new cdk.CfnOutput(this, `${modelName}Endpoint`, {
      value: endpoint.attrEndpointName,
    })
  }

  generateAndUploadModel(modelDataUrl: string) {
    console.info('Generate model.tar.gz....');

    const modelPath = path.join(__dirname, '../../model');
    childProcess.execSync(`cd ${modelPath} && tar zcvf model.tar.gz model.params code && aws s3 cp model.tar.gz ${modelDataUrl}`);
    
    console.info('model.tar.gz has been created');
  }
}
