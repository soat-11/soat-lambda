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
      expect(cognitoMock.calls()).toHaveLength(3); // GetUser + SignUp + Confirm
    });

    it("Deve retornar erro se o usuário já existir", async () => {
      // Simula que o usuário existe
      cognitoMock.on(AdminGetUserCommand).resolves({ Username: mockUser.documentNumber });

      const result = await service.signUp(mockUser);

      expect(result.success).toBe(false);
      expect(result.message).toContain("já cadastrado");
      expect(cognitoMock.commandCalls(SignUpCommand)).toHaveLength(0);
    });
  });

  describe("signUpAnonymousUser", () => {
    it("Deve cadastrar usuário anônimo e confirmar", async () => {
      cognitoMock.on(SignUpCommand).resolves({});
      cognitoMock.on(AdminConfirmSignUpCommand).resolves({});

      const result = await service.signUpAnonymousUser("anon-123");

      expect(result.success).toBe(true);
      expect(cognitoMock.commandCalls(SignUpCommand)[0].args[0].input.Username).toBe("anon-123");
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

      expect(result.success).toBe(true);
      expect(result.token?.idToken).toBe("mock-id-token");
    });

    it("Deve tratar erro de usuário não encontrado no login", async () => {
      cognitoMock.on(AdminInitiateAuthCommand).rejects({ name: "UserNotFoundException" });

      const result = await service.login("000");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Usuário não encontrado.");
    });

    it("Deve tratar erro de usuário não confirmado no login", async () => {
      cognitoMock.on(AdminInitiateAuthCommand).rejects({ name: "UserNotConfirmedException" });

      const result = await service.login("123");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Usuário não confirmado.");
    });

    it("Deve lançar erro genérico para exceções não mapeadas", async () => {
      cognitoMock.on(AdminInitiateAuthCommand).rejects(new Error("Erro Inesperado"));

      await expect(service.login("123")).rejects.toThrow("Erro Inesperado");
    });
  });
});