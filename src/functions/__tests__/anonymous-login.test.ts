import { handler } from "../anonymous-login";
import { CognitoService } from "../../services/CognitoService";
import { getCognitoConfig } from "../../utils/get-cognito-config";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

jest.mock("../../utils/get-cognito-config");
jest.mock("../../services/CognitoService");

describe("Lambda: anonymous-login", () => {
  const mockEvent = {
    body: JSON.stringify({}),
  } as APIGatewayProxyEvent;

  const mockContext = {} as Context;

  beforeEach(() => {
    jest.clearAllMocks();

    (getCognitoConfig as jest.Mock).mockResolvedValue({
      region: "us-east-1",
      userPoolId: "pool-123",
      appClientId: "client-123",
    });
  });

  it("Deve realizar login anônimo com sucesso (Caminho Feliz)", async () => {
    const signUpMock = jest.fn().mockResolvedValue({ success: true });
    const loginMock = jest.fn().mockResolvedValue({
      token: "mock-access-token",
      idToken: "mock-id-token",
    });

    (CognitoService as jest.Mock).mockImplementation(() => ({
      signUpAnonymousUser: signUpMock,
      login: loginMock,
    }));

    const response = await handler(mockEvent, mockContext, () => {});

    expect(response?.statusCode).toBe(200);
    const body = JSON.parse(response?.body || "{}");
    expect(body.token).toBe("mock-access-token");
    expect(signUpMock).toHaveBeenCalled();
    expect(loginMock).toHaveBeenCalled();
  });

  it("Deve retornar erro 500 se o cadastro anônimo falhar", async () => {
    (CognitoService as jest.Mock).mockImplementation(() => ({
      signUpAnonymousUser: jest.fn().mockResolvedValue({ success: false, message: "Erro no Cognito" }),
      login: jest.fn(),
    }));

    const response = await handler(mockEvent, mockContext, () => {});

    expect(response?.statusCode).toBe(500);
    expect(JSON.parse(response?.body || "{}").message).toBe("Erro no login anônimo");
  });

  it("Deve retornar erro 500 se o login falhar após cadastro bem-sucedido", async () => {
    (CognitoService as jest.Mock).mockImplementation(() => ({
      signUpAnonymousUser: jest.fn().mockResolvedValue({ success: true }),
      login: jest.fn().mockRejectedValue(new Error("Erro de autenticação")),
    }));

    const response = await handler(mockEvent, mockContext, () => {});

    expect(response?.statusCode).toBe(500);
    expect(JSON.parse(response?.body || "{}").message).toBe("Erro no login anônimo");
  });
});