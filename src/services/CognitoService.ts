import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const passwordDefault = "SoatChallenge#01";

interface UsuarioDto {
  name: string;
  email: string;
  documentNumber: string;
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
    try {
    await this.client.send(
      new SignUpCommand({
        ClientId: this.clientId,
        Username: user.documentNumber,        
        Password: passwordDefault,
        UserAttributes: [
          { Name: "email", Value: user.email },
          { Name: "name", Value: user.name },
        ],
      })
    );

    await this.client.send(
      new AdminConfirmSignUpCommand({
        Username: user.documentNumber,
        UserPoolId: this.userPoolId,
      })
    );

    return { success: true, message: "Usuário cadastrado com sucesso" };
    } catch (error: any) {
      console.error("signUp", error.name, error.message);
      throw error;
    }
    
  }

   async signUpAnonymousUser(anonymousId: string) {
    try {
       await this.client.send(
      new SignUpCommand({
        ClientId: this.clientId,
        Username: anonymousId,
        Password: passwordDefault,
        UserAttributes: [
          { Name: "name", Value: 'Visitante' },
        ],
      })
    );

    await this.client.send(
      new AdminConfirmSignUpCommand({
        Username: anonymousId,
        UserPoolId: this.userPoolId,
      })
    );

    return { success: true, message: "Usuário anonimo cadastrado com sucesso" };
    } catch (error: any) { 
      console.error("signUpAnonymousUser", error.name, error.message);
    }
   
  }

  // -------------------
  // Verifica se usuário já existe
  // -------------------
  async userExists(documentNumber: string): Promise<boolean> {
    try {
      await this.client.send(
        new AdminGetUserCommand({
          Username: documentNumber,
          UserPoolId: this.userPoolId,
        })
      );
      return true;
    } catch (err: any) {
      console.error("userExists", err.name, err.message);
      if (err.name === "UserNotFoundException") return false;
      throw err;
    }
  }

  // -------------------
  // Login
  // -------------------
  async login(documentNumber: string): Promise<{ token: string }> {
    try {
      const authResponse = await this.client.send(
        new AdminInitiateAuthCommand({
          UserPoolId: this.userPoolId,
          ClientId: this.clientId,
          AuthFlow: "ADMIN_NO_SRP_AUTH",
          AuthParameters: {
            USERNAME: documentNumber,
            PASSWORD: passwordDefault,
          },
        })
      );

      if (!authResponse.AuthenticationResult) {
        throw new Error("Authentication failed: No authentication result returned");
      }

      return {
        token: authResponse.AuthenticationResult.IdToken as string,
      }
      
    } catch (err: any) {
      console.error("Erro dentro do CognitoService:", err.name, err.message);
      if (err.name === "UserNotConfirmedException") {
        throw new Error("Usuário não confirmado.");
      }
      if (err.name === "UserNotFoundException") {
        throw new Error("Usuário não encontrado.");
      }
      throw err;
    }
  }
}
