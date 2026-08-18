(() => {
  "use strict";

  const DEFAULT_BATCH_SIZE = 20;
  const $ = (selector, root = document) => root.querySelector(selector);
  const escapeHtml = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const optionText = option => typeof option === "string" ? option : String(option?.text ?? "");
  const optionId = (option, index) => typeof option === "object" && option?.id ? String(option.id) : String.fromCharCode(65 + index);

  const LOCAL_QUESTION_BANK = {
    "Matemática e Raciocínio Lógico": [
      ["mat-local-1", "Quanto é 3/4 + 1/6?", ["5/10", "11/12", "4/10", "7/12"], "B", "O MMC de 4 e 6 é 12. Assim, 3/4 = 9/12 e 1/6 = 2/12; soma = 11/12."],
      ["mat-local-2", "Um produto de R$ 250 recebe desconto de 20%. Qual o novo preço?", ["R$ 180", "R$ 190", "R$ 200", "R$ 210"], "C", "20% de 250 = 50. Portanto, 250 - 50 = 200."],
      ["mat-local-3", "Se 5 agentes realizam uma tarefa em 12 horas, mantendo o mesmo ritmo, 10 agentes realizam em:", ["3 h", "6 h", "12 h", "24 h"], "B", "Quantidade de agentes e tempo são inversamente proporcionais. Dobrar os agentes reduz o tempo pela metade."],
      ["mat-local-4", "Resolva: 3x - 7 = 20.", ["7", "8", "9", "10"], "C", "3x = 27, logo x = 9."],
      ["mat-local-5", "A média de 6, 8, 10 e 12 é:", ["8", "9", "10", "11"], "B", "A soma é 36 e há 4 valores: 36/4 = 9."],
      ["mat-local-6", "Ao lançar um dado honesto, a probabilidade de sair número par é:", ["1/6", "1/3", "1/2", "2/3"], "C", "Há 3 resultados pares entre 6 possíveis: 3/6 = 1/2."],
      ["mat-local-7", "A negação de 'Todos os candidatos estudaram' é:", ["Nenhum candidato estudou", "Algum candidato não estudou", "Todos não estudaram", "Algum candidato estudou"], "B", "A negação de uma afirmação universal exige pelo menos um contraexemplo."],
      ["mat-local-8", "Se 4 cadernos custam R$ 36, 7 cadernos custam, no mesmo preço unitário:", ["R$ 54", "R$ 60", "R$ 63", "R$ 72"], "C", "Cada caderno custa R$ 9; 7 × 9 = R$ 63."]
    ],
    "Inglês": [
      ["ing-local-1", "Complete: She ___ ready for the test.", ["am", "is", "are", "be"], "B", "Com she, a forma correta do verbo to be é is."],
      ["ing-local-2", "Choose the correct sentence:", ["He don't work here.", "He doesn't works here.", "He doesn't work here.", "He not work here."], "C", "Com he usa-se doesn't e o verbo principal fica na forma base."],
      ["ing-local-3", "Complete: Did they ___ the officer yesterday?", ["saw", "see", "seen", "sees"], "B", "Depois de did, o verbo principal fica na forma base: see."],
      ["ing-local-4", "The word 'however' usually expresses:", ["cause", "contrast", "time", "addition only"], "B", "However introduz contraste/oposição, equivalente a 'porém/contudo'."],
      ["ing-local-5", "In English, 'parents' means:", ["parentes", "pais", "primos", "padrinhos"], "B", "Parents é falso cognato e significa pais."],
      ["ing-local-6", "Look at those clouds! It ___ rain.", ["is going to", "did", "has", "was"], "A", "Uma previsão baseada em evidência presente favorece be going to."],
      ["ing-local-7", "Complete: They ___ at home yesterday.", ["was", "were", "are", "be"], "B", "No passado do verbo to be, they exige were."],
      ["ing-local-8", "The connector 'therefore' normally introduces:", ["contrast", "consequence", "doubt", "place"], "B", "Therefore significa portanto/por conseguinte e indica consequência ou conclusão."]
    ],
    "Literatura": [
      ["lit-local-1", "Antíteses, paradoxos e conflito entre corpo e alma são marcas frequentes do:", ["Arcadismo", "Barroco", "Realismo", "Parnasianismo"], "B", "O Barroco explora contrastes e tensões, inclusive entre matéria e espírito."],
      ["lit-local-2", "A valorização da natureza idealizada e da vida simples caracteriza o:", ["Arcadismo", "Naturalismo", "Simbolismo", "Realismo"], "A", "O Arcadismo reage ao rebuscamento barroco e valoriza equilíbrio e ambiente pastoril."],
      ["lit-local-3", "Determinismo, hereditariedade e influência do meio aproximam uma obra do:", ["Romantismo", "Naturalismo", "Classicismo", "Simbolismo"], "B", "Esses elementos são centrais na visão naturalista."],
      ["lit-local-4", "Musicalidade, sugestão e sinestesia são características do:", ["Simbolismo", "Parnasianismo", "Humanismo", "Realismo"], "A", "O Simbolismo privilegia sugestão, musicalidade e efeitos sensoriais."],
      ["lit-local-5", "Autor e narrador:", ["são sempre a mesma pessoa", "nunca podem ter relação", "pertencem a níveis distintos da análise", "são sinônimos"], "C", "O narrador é uma construção textual; não deve ser automaticamente identificado com o autor."],
      ["lit-local-6", "O momento de maior tensão de uma narrativa é chamado de:", ["epígrafe", "clímax", "prefácio", "desfecho obrigatório"], "B", "Clímax é o ponto de maior tensão do conflito narrativo."],
      ["lit-local-7", "Uma interpretação literária consistente deve principalmente:", ["depender só da opinião do leitor", "ser sustentada por evidências textuais", "ignorar a linguagem", "usar apenas a biografia do autor"], "B", "A leitura interpretativa precisa ser sustentada por marcas do próprio texto."],
      ["lit-local-8", "Ruptura estética e aproximação com linguagem cotidiana são associadas ao:", ["Modernismo", "Trovadorismo", "Arcadismo", "Classicismo"], "A", "O Modernismo amplia a liberdade formal e rompe convenções tradicionais."]
    ],
    "Português": [
      ["por-local-1", "Quando o texto não afirma algo diretamente, mas fornece pistas suficientes para concluir, ocorre:", ["pleonasmo", "inferência", "ambiguidade obrigatória", "citação"], "B", "Inferência é uma conclusão construída a partir de pistas textuais."],
      ["por-local-2", "Se o texto afirma 'alguns candidatos', a alternativa 'todos os candidatos' comete:", ["generalização", "sinonímia", "eufemismo", "elipse"], "A", "A alternativa amplia indevidamente o alcance da afirmação original."],
      ["por-local-3", "A ideia principal de um texto corresponde:", ["ao menor detalhe", "à mensagem central", "sempre ao título", "apenas ao último período"], "B", "A ideia principal organiza os detalhes e informações secundárias."],
      ["por-local-4", "Em interpretação, a resposta correta deve:", ["basear-se apenas na opinião pessoal", "ser sustentada pelo texto", "sempre repetir literalmente uma frase", "ignorar o contexto"], "B", "Mesmo inferências precisam encontrar apoio nas informações e relações presentes no texto."]
    ]
  };

  function normalizeLocalQuestion(subject, item, index) {
    const [id, question, options, correctOptionId, explanation] = item;
    return { id, subject, question, options, correctOptionId, explanation, module: "Revisão comentada", lessonTitle: `Questão extra ${index + 1}`, active: true, local: true };
  }

  function localQuestionsFor(subject) {
    return (LOCAL_QUESTION_BANK[subject] || []).map((item, index) => normalizeLocalQuestion(subject, item, index));
  }

  function mergeQuestions(remote, local) {
    const map = new Map();
    [...remote, ...local].forEach(question => {
      const key = String(question.id || `${question.subject}-${question.question}`);
      if (!map.has(key)) map.set(key, question);
    });
    return [...map.values()];
  }

  async function waitForPracticeSection() {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const section = $("#premiumPracticeSection");
      if (section && window.firebaseSync) return section;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return null;
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }
    return copy;
  }

  function renderLocked(host, message) {
    host.innerHTML = `<div class="premium-empty-state"><span class="premium-empty-icon">🔒</span><h3>Banco de questões Premium</h3><p class="muted">${escapeHtml(message)}</p></div>`;
  }

  function renderQuestionBatch(host, allQuestions, subject) {
    const batch = shuffle(allQuestions).slice(0, Math.min(DEFAULT_BATCH_SIZE, allQuestions.length));
    const answers = new Map();
    host.innerHTML = `<div class="premium-practice-toolbar"><button class="ghost-btn" id="premiumPracticeBack" type="button">← Trocar disciplina</button><button class="ghost-btn" id="premiumNewBatch" type="button">↻ Nova bateria</button></div><div class="premium-section-intro"><div><span class="eyebrow">PRATICAR • ${escapeHtml(subject)}</span><h3>Bateria de ${batch.length} questões</h3><p class="muted">Banco disponível nesta disciplina: ${allQuestions.length} questão${allQuestions.length === 1 ? "" : "ões"}. O gabarito comentado aparece após a correção.</p></div></div><div class="premium-question-list">${batch.map((question, questionIndex) => { const options = Array.isArray(question.options) ? question.options : []; const context = [question.module, question.lessonTitle].filter(Boolean).join(" • "); return `<article class="premium-question-card" data-premium-question-card="${escapeHtml(question.id)}">${context ? `<small class="premium-question-context">${escapeHtml(context)}</small>` : ""}<strong class="premium-question-title">${questionIndex + 1}. ${escapeHtml(question.question)}</strong><div class="premium-option-list">${options.map((option, optionIndex) => { const id = optionId(option, optionIndex); return `<button class="premium-option-button" type="button" data-premium-question-id="${escapeHtml(question.id)}" data-premium-option-id="${escapeHtml(id)}" aria-pressed="false"><strong>${escapeHtml(id)}.</strong><span>${escapeHtml(optionText(option))}</span></button>`; }).join("")}</div><div data-premium-feedback="${escapeHtml(question.id)}" class="premium-question-feedback" hidden></div></article>`; }).join("")}</div><button class="primary-btn premium-grade-button" id="premiumGradeQuestions" type="button">Corrigir bateria</button><div id="premiumQuestionResult" class="premium-question-result" hidden></div>`;

    host.querySelectorAll("[data-premium-question-id]").forEach(button => button.addEventListener("click", () => {
      const questionId = button.dataset.premiumQuestionId; const selectedOptionId = button.dataset.premiumOptionId; answers.set(questionId, selectedOptionId);
      host.querySelectorAll(`[data-premium-question-id="${CSS.escape(questionId)}"]`).forEach(optionButton => { const selected = optionButton.dataset.premiumOptionId === selectedOptionId; optionButton.setAttribute("aria-pressed", selected ? "true" : "false"); optionButton.classList.toggle("selected", selected); });
      const feedback = host.querySelector(`[data-premium-feedback="${CSS.escape(questionId)}"]`); if (feedback) feedback.hidden = true; const result = $("#premiumQuestionResult", host); if (result) result.hidden = true;
    }));

    $("#premiumGradeQuestions", host)?.addEventListener("click", () => {
      let score = 0;
      batch.forEach(question => { const selected = answers.get(question.id); const correct = String(question.correctOptionId ?? ""); const isCorrect = selected === correct; if (isCorrect) score += 1; const feedback = host.querySelector(`[data-premium-feedback="${CSS.escape(question.id)}"]`); if (!feedback) return; const options = Array.isArray(question.options) ? question.options : []; const correctOption = options.find((option, index) => optionId(option, index) === correct); const correctText = optionText(correctOption); feedback.hidden = false; feedback.classList.toggle("correct", Boolean(selected && isCorrect)); feedback.classList.toggle("incorrect", Boolean(selected && !isCorrect)); feedback.innerHTML = selected ? `<strong>${isCorrect ? "✅ Correto" : `❌ Incorreto — resposta correta: ${escapeHtml(correct)}`}</strong><p>${escapeHtml(correctText)}</p><small>${escapeHtml(question.explanation || "")}</small>` : `<strong>⚠️ Não respondida — resposta correta: ${escapeHtml(correct)}</strong><p>${escapeHtml(correctText)}</p><small>${escapeHtml(question.explanation || "")}</small>`; });
      const result = $("#premiumQuestionResult", host); if (result) { const percentage = Math.round((score / batch.length) * 100); result.hidden = false; result.innerHTML = `<span>Resultado da bateria</span><strong>${score}/${batch.length}</strong><b>${percentage}% de acertos</b>`; result.scrollIntoView({ behavior: "smooth", block: "center" }); }
    });
    $("#premiumPracticeBack", host)?.addEventListener("click", () => void mountPractice());
    $("#premiumNewBatch", host)?.addEventListener("click", () => { renderQuestionBatch(host, allQuestions, subject); host.scrollIntoView({ behavior: "smooth", block: "start" }); });
  }

  async function openSubject(host, subject, button) {
    if (button) button.disabled = true;
    host.innerHTML = `<div class="premium-empty-state"><span class="premium-empty-icon">✍️</span><h3>Carregando questões de ${escapeHtml(subject)}…</h3><p class="muted">Montando uma bateria comentada.</p></div>`;
    try {
      let remoteQuestions = [];
      try { remoteQuestions = await window.firebaseSync.loadPremiumQuestionsBySubject(subject); } catch (error) { console.warn("Banco remoto indisponível; usando questões locais:", error); }
      const questions = mergeQuestions(remoteQuestions, localQuestionsFor(subject));
      if (!questions.length) { host.innerHTML = `<div class="premium-empty-state"><span class="premium-empty-icon">✍️</span><h3>Nenhuma questão encontrada</h3><p class="muted">Ainda não há questões publicadas para ${escapeHtml(subject)}.</p><button class="ghost-btn" id="premiumPracticeBack" type="button">← Voltar</button></div>`; $("#premiumPracticeBack", host)?.addEventListener("click", () => void mountPractice()); return; }
      renderQuestionBatch(host, questions, subject);
    } finally { if (button) button.disabled = false; }
  }

  function renderSubjects(host, lessons) {
    const remoteSubjects = lessons.filter(lesson => lesson.active !== false).map(lesson => String(lesson.subject || "").trim()).filter(Boolean);
    const subjects = [...new Set([...remoteSubjects, ...Object.keys(LOCAL_QUESTION_BANK)])];
    host.innerHTML = `<div class="premium-section-intro"><div><span class="eyebrow">PRATICAR</span><h3>Banco de questões por disciplina</h3><p class="muted">Escolha a matéria. As baterias misturam o banco publicado com novas questões comentadas de revisão.</p></div></div><div class="premium-practice-subjects">${subjects.map(subject => `<button class="premium-practice-subject" type="button" data-premium-practice-subject="${escapeHtml(subject)}"><span>✍️</span><strong>${escapeHtml(subject)}</strong><small>Abrir banco de questões</small></button>`).join("")}</div>`;
    host.querySelectorAll("[data-premium-practice-subject]").forEach(button => button.addEventListener("click", () => void openSubject(host, button.dataset.premiumPracticeSubject, button)));
  }

  async function mountPractice() {
    const host = await waitForPracticeSection(); if (!host) return;
    host.innerHTML = `<div class="premium-empty-state"><span class="premium-empty-icon">✍️</span><h3>Carregando banco de questões…</h3><p class="muted">Verificando seu acesso Premium.</p></div>`;
    try {
      const user = await window.firebaseSync.getCurrentFirebaseUser(); if (!user) { renderLocked(host, "Entre com Google para acessar o banco de questões Premium."); return; }
      const plan = await window.firebaseSync.loadUserPlan(); if (plan !== "premium") { renderLocked(host, "Sua conta está no plano Grátis. O banco completo permanece bloqueado."); return; }
      let lessons = []; try { lessons = await window.firebaseSync.loadPremiumLessons(); } catch (error) { console.warn("Catálogo remoto indisponível; exibindo disciplinas locais:", error); }
      renderSubjects(host, lessons);
    } catch (error) { console.error("Não foi possível carregar a prática Premium:", error); renderLocked(host, "Não foi possível carregar o banco de questões agora."); }
  }

  async function init() {
    await mountPractice();
    if (window.firebaseSync?.observeFirebaseUser) window.firebaseSync.observeFirebaseUser(() => setTimeout(() => void mountPractice(), 0)).catch(error => console.error("Não foi possível observar o acesso Premium:", error));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
