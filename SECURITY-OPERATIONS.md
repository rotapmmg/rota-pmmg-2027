# Segurança operacional — Rota PMMG

## Antes do lançamento

- Proteger a branch `main`: PR obrigatório, aprovação, CODEOWNERS, checks obrigatórios, sem force-push e sem exclusão.
- Configurar o GitHub Environment `production` com aprovação humana para qualquer workflow que altere produção.
- Manter Mercado Pago Access Token e webhook secret apenas no Secret Manager/Firebase Functions secrets.
- Não armazenar JSON de conta de serviço no repositório ou em arquivos locais versionados.
- Migrar credenciais de CI para OIDC/Workload Identity Federation assim que a identidade no Google Cloud estiver criada.
- Ativar 2FA/passkeys nas contas GitHub, Google/Firebase e Mercado Pago.
- Manter cópia externa periódica do repositório.

## Billing

O backend deve:
- exigir Firebase ID Token válido;
- exigir e-mail verificado;
- limitar criação de cobranças por usuário;
- validar assinatura do webhook;
- consultar o pagamento diretamente no Mercado Pago;
- ativar Premium apenas para pagamento previamente criado pelo checkout e vinculado ao mesmo usuário/produto;
- ser idempotente para não renovar duas vezes o mesmo pagamento.

## Resposta a incidente

1. interromper deploys e, se necessário, geração de novas cobranças;
2. rotacionar secrets comprometidos;
3. revogar chaves antigas;
4. revisar logs do GitHub, Google Cloud/Firebase e Mercado Pago;
5. restaurar a versão íntegra do código e do banco;
6. executar novamente os testes de acesso e billing antes de reabrir produção.
