import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const passwordDefault = "SoatChallenge#01";

interface UsuarioDto {
  nome: string;
  email: string;
  cpf: string;
}

interface TokenDto {
  idToken: string;
  accessToken: string;
}

export class CognitoService {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor(region: string, userPoolId: string, clientId: string) {
    this.client = new CognitoIdentityProviderClient({ region });
    this.userPoolId = userPoolId;
    this.clientId = clientId;
  }

  // -------------------
  // SignUp
  // -------------------
  async signUp(user: UsuarioDto) {
    const exists = await this.userExists(user.cpf);
    if (exists) {
      return { success: false, message: "Usuário já cadastrado. Por favor, tente autenticar." };
    }

    await this.client.send(
      new SignUpCommand({
        ClientId: this.clientId,
        Username: user.cpf,
        Password: passwordDefault,
        UserAttributes: [
          { Name: "email", Value: user.email },
          { Name: "name", Value: user.nome },
        ],
      })
    );

    await this.client.send(
      new AdminConfirmSignUpCommand({
        Username: user.cpf,
        UserPoolId: this.userPoolId,
      })
    );

    return { success: true, message: "Usuário cadastrado com sucesso" };
  }

  // -------------------
  // Verifica se usuário já existe
  // -------------------
  private async userExists(cpf: string): Promise<boolean> {
    try {
      await this.client.send(
        new AdminGetUserCommand({
          Username: cpf,
          UserPoolId: this.userPoolId,
        })
      );
      return true;
    } catch (err: any) {
      if (err.name === "UserNotFoundException") return false;
      throw err;
    }
  }

  // -------------------
  // SignIn
  // -------------------
  async signIn(cpf: string): Promise<{ success: boolean; token?: TokenDto; message?: string }> {
    try {
      const authResponse = await this.client.send(
        new AdminInitiateAuthCommand({
          UserPoolId: this.userPoolId,
          ClientId: this.clientId,
          AuthFlow: "ADMIN_NO_SRP_AUTH",
          AuthParameters: {
            USERNAME: cpf,
            PASSWORD: passwordDefault,
          },
        })
      );

      if (authResponse.AuthenticationResult) {
        return {
          success: true,
          token: {
            idToken: authResponse.AuthenticationResult.IdToken!,
            accessToken: authResponse.AuthenticationResult.AccessToken!,
          },
        };
      }

      return { success: false, message: "Ocorreu um erro ao fazer login." };
    } catch (err: any) {
      if (err.name === "UserNotConfirmedException") {
        return { success: false, message: "Usuário não confirmado." };
      }
      if (err.name === "UserNotFoundException") {
        return { success: false, message: "Usuário não encontrado." };
      }
      throw err;
    }
  }
}
