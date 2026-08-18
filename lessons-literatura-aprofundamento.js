"use strict";

(() => {
  const lessons = window.PMMG_LESSONS || {};
  const additions = {
    "Literatura::Escolas literárias": {
      sections: [{ title: "🎯 Como diferenciar escolas na questão", html: "<p>Em vez de decorar apenas datas, procure <strong>marcas textuais</strong>. Contrastes religiosos e linguagem rebuscada apontam para Barroco; natureza idealizada e equilíbrio, Arcadismo; subjetividade e idealização, Romantismo; crítica social e psicológica, Realismo; determinismo, Naturalismo; rigor formal, Parnasianismo; sugestão e musicalidade, Simbolismo.</p><p><strong>Pegadinha:</strong> uma obra pode apresentar traços que lembram outro período. A classificação depende do conjunto predominante de características e do projeto estético.</p>" }],
      flashcards: [{ question: "Qual diferença-chave entre Realismo e Naturalismo?", answer: "O Realismo enfatiza análise crítica e psicológica; o Naturalismo intensifica determinismo, meio, hereditariedade e visão biologizante." }],
      questions: [{ prompt: "Uma narrativa que enfatiza hereditariedade, meio social e comportamento condicionado aproxima-se do:", options: ["Arcadismo", "Naturalismo", "Simbolismo", "Classicismo"], correct: 1, explanation: "Determinismo, influência do meio e hereditariedade são marcas centrais do Naturalismo." }]
    },
    "Literatura::Leitura das obras do edital": {
      sections: [{ title: "📝 Método de revisão para prova", html: "<p>Ao terminar uma obra, faça uma ficha de uma página com: conflito central, personagens e relações, narrador/foco, espaço, tempo, temas, símbolos e cenas decisivas.</p><p>Depois transforme a ficha em perguntas: quem muda ao longo da obra? O narrador é confiável? Que conflito move o enredo? Qual cena altera a trajetória das personagens?</p><p><strong>Pegadinha:</strong> resumo de enredo não substitui análise de linguagem, narrador e construção de sentido.</p>" }],
      flashcards: [{ question: "O que revisar além do enredo?", answer: "Narrador, foco narrativo, linguagem, temas, símbolos, espaço, tempo e relações entre personagens." }],
      questions: [{ prompt: "Uma boa revisão de obra literária deve:", options: ["memorizar apenas o final", "integrar enredo, forma, narrador, temas e linguagem", "ignorar o narrador", "usar somente a biografia do autor"], correct: 1, explanation: "Questões literárias podem cobrar tanto acontecimentos quanto a maneira pela qual o texto constrói seus sentidos." }]
    },
    "Literatura::Autores e contexto": {
      sections: [{ title: "⚠️ Biografismo e determinismo", html: "<p>Contexto e biografia ajudam, mas não explicam automaticamente uma obra. Evite concluir que narrador = autor ou que toda personagem expressa a opinião pessoal do escritor.</p><p>O caminho seguro é relacionar contexto a elementos concretos do texto: escolhas de linguagem, conflitos, espaços representados, ironia, vozes narrativas e valores em disputa.</p>" }],
      flashcards: [{ question: "Narrador é sempre a voz pessoal do autor?", answer: "Não. O narrador é uma construção textual e pode defender valores diferentes dos do autor." }],
      questions: [{ prompt: "Ao relacionar obra e contexto histórico, o procedimento mais adequado é:", options: ["tratar o texto como simples reflexo da época", "ignorar o texto e estudar apenas datas", "relacionar contexto a evidências presentes na construção literária", "considerar narrador e autor sempre idênticos"], correct: 2, explanation: "O contexto ilumina a leitura quando é articulado a elementos efetivamente construídos no texto." }]
    },
    "Literatura::Interpretação": {
      sections: [{ title: "🔍 Forma também produz sentido", html: "<p>Na literatura, não basta perguntar <em>o que</em> é dito; é preciso observar <em>como</em> é dito. Ironia, metáfora, repetição, ritmo, ponto de vista e escolha vocabular alteram o sentido.</p><p>Em narrativas, diferencie fala de personagem, voz do narrador e avaliação implícita do texto. Em poemas, observe eu lírico, imagens, campos semânticos e efeitos sonoros.</p><p><strong>Pegadinha:</strong> interpretação válida precisa de evidência textual; opinião pessoal sem apoio no texto não resolve a questão.</p>" }],
      flashcards: [{ question: "O que sustenta uma interpretação em prova?", answer: "Evidências do próprio texto e relações coerentes entre forma, contexto e sentido." }],
      questions: [{ prompt: "Em interpretação literária, uma afirmação é mais defensável quando:", options: ["reflete apenas a opinião do leitor", "é apoiada por elementos do texto", "ignora recursos de linguagem", "contradiz o narrador sem justificativa"], correct: 1, explanation: "A interpretação deve ser sustentada por marcas linguísticas, estruturais e temáticas presentes no texto." }]
    }
  };

  Object.entries(additions).forEach(([key, extra]) => {
    const lesson = lessons[key];
    if (!lesson) return;
    lesson.sections = [...(lesson.sections || []), ...(extra.sections || [])];
    lesson.flashcards = [...(lesson.flashcards || []), ...(extra.flashcards || [])];
    lesson.questions = [...(lesson.questions || []), ...(extra.questions || [])];
  });
})();
