Feature: Autenticação de Usuário via Lambda
  Como um cliente da API
  Eu quero me autenticar ou cadastrar usando meu CPF
  Para que eu possa obter um token de acesso

  Scenario: Usuário novo se cadastrando com sucesso
    Given que o usuário com CPF "12345678901" não existe no Cognito
    When eu envio uma requisição POST com nome "Joao", email "joao@email.com" e documento "123.456.789-01"
    Then o status do retorno deve ser 201
    And o corpo da resposta deve conter um token

  Scenario: Usuário existente fazendo login
    Given que o usuário com CPF "12345678901" já existe no Cognito
    When eu envio uma requisição POST com nome "Joao", email "joao@email.com" e documento "123.456.789-01"
    Then o status do retorno deve ser 200
    And o corpo da resposta deve conter um token