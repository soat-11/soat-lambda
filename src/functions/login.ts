import { APIGatewayProxyHandler } from "aws-lambda";
import { CognitoUser, AuthenticationDetails, CognitoUserPool } from "amazon-cognito-identity-js";
import { getCognitoConfig } from "../utils/get-cognito-config";

const passwordDefault = "SoatChallenge#01";

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
    const authDetails = new AuthenticationDetails({ Username: cpf, Password: "SoatChallenge#01" });

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
