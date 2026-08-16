import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.resolve(__dirname, "../data/premium-questions.json");

const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!rawCredentials) {
  throw new Error("Defina o secret FIREBASE_SERVICE_ACCOUNT com o JSON da conta de serviço do Firebase.");
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(rawCredentials);
} catch {
  throw new Error("FIREBASE_SERVICE_ACCOUNT não contém um JSON válido.");
}

const questions = JSON.parse(fs.readFileSync(dataPath, "utf8"));
if (!Array.isArray(questions) || questions.length === 0) {
  throw new Error("data/premium-questions.json deve conter um array com pelo menos uma questão.");
}

function validateQuestion(item, index) {
  const prefix = `Questão ${index + 1}`;
  if (!item || typeof item !== "object") throw new Error(`${prefix}: objeto inválido.`);
  if (!item.id || typeof item.id !== "string") throw new Error(`${prefix}: id obrigatório.`);
  if (!item.lessonId || typeof item.lessonId !== "string") throw new Error(`${prefix}: lessonId obrigatório.`);
  if (!Number.isInteger(item.order) || item.order < 1) throw new Error(`${prefix}: order deve ser inteiro >= 1.`);
  if (!item.question || typeof item.question !== "string") throw new Error(`${prefix}: question obrigatória.`);
  if (!Array.isArray(item.options) || item.options.length < 2) throw new Error(`${prefix}: options deve ter pelo menos 2 alternativas.`);

  const optionIds = new Set();
  for (const option of item.options) {
    if (!option || typeof option.id !== "string" || typeof option.text !== "string" || !option.text.trim()) {
      throw new Error(`${prefix}: cada alternativa precisa de id e text.`);
    }
    if (optionIds.has(option.id)) throw new Error(`${prefix}: id de alternativa duplicado (${option.id}).`);
    optionIds.add(option.id);
  }

  if (!optionIds.has(item.correctOptionId)) {
    throw new Error(`${prefix}: correctOptionId deve apontar para uma alternativa existente.`);
  }
}

questions.forEach(validateQuestion);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "rota-pmmg-2027"
});

const db = admin.firestore();
const CHUNK_SIZE = 400;
let imported = 0;

for (let start = 0; start < questions.length; start += CHUNK_SIZE) {
  const chunk = questions.slice(start, start + CHUNK_SIZE);
  const batch = db.batch();

  for (const item of chunk) {
    const { id, ...data } = item;
    const ref = db.collection("premiumQuestions").doc(id);
    batch.set(
      ref,
      {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  }

  await batch.commit();
  imported += chunk.length;
  console.log(`Importadas ${imported}/${questions.length} questões.`);
}

console.log(`Concluído: ${imported} questões gravadas em premiumQuestions.`);
