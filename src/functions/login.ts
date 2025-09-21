import { APIGatewayProxyHandler } from "aws-lambda";
import { CognitoUser, AuthenticationDetails, CognitoUserPool } from "amazon-cognito-identity-js";
import { getCognitoConfig } from "../utils/get-cognito-config";
import { AdminSetUserPasswordCommand, CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

const passwordPermanent = "Fiap@2025";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { cpf } = body;

    if (!cpf) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "CPF é obrigatório" }),
      };
    }

    const { userPoolId, appClientId } = await getCognitoConfig();
    const userPool = new CognitoUserPool({ UserPoolId: userPoolId, ClientId: appClientId });

    const user = new CognitoUser({ Username: cpf, Pool: userPool });

  await setPermanentPassword(userPoolId, cpf, passwordPermanent)
    .then(() => console.log("User password updated successfully."))
    .catch((err) => console.error("Failed to update user password:", err));
  
    const authDetails = new AuthenticationDetails({ Username: cpf, Password: passwordPermanent });

    const result = await new Promise((resolve, reject) => {
      user.authenticateUser(authDetails, {
        onSuccess: resolve,
        onFailure: reject,
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Login realizado com sucesso", session: result }),
    };
  } catch (error: any) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Erro no login", error: error.message }),
    };
  }
};

const setPermanentPassword = async (userPoolId: string, username: string, newPassword: string) => {
  const client = new CognitoIdentityProviderClient({ region: process.env.region || 'us-east-1' });

  const command = new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: username,
    Password: newPassword,
    Permanent: true,
  });

  try {
    return await client.send(command);
  } catch (error: any) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Erro ao setar permanentemente a senha", error: error.message }),
    };
  }
};