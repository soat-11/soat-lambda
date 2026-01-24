import { handler } from "../signup-and-login";
import { CognitoService } from "../../services/CognitoService";
import { getCognitoConfig } from "../../utils/get-cognito-config";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

jest.mock("../../utils/get-cognito-config");
jest.mock("../../services/CognitoService");

describe("Lambda: signup-and-login", () => {
  const mockContext = {} as Context;

  beforeEach(() => {
    jest.clearAllMocks();
    (getCognitoConfig as jest.Mock).mockResolvedValue({
      region: "us-east-1",
      userPoolId: "pool-123",
      appClientId: "client-123",
    });
  });

  it("Deve cadastrar e logar um novo usuário com sucesso (Caminho Feliz)", async () => {
    const event = {
      body: JSON.stringify({
        name: "Thiago Adriano",
        email: "thiago@example.com",
        documentNumber: "123.456.789-00"
      }),
    } as APIGatewayProxyEvent;

    const userExistsMock = jest.fn().mockResolvedValue(false);
    const signUpMock = jest.fn().mockResolvedValue({ success: true });
    const loginMock = jest.fn().mockResolvedValue({
      token: "jwt-access-token",
      idToken: "jwt-id-token",
    });

    (CognitoService as jest.Mock).mockImplementation(() => ({
      userExists: userExistsMock,
      signUp: signUpMock,
      login: loginMock,
    }));

    const response = await handler(event, mockContext, () => {});

    expect(response?.statusCode).toBe(201);
    const body = JSON.parse(response?.body || "{}");
    expect(body.token).toBe("jwt-access-token");
    expect(userExistsMock).toHaveBeenCalledWith("12345678900");
    expect(signUpMock).toHaveBeenCalledWith(expect.objectContaining({
      documentNumber: "12345678900"
    }));
  });

  it("Deve retornar 200 e fazer login se usuário já existe", async () => {
    const event = {
      body: JSON.stringify({
        name: "Thiago Adriano",
        email: "thiago@example.com",
        documentNumber: "123.456.789-00"
      }),
    } as APIGatewayProxyEvent;

    const userExistsMock = jest.fn().mockResolvedValue(true);
    const loginMock = jest.fn().mockResolvedValue({
      token: "jwt-access-token",
    });

    (CognitoService as jest.Mock).mockImplementation(() => ({
      userExists: userExistsMock,
      login: loginMock,
    }));

    const response = await handler(event, mockContext, () => {});

    expect(response?.statusCode).toBe(200);
    const body = JSON.parse(response?.body || "{}");
    expect(body.token).toBe("jwt-access-token");
    expect(userExistsMock).toHaveBeenCalledWith("12345678900");
    expect(loginMock).toHaveBeenCalled();
  });

  it("Deve retornar erro 400 se o cadastro no Cognito falhar", async () => {
    const event = {
      body: JSON.stringify({ name: "T", email: "e@e.com", documentNumber: "123" }),
    } as APIGatewayProxyEvent;

    (CognitoService as jest.Mock).mockImplementation(() => ({
      userExists: jest.fn().mockResolvedValue(false),
      signUp: jest.fn().mockRejectedValue(new Error("Usuário já cadastrado")),
      login: jest.fn(),
    }));

    const response = await handler(event, mockContext, () => {});

    expect(response?.statusCode).toBe(400);
    expect(JSON.parse(response?.body || "{}").message).toBe("Usuário já cadastrado");
  });

  it("Deve retornar erro 400 se o corpo do evento estiver malformado", async () => {
    const event = { body: "invalid-json" } as APIGatewayProxyEvent;

    const response = await handler(event, mockContext, () => {});

    expect(response?.statusCode).toBe(400);
  });

  it("Deve retornar erro 400 se o login falhar após um cadastro bem-sucedido", async () => {
    (CognitoService as jest.Mock).mockImplementation(() => ({
      userExists: jest.fn().mockResolvedValue(false),
      signUp: jest.fn().mockResolvedValue({ success: true }),
      login: jest.fn().mockRejectedValue(new Error("Erro interno na autenticação")),
    }));

    const event = {
      body: JSON.stringify({ name: "A", email: "a@a.com", documentNumber: "111" }),
    } as APIGatewayProxyEvent;

    const response = await handler(event, mockContext, () => {});

    expect(response?.statusCode).toBe(400);
    expect(JSON.parse(response?.body || "{}").message).toBe("Erro interno na autenticação");
  });

  it("Deve lidar com erro se getCognitoConfig falhar", async () => {
    (getCognitoConfig as jest.Mock).mockRejectedValue(new Error("Config Error"));

    const event = { body: JSON.stringify({ name: "A", email: "a@a.com", documentNumber: "111" }) } as APIGatewayProxyEvent;

    const response = await handler(event, mockContext, () => {});

    expect(response?.statusCode).toBe(400);
    expect(JSON.parse(response?.body || "{}").message).toBe("Config Error");
  });
});