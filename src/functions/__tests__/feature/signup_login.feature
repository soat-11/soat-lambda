# language: pt
Funcionalidade: Cadastro e Autenticação de Cliente no Totem

  Cenário: Cadastro de novo cliente com sucesso para obter acesso ao sistema
    Dado que um cliente fornece os seguintes dados:
      | nome           | email              | cpf            |
      | Thiago Adriano | thiago@example.com | 123.456.789-00 |
    Quando o sistema processa a solicitação de cadastro
    Então o sistema deve criar uma conta no Cognito
    E deve retornar um Token JWT com status 201
    E o CPF deve ser armazenado apenas com números "12345678900"