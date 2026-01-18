export async function getCognitoConfig() {
  // Lendo diretamente das variáveis de ambiente injetadas pelo Terraform
  const userPoolId = process.env.COGNITO_USER_POOL_ID || "teste-pool-id";
  const appClientId = process.env.COGNITO_APP_CLIENT_ID || "teste-app-client-id";
  const region = process.env.AWS_REGION || "us-east-1";

  if (!userPoolId || !appClientId) {
    throw new Error("As variáveis de ambiente COGNITO_USER_POOL_ID ou COGNITO_APP_CLIENT_ID não foram definidas.");
  }

  return {
    userPoolId,
    appClientId,
    region,
  };
}