import { APIGatewayProxyHandler } from "aws-lambda";
import { CognitoService } from "../services/CognitoService";
import { getCognitoConfig } from "../utils/get-cognito-config";
import { randomUUID } from "node:crypto";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
        const anonymousId = `anon_${randomUUID().substring(0, 8)}`;
    

    const { region, userPoolId, appClientId } = await getCognitoConfig();    
    const service = new CognitoService(region, userPoolId, appClientId);

    // 1. Cria um usuário temporário
    const result = await service.signUpAnonymousUser(anonymousId);
    if (!result.success) {
      throw new Error(result.message);
    }



    // 2. Autentica para gerar o JWT
    const authResult = await service.login(anonymousId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Logado como visitante",
         token: authResult.token?.idToken, // Esse token vai no Header Authorization
        user_id: authResult.token?.accessToken
      }),
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ message: "Erro no login anônimo", error: error.message }) };
  }
};