import { mockClient } from "aws-sdk-client-mock";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { CognitoService } from "../CognitoService";

const cognitoMock = mockClient(CognitoIdentityProviderClient);

describe("CognitoService", () => {
  let service: CognitoService;
  const region = "us-east-1";
  const userPoolId = "us-east-1_test";
  const clientId = "test-client-id";

  beforeEach(() => {
    cognitoMock.reset();
    service = new CognitoService(region, userPoolId, clientId);
  });

  describe("signUp", () => {
    const mockUser = {
      name: "Thiago Adriano",
      email: "thiago@test.com",
      documentNumber: "12345678900",
    };

    it("Deve cadastrar um usuário com sucesso quando ele não existe", async () => {
      // Simula que o usuário NÃO existe (AdminGetUser lança UserNotFoundException)
      cognitoMock.on(AdminGetUserCommand).rejects({ name: "UserNotFoundException" });
      cognitoMock.on(SignUpCommand).resolves({});
      cognitoMock.on(AdminConfirmSignUpCommand).resolves({});

      const result = await service.signUp(mockUser);

      expect(result.success).toBe(true);
      expect(result.message).toContain("sucesso");
      expect(cognitoMock.calls()).toHaveLength(2); // GetUser + SignUp + Confirm
    });

    it("Deve lançar erro no signUp quando o Cognito falha", async () => {
      const mockError = new Error("Invalid email");
      mockError.name = "InvalidParameterException";
      cognitoMock.on(SignUpCommand).rejects(mockError);

      const mockUser = { name: "A", email: "bad", documentNumber: "123" };

      await expect(service.signUp(mockUser)).rejects.toThrow("Invalid email");
    });
  });

  describe("signUpAnonymousUser", () => {
    it("Deve cadastrar usuário anônimo e confirmar", async () => {
      cognitoMock.on(SignUpCommand).resolves({});
      cognitoMock.on(AdminConfirmSignUpCommand).resolves({});

      const result = await service.signUpAnonymousUser("anon-123");

      expect(result?.success).toBe(true);
      expect(cognitoMock.commandCalls(SignUpCommand)[0].args[0].input.Username).toBe("anon-123");
    });
    it("Deve capturar erro no signUpAnonymousUser e não relançar", async () => {
      cognitoMock.on(SignUpCommand).rejects(new Error("Falha silenciosa"));
      
      const result = await service.signUpAnonymousUser("anon-123");
      
      expect(result).toBeUndefined(); // Porque seu catch não retorna nada nem dá throw
    });
  });

  describe("login", () => {
    it("Deve retornar tokens quando as credenciais estão corretas", async () => {
      cognitoMock.on(AdminInitiateAuthCommand).resolves({
        AuthenticationResult: {
          IdToken: "mock-id-token",
          AccessToken: "mock-access-token",
        },
      });

      const result = await service.login("12345678900");

      expect(result.token).toBe("mock-id-token");
    });

    it("Deve lançar erro genérico para exceções não mapeadas", async () => {
      cognitoMock.on(AdminInitiateAuthCommand).rejects(new Error("Erro Inesperado"));

      await expect(service.login("123")).rejects.toThrow("Erro Inesperado");
    });

    it("Deve lançar 'Usuário não confirmado.' quando UserNotConfirmedException ocorre", async () => {
    cognitoMock.on(AdminInitiateAuthCommand).rejects({ name: "UserNotConfirmedException" });
    await expect(service.login("123")).rejects.toThrow("Usuário não confirmado.");
  });

  it("Deve lançar 'Usuário não encontrado.' quando UserNotFoundException ocorre", async () => {
    cognitoMock.on(AdminInitiateAuthCommand).rejects({ name: "UserNotFoundException" });
    await expect(service.login("123")).rejects.toThrow("Usuário não encontrado.");
  });

  it("Deve lançar erro se AuthenticationResult vier vazio", async () => {
    cognitoMock.on(AdminInitiateAuthCommand).resolves({ AuthenticationResult: undefined });
    await expect(service.login("123")).rejects.toThrow("Authentication failed: No authentication result returned");
  });
  });

  describe("userExists", () => {
  it("Deve retornar true se o usuário for encontrado", async () => {
    cognitoMock.on(AdminGetUserCommand).resolves({});
    const exists = await service.userExists("123");
    expect(exists).toBe(true);
  });

  it("Deve retornar false se o Cognito lançar UserNotFoundException", async () => {
    cognitoMock.on(AdminGetUserCommand).rejects({ name: "UserNotFoundException" });
    const exists = await service.userExists("123");
    expect(exists).toBe(false);
  });

  it("Deve relançar o erro se for uma exceção diferente de UserNotFoundException", async () => {
    cognitoMock.on(AdminGetUserCommand).rejects({ name: "InternalErrorException" });
    await expect(service.userExists("123")).rejects.toMatchObject({ name: "InternalErrorException" });
  });
});
});