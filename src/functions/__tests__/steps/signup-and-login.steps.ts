import { handler } from "../../signup-and-login";
import { CognitoService } from "../../../services/CognitoService";
import { getCognitoConfig } from "../../../utils/get-cognito-config";
import { APIGatewayProxyResult } from "aws-lambda";

// Mock das dependências
jest.mock("../../../services/CognitoService");
jest.mock("../../../utils/get-cognito-config");

describe("BDD: Autenticação de Usuário", () => {
  const mockGetConfig = getCognitoConfig as jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConfig.mockResolvedValue({
      region: "us-east-1",
      userPoolId: "pool-123",
      appClientId: "client-123"
    });
  });

  test("Usuário novo se cadastrando com sucesso", async () => {
    // GIVEN
    (CognitoService.prototype.userExists as jest.Mock).mockResolvedValue(false);
    (CognitoService.prototype.signUp as jest.Mock).mockResolvedValue({ success: true });
    (CognitoService.prototype.login as jest.Mock).mockResolvedValue({ token: "mock-token-123" });

    const event = {
      body: JSON.stringify({
        name: "Joao",
        email: "joao@email.com",
        documentNumber: "123.456.789-01"
      })
    } as any;

    // WHEN
    const response = await handler(event, {} as any, () => {}) as APIGatewayProxyResult;

    // THEN
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toHaveProperty("token", "mock-token-123");
    expect(CognitoService.prototype.signUp).toHaveBeenCalled();
  });

  test("Usuário existente fazendo login", async () => {
    // GIVEN
    (CognitoService.prototype.userExists as jest.Mock).mockResolvedValue(true);
    (CognitoService.prototype.login as jest.Mock).mockResolvedValue({ token: "token-existente" });

    const event = {
      body: JSON.stringify({
        name: "Joao",
        email: "joao@email.com",
        documentNumber: "123.456.789-01"
      })
    } as any;

    // WHEN
    const response = await handler(event, {} as any, () => {}) as APIGatewayProxyResult;

    // THEN
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty("token", "token-existente");
    expect(CognitoService.prototype.signUp).not.toHaveBeenCalled();
  });
});