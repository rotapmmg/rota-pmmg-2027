"use strict";

(() => {
  const lessons = window.PMMG_LESSONS || {};
  const additions = {
    "Inglês::Verb to be": {
      sections: [{ title: "🎯 Pegadinhas de prova", html: "<p><strong>To be</strong> não usa do/does para formar pergunta ou negativa: <em>Is he ready?</em>, e não <em>Does he be ready?</em>.</p><p><strong>There is/there are</strong> indicam existência. <em>There is a problem</em> = há um problema; <em>there are two officers</em> = há dois policiais.</p><p><strong>Exemplo resolvido:</strong> ‘The candidates ___ prepared.’ O sujeito é plural, portanto: <strong>are</strong>.</p>" }],
      flashcards: [{ question: "To be usa do/does em perguntas?", answer: "Não. O próprio verbo vai para antes do sujeito: Is she...? Are they...?" }],
      questions: [{ prompt: "Complete corretamente: There ___ two cars outside.", options: ["is", "are", "am", "be"], correct: 1, explanation: "Two cars é plural; por isso usamos there are." }]
    },
    "Inglês::Present simple": {
      sections: [{ title: "🎯 Terceira pessoa e leitura", html: "<p>A terceira pessoa é uma fonte clássica de erro: <em>he works</em>, mas <em>does he work?</em> e <em>he does not work</em>. O <strong>-s</strong> aparece uma única vez.</p><p>Advérbios como <em>usually, often, never</em> ajudam a identificar rotina. Com o verbo to be, eles normalmente vêm depois: <em>She is always ready</em>.</p>" }],
      flashcards: [{ question: "Por que ‘Does he works?’ está errado?", answer: "Porque does já marca a terceira pessoa; o verbo principal fica na forma base: Does he work?" }],
      questions: [{ prompt: "Assinale a frase correta:", options: ["He doesn't studies at night.", "He doesn't study at night.", "He don't study at night.", "He not studies at night."], correct: 1, explanation: "Com he, usa-se doesn't e o verbo principal volta à forma base: study." }]
    },
    "Inglês::Past simple": {
      sections: [{ title: "🎯 Did + forma base", html: "<p>Nas negativas e perguntas, <strong>did</strong> já carrega a marca de passado. Assim: <em>Did she go?</em> e <em>She didn't go</em>, nunca <em>did she went</em>.</p><p><strong>Exemplo resolvido:</strong> ‘They ___ the suspect yesterday.’ Com o verbo <em>see</em>, o passado afirmativo é <strong>saw</strong>.</p>" }],
      flashcards: [{ question: "Depois de did, usamos went ou go?", answer: "Go. Depois de did, o verbo principal fica na forma base." }],
      questions: [{ prompt: "Qual pergunta está correta?", options: ["Did you saw him?", "Did you see him?", "Do you saw him?", "Were you see him?"], correct: 1, explanation: "Did marca o passado e see permanece na forma base." }]
    },
    "Inglês::Future": {
      sections: [{ title: "🎯 Will x going to", html: "<p><strong>Will</strong> é frequente em decisões tomadas no momento, promessas e previsões. <strong>Be going to</strong> é comum em planos/intenção já existentes e previsões baseadas em evidência.</p><p><strong>Exemplo:</strong> Look at those clouds! It is going to rain. A evidência presente favorece <em>going to</em>.</p>" }],
      flashcards: [{ question: "Qual futuro costuma indicar plano já decidido?", answer: "Be going to." }],
      questions: [{ prompt: "Look at the dark clouds! It ___ rain.", options: ["is going to", "did", "has", "was"], correct: 0, explanation: "Há evidência presente (nuvens escuras), uso típico de be going to." }]
    },
    "Inglês::Vocabulário": {
      sections: [{ title: "🧠 Cognatos e falsos cognatos", html: "<p>Cognatos ajudam na leitura: <em>important, different, information</em>. Mas falsos cognatos exigem atenção: <strong>actually</strong> = na verdade/realmente, não atualmente; <strong>pretend</strong> = fingir, não pretender; <strong>parents</strong> = pais, não parentes.</p><p>Em prova, tente inferir a palavra pelo contexto antes de traduzir isoladamente.</p>" }],
      flashcards: [{ question: "O que significa actually?", answer: "Na verdade/realmente; não significa atualmente." }],
      questions: [{ prompt: "Em inglês, ‘parents’ significa:", options: ["parentes", "pais", "padrinhos", "amigos"], correct: 1, explanation: "Parents é um falso cognato e significa pais." }]
    },
    "Inglês::Reading": {
      sections: [{ title: "🔎 Estratégia de interpretação", html: "<p>Comece identificando tema, finalidade e ideia central. Depois procure palavras-chave da pergunta no texto e observe conectores: <em>but/however</em> indicam contraste; <em>because</em>, causa; <em>therefore</em>, consequência.</p><p><strong>Pegadinha:</strong> a alternativa pode repetir palavras do texto e ainda estar errada. O que vale é o sentido global e a relação entre as ideias.</p>" }],
      flashcards: [{ question: "O que however normalmente indica?", answer: "Contraste ou oposição entre ideias." }],
      questions: [{ prompt: "O conector ‘therefore’ introduz normalmente uma ideia de:", options: ["oposição", "consequência", "exemplo", "tempo"], correct: 1, explanation: "Therefore equivale a portanto/por conseguinte e introduz consequência ou conclusão." }]
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
