# Deploy MXNet Sagemaker Endpoint With CDK

`Running this repository costs to your AWS Account. It uses ml.p3.2xlarge instance.`

# Prerequisite

- AWS Account
- Install CDK
- Node 10.x

# Usage

1. Install dependencies

```bash
$ cd infra
$ npm i 
```

2. create bucket with name containing `sagemaker` (this is for `AmazonSageMakerFullAccess` Role)

3. set your region of aws account to `ap-northeast-1`. or change `region` at [infra-stack.ts](infra/infra-stack.ts) and choose `image` value on [this list](https://docs.aws.amazon.com/deep-learning-containers/latest/devguide/deep-learning-containers-images.html)

4. deploy

```bash
$ cdk deploy
```

* place your own `model.params` to [model](model) directory and modify [code/inference.py](code/inference.py) properly. current `inference.py` uses pretrained model.

# Cleanup

```bash
$ cdk destroy
```