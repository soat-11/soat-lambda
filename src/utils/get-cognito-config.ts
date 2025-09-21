import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({ region: process.env.AWS_REGION || "us-east-1" });

export async function getCognitoConfig() {
  const [userPoolParam, appClientParam] = await Promise.all([
    ssm.send(new GetParameterCommand({ Name: "/cognito/user_pool_id" })),
    ssm.send(new GetParameterCommand({ Name: "/cognito/app_client_id" })),
  ]);

  return {
    userPoolId: userPoolParam.Parameter?.Value!,
    appClientId: appClientParam.Parameter?.Value!,
    region: process.env.AWS_REGION || "us-east-1",
  };
}
