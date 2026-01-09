import { handler } from "../anonymous-login"; // ajuste o caminho conforme sua estrutura
import { CognitoService } from "../../services/CognitoService";
import { getCognitoConfig } from "../../utils/get-cognito-config";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

// Mock das dependências externas
jest.mock("../../utils/get-cognito-config");
jest.mock("../../services/CognitoService");

describe("Lambda: anonymous-login", () => {
  const mockEvent = {
    body: JSON.stringify({}),
  } as APIGatewayProxyEvent;

  const mockContext = {} as Context;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock das configurações do Cognito
    (getCognitoConfig as jest.Mock).mockResolvedValue({
      region: "us-east-1",
      userPoolId: "pool-123",
      appClientId: "client-123",
    });
  });

  it("Deve realizar login anônimo com sucesso (Caminho Feliz)", async () => {
    // Configura o mock do Service para retornar sucesso no signup e login
    const signUpMock = jest.fn().mockResolvedValue({ success: true });
    const loginMock = jest.fn().mockResolvedValue({
      success: true,
      token: {
        idToken: "mock-id-token",
        accessToken: "mock-access-token",
      },
    });

    (CognitoService as jest.Mock).mockImplementation(() => ({
      signUpAnonymousUser: signUpMock,
      login: loginMock,
    }));

    const response = await handler(mockEvent, mockContext, () => {});

    expect(response?.statusCode).toBe(200);
    const body = JSON.parse(response?.body || "{}");
    expect(body.message).toBe("Logado como visitante");
    expect(body.token).toBe("mock-id-token");
    expect(signUpMock).toHaveBeenCalled();
    expect(loginMock).toHaveBeenCalled();
  });

  it("Deve retornar erro 500 se o cadastro anônimo falhar", async () => {
    // Simula falha no signup
    (CognitoService as jest.Mock).mockImplementation(() => ({
      signUpAnonymousUser: jest.fn().mockResolvedValue({ success: false, message: "Erro no Cognito" }),
      login: jest.fn(),
    }));

    const response = await handler(mockEvent, mockContext, () => {});

    expect(response?.statusCode).toBe(500);
    expect(JSON.parse(response?.body || "{}").message).toBe("Erro no login anônimo");
  });

  it("Deve retornar erro 500 se ocorrer uma exceção inesperada", async () => {
    // Simula um erro catastrófico
    (getCognitoConfig as jest.Mock).mockRejectedValue(new Error("Erro de conexão"));

    const response = await handler(mockEvent, mockContext, () => {});

    expect(response?.statusCode).toBe(500);
  });
});