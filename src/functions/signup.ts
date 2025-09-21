import { APIGatewayProxyHandler } from "aws-lambda";
import { CognitoUserPool, CognitoUserAttribute } from "amazon-cognito-identity-js";
import { getCognitoConfig } from "../utils/get-cognito-config";


const passwordDefault = "SoatChallenge#01";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { name, email, cpf } = body;

    if (!name || !email || !cpf) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: `Todos os campos são obrigatórios, ${name + email + cpf}` }),
      };
    }

    const { userPoolId, appClientId } = await getCognitoConfig();
    const userPool = new CognitoUserPool({ UserPoolId: userPoolId, ClientId: appClientId });

    const attributes = [
      new CognitoUserAttribute({ Name: "name", Value: name }),
      new CognitoUserAttribute({ Name: "email", Value: email }),
    ];

    await new Promise<void>((resolve, reject) => {
      userPool.signUp(cpf, passwordDefault, attributes, [], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Usuário cadastrado com sucesso" }),
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Erro no cadastro", error: error.message, payload: event.body }),
    };
  }
};
