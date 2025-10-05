import { APIGatewayProxyHandler } from "aws-lambda";
import { getCognitoConfig } from "../utils/get-cognito-config";
import { CognitoService } from "../services/CognitoService";


export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { documentNumber } = body;

    if (!documentNumber) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "CPF é obrigatório" }),
      };
    }

    const { region, userPoolId, appClientId } = await getCognitoConfig();
    const service = new CognitoService(region, userPoolId, appClientId);

    const result = await service.signIn(documentNumber.replace(/\D/g, ""));

    return {
      statusCode: result.success ? 200 : 400,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Erro no login",
        error: error.message,
      }),
    };
  }
};
