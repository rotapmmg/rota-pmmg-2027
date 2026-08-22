# Rota PMMG Premium — Mercado Pago Pix

## Produto
- Valor: **R$ 30,00**
- Duração: **30 dias** por pagamento aprovado
- Meio de pagamento: **Pix via Mercado Pago**
- Renovação: novo Pix; não há débito/renovação automática

## Arquitetura
O GitHub Pages continua servindo somente o frontend. As credenciais privadas ficam em Firebase Cloud Functions no projeto `rota-pmmg-2027`.

Fluxo:
1. usuário entra com Google;
2. frontend pede CPF e chama `createPixPayment` com o Firebase ID Token;
3. a Cloud Function cria o pagamento Pix no Mercado Pago;
4. frontend mostra QR Code e Pix copia e cola;
5. Mercado Pago envia o evento de pagamento para `mercadoPagoWebhook`;
6. o webhook valida a assinatura, consulta o pagamento diretamente na API do Mercado Pago e, somente se estiver `approved`, com valor R$ 30 e método Pix, atualiza `users/{uid}`;
7. `premiumUntil` recebe mais 30 dias e o conteúdo Premium é liberado;
8. uma função agendada rebaixa planos vencidos para `free`, e as regras do Firestore também verificam `premiumUntil` em cada leitura.

## Secrets obrigatórios
Nunca grave estes valores em arquivos do repositório.

```bash
firebase functions:secrets:set MERCADO_PAGO_ACCESS_TOKEN
firebase functions:secrets:set MERCADO_PAGO_WEBHOOK_SECRET
```

O primeiro valor é o Access Token privado da aplicação do Mercado Pago. O segundo é a chave secreta exibida na configuração de Webhooks da aplicação.

## Webhook
Após o deploy, configure o evento **Pagamentos** no painel do Mercado Pago para:

```text
https://southamerica-east1-rota-pmmg-2027.cloudfunctions.net/mercadoPagoWebhook
```

A função valida `x-signature` e `x-request-id` antes de processar o pagamento.

## Deploy
Na raiz do repositório, com Firebase CLI autenticado no projeto correto:

```bash
cd functions
npm install
cd ..
firebase use rota-pmmg-2027
firebase deploy --only functions
```

As regras de Firestore com expiração do Premium são mantidas no repositório privado `rota-pmmg-conteudo/security` e devem ser publicadas junto do lançamento.

## Teste de lançamento
1. abrir o site como usuário grátis;
2. entrar com Google;
3. clicar em **Assinar Premium com Pix**;
4. informar CPF de teste/produção conforme o ambiente do Mercado Pago;
5. gerar o Pix de R$ 30,00;
6. pagar e confirmar que o webhook atualiza `users/{uid}` para `plan: premium` e grava `premiumUntil`;
7. confirmar acesso a Estudar, Praticar e Simulados;
8. confirmar que um `premiumUntil` vencido bloqueia o conteúdo mesmo antes da rotina diária de expiração.
