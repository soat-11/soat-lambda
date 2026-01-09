import { handler } from "../signup-and-login"; // ajuste o caminho
import { CognitoService } from "../../services/CognitoService";
import { getCognitoConfig } from "../../utils/get-cognito-config";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

// Mock das dependências
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
    // GIVEN: Um evento com dados válidos
    const event = {
      body: JSON.stringify({
        name: "Thiago Adriano",
        email: "thiago@example.com",
        documentNumber: "123.456.789-00"
      }),
    } as APIGatewayProxyEvent;

    const signUpMock = jest.fn().mockResolvedValue({ success: true });
    const loginMock = jest.fn().mockResolvedValue({
      success: true,
      token: { idToken: "jwt-id-token", accessToken: "jwt-access-token" },
    });

    (CognitoService as jest.Mock).mockImplementation(() => ({
      signUp: signUpMock,
      login: loginMock,
    }));

    // WHEN: A lambda é executada
    const response = await handler(event, mockContext, () => {});

    // THEN: Deve retornar status 201 e os tokens
    expect(response?.statusCode).toBe(201);
    const body = JSON.parse(response?.body || "{}");
    expect(body.token).toBe("jwt-id-token");
    
    // Verifica se o CPF foi limpo antes de enviar ao service
    expect(signUpMock).toHaveBeenCalledWith(expect.objectContaining({
      documentNumber: "12345678900"
    }));
  });

  it("Deve retornar erro 400 se o cadastro no Cognito falhar", async () => {
    // GIVEN: Usuário já existente ou erro de validação do Cognito
    const event = {
      body: JSON.stringify({ name: "T", email: "e@e.com", documentNumber: "123" }),
    } as APIGatewayProxyEvent;

    (CognitoService as jest.Mock).mockImplementation(() => ({
      signUp: jest.fn().mockResolvedValue({ success: false, message: "Usuário já cadastrado" }),
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
    // Simula cadastro OK, mas login falha (ex: erro inesperado no Cognito)
    (CognitoService as jest.Mock).mockImplementation(() => ({
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
    // Simula falha ao buscar variáveis de ambiente/configurações
    (getCognitoConfig as jest.Mock).mockRejectedValue(new Error("Config Error"));

    const event = { body: JSON.stringify({ name: "A", email: "a@a.com", documentNumber: "111" }) } as APIGatewayProxyEvent;

    const response = await handler(event, mockContext, () => {});

    expect(response?.statusCode).toBe(400);
    expect(JSON.parse(response?.body || "{}").message).toBe("Config Error");
  });
});