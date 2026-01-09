import { APIGatewayProxyHandler } from "aws-lambda";
import { CognitoService } from "../services/CognitoService";
import { getCognitoConfig } from "../utils/get-cognito-config";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { name, email, documentNumber } = JSON.parse(event.body || "{}");
    const cpf = documentNumber.replace(/\D/g, "");

    const { region, userPoolId, appClientId } = await getCognitoConfig();
    const service = new CognitoService(region, userPoolId, appClientId);

    // 1. Criar o usuário no Cognito
    const result = await service.signUp({ name, email, documentNumber: documentNumber.replace(/\D/g, "") });
    if (!result.success) {
      throw new Error(result.message);
    }

    // 2. Fazer login automático para obter o Token
    const authResult = await service.login(cpf);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Usuário criado e logado",
        token: authResult.token?.idToken, // Esse token vai no Header Authorization
        user_id: authResult.token?.accessToken
      }),
    };
  } catch (error: any) {
    return { statusCode: 400, body: JSON.stringify({ message: error.message, error: error.message }) };
  }
};