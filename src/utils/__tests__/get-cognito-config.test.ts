import { getCognitoConfig } from "../get-cognito-config";

describe("getCognitoConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Limpa o cache de módulos
    process.env = { ...originalEnv }; // Clona o env original
  });

  afterAll(() => {
    process.env = originalEnv; // Restaura o env original ao final de tudo
  });

  it("deve retornar as configurações das variáveis de ambiente corretamente", async () => {
    process.env.COGNITO_USER_POOL_ID = "real-pool-id";
    process.env.COGNITO_APP_CLIENT_ID = "real-app-id";
    process.env.AWS_REGION = "us-west-2";

    const config = await getCognitoConfig();

    expect(config).toEqual({
      userPoolId: "real-pool-id",
      appClientId: "real-app-id",
      region: "us-west-2",
    });
  });

  it("deve usar os valores default quando as variáveis não estiverem setadas", async () => {
    // Removemos as variáveis para forçar o uso do ||
    delete process.env.COGNITO_USER_POOL_ID;
    delete process.env.COGNITO_APP_CLIENT_ID;
    delete process.env.AWS_REGION;

    const config = await getCognitoConfig();

    expect(config.region).toBe("us-east-1");
    expect(config.userPoolId).toBe("teste-pool-id");
  });
});