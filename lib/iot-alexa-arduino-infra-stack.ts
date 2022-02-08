import { Stack, StackProps, aws_lambda, aws_iot, SecretValue, aws_ssm, aws_iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Skill } from 'cdk-alexa-skill';

export class IotAlexaArduinoInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    const alexaFunctionHandler = new aws_lambda.Function(this, 'AlexaTranscribeFunction', {
      code: aws_lambda.Code.fromAsset('resources/function/'),
      runtime: aws_lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
    });

    const role = alexaFunctionHandler.role;
    if(role) {
      role.addManagedPolicy(aws_iam.ManagedPolicy.fromManagedPolicyArn(this, 'TranslateFunctionPolicy', 'arn:aws:iam::aws:policy/TranslateReadOnly'));
    }

    const skill = new Skill(this, 'IoTAlexaArduinoSkill', {
      endpointLambdaFunction: alexaFunctionHandler,       
      skillPackagePath: 'skill-package',
      alexaVendorId: aws_ssm.StringParameter.valueForStringParameter(this, '/iot-alexa-arduino/alexa-developer-vendor-id'),
      lwaClientId: aws_ssm.StringParameter.valueForStringParameter(this, '/iot-alexa-arduino/lwa-client-id'),
      lwaClientSecret: SecretValue.secretsManager('lwa-client-secret'), 
      lwaRefreshToken: SecretValue.secretsManager('lwa-refresh-token') 
    });

    const thing = new aws_iot.CfnThing(this, 'ArduinoAlexa', {
      thingName: 'ArduinoAlexa',
    });

    const policy = new aws_iot.CfnPolicy(this, 'ArduinoAlexaPolicy', {
      policyDocument: {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": "iot:Connect",
            "Resource": `arn:aws:iot:${this.region}:${this.account}:client/${thing.thingName}`
          },
          {
            "Effect": "Allow",
            "Action": "iot:Subscribe",
            "Resource": `arn:aws:iot:${this.region}:${this.account}:topicfilter/arduino/sub`
          },
        {
            "Effect": "Allow",
            "Action": "iot:Receive",
            "Resource": `arn:aws:iot:${this.region}:${this.account}:topic/arduino/sub`
          },
          {
            "Effect": "Allow",
            "Action": "iot:Publish",
            "Resource": `arn:aws:iot:${this.region}:${this.account}:topic/arduino/pub`
          }
        ]
      },
      policyName: 'ArduinoAlexaPolicy',
    });
    
  }
}
