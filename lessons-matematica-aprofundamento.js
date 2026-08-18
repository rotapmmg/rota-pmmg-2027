"use strict";

window.PMMG_LESSONS = window.PMMG_LESSONS || {};

(() => {
  const SUBJECT = "Matemática e Raciocínio Lógico";

  function extend(topic, payload) {
    const key = `${SUBJECT}::${topic}`;
    const lesson = window.PMMG_LESSONS[key];
    if (!lesson) return;

    lesson.sections = [...(lesson.sections || []), ...(payload.sections || [])];
    lesson.flashcards = [...(lesson.flashcards || []), ...(payload.flashcards || [])];
    lesson.questions = [...(lesson.questions || []), ...(payload.questions || [])];
  }

  extend("Operações e frações", {
    sections: [
      {
        title: "🧠 Pegadinhas com sinais e prioridade",
        html: `<p>Em prova, o erro mais comum não é a conta difícil, mas a <strong>ordem errada das operações</strong>.</p>
        <p><strong>Exemplo resolvido:</strong> -3² + (-3)².</p>
        <ol><li>-3² = -(3²) = -9;</li><li>(−3)² = 9;</li><li>logo, -9 + 9 = 0.</li></ol>
        <p><strong>Pegadinha:</strong> o sinal negativo só faz parte da base quando está dentro dos parênteses.</p>`
      },
      {
        title: "🔍 Fração de uma quantidade",
        html: `<p>Para calcular uma fração de um total, multiplique o total pelo numerador e divida pelo denominador.</p>
        <p><strong>Exemplo:</strong> 3/5 de 240 = 240 × 3 ÷ 5 = 144.</p>
        <p>Uma estratégia mental eficiente é dividir primeiro: 240 ÷ 5 = 48; depois 48 × 3 = 144.</p>`
      }
    ],
    flashcards: [
      { question: "Qual a diferença entre -4² e (-4)²?", answer: "-4² = -16; (-4)² = 16." },
      { question: "Como calcular 3/5 de 200 rapidamente?", answer: "Divida 200 por 5 e multiplique por 3: 40 × 3 = 120." }
    ],
    questions: [
      {
        prompt: "O valor de -3² + (-3)² é:",
        options: ["-18", "0", "9", "18"],
        correct: 1,
        explanation: "Sem parênteses, -3² = -9. Com parênteses, (-3)² = 9. A soma é zero."
      },
      {
        prompt: "Três quintos de 350 correspondem a:",
        options: ["140", "180", "210", "250"],
        correct: 2,
        explanation: "350 ÷ 5 = 70 e 70 × 3 = 210."
      }
    ]
  });

  extend("Porcentagem", {
    sections: [
      {
        title: "🎯 Encontrando o valor original",
        html: `<p>Quando o enunciado fornece o valor <strong>depois</strong> de um aumento ou desconto, não basta retirar a mesma porcentagem.</p>
        <p><strong>Exemplo:</strong> após desconto de 20%, um produto custa R$ 240.</p>
        <p>O preço final representa 80% do original: 0,80 × V = 240. Logo, V = 300.</p>`
      },
      {
        title: "⚠️ Aumento e desconto não se anulam",
        html: `<p>Um aumento de 25% seguido de desconto de 20% retorna exatamente ao valor inicial, pois 1,25 × 0,80 = 1.</p>
        <p>Já aumento e desconto de mesma taxa normalmente <strong>não</strong> se anulam.</p>`
      }
    ],
    flashcards: [
      { question: "Se R$ 240 representam 80% do preço original, qual era o preço?", answer: "R$ 300." },
      { question: "Aumento de 25% seguido de desconto de 20% altera o valor?", answer: "Não. Os fatores 1,25 e 0,80 se compensam exatamente." }
    ],
    questions: [
      {
        prompt: "Após desconto de 20%, um produto custa R$ 240. O preço original era:",
        options: ["R$ 260", "R$ 288", "R$ 300", "R$ 320"],
        correct: 2,
        explanation: "O preço final é 80% do original: 240/0,80 = 300."
      },
      {
        prompt: "Um valor aumenta 25% e depois sofre desconto de 20%. Em relação ao valor inicial, ele:",
        options: ["Aumenta 5%", "Diminui 5%", "Permanece igual", "Aumenta 10%"],
        correct: 2,
        explanation: "1,25 × 0,80 = 1. O valor final é igual ao inicial."
      }
    ]
  });

  extend("Razão e proporção", {
    sections: [
      {
        title: "🧩 Razão parte-parte e parte-todo",
        html: `<p>Se uma turma tem homens e mulheres na razão 3:5, isso significa 3 partes de homens para 5 de mulheres, totalizando 8 partes.</p>
        <p>Se a turma possui 40 pessoas, cada parte vale 5. Assim, há 15 homens e 25 mulheres.</p>
        <p><strong>Pegadinha:</strong> 3:5 não significa que homens sejam 3/5 do total; eles são 3/8 do total.</p>`
      },
      {
        title: "🔄 Proporção com constante",
        html: `<p>Em grandezas diretamente proporcionais, y/x é constante. Em grandezas inversamente proporcionais, x·y é constante.</p>
        <p>Identificar essa constante pode resolver questões mais rápido do que montar uma regra de três completa.</p>`
      }
    ],
    flashcards: [
      { question: "Na razão 3:5, quantas partes existem no total?", answer: "8 partes." },
      { question: "Qual expressão fica constante em grandezas inversamente proporcionais?", answer: "O produto dos valores correspondentes." }
    ],
    questions: [
      {
        prompt: "Em um grupo, homens e mulheres estão na razão 3:5. Se há 64 pessoas, o número de homens é:",
        options: ["18", "24", "32", "40"],
        correct: 1,
        explanation: "São 8 partes. Cada parte vale 64/8 = 8; homens = 3×8 = 24."
      },
      {
        prompt: "Se x e y são inversamente proporcionais e x = 4 quando y = 15, então, para x = 10, y vale:",
        options: ["4", "6", "8", "12"],
        correct: 1,
        explanation: "O produto é constante: 4×15 = 60. Assim, 10y = 60 e y = 6."
      }
    ]
  });

  extend("Regra de três", {
    sections: [
      {
        title: "🧭 Método seguro para regra de três composta",
        html: `<p>Escolha a grandeza da incógnita como referência. Depois compare cada outra grandeza com ela, uma por vez.</p>
        <ul><li>Se aumentar uma faz a incógnita aumentar, a relação é direta.</li><li>Se aumentar uma faz a incógnita diminuir, a relação é inversa.</li></ul>
        <p>Só depois monte a proporção. Isso reduz erros de inversão.</p>`
      },
      {
        title: "🧮 Exemplo composto resolvido",
        html: `<p>6 trabalhadores, 8 h/dia, concluem uma tarefa em 10 dias. Quantos dias levarão 12 trabalhadores trabalhando 5 h/dia?</p>
        <p>Mais trabalhadores → menos dias (inversa). Mais horas por dia → menos dias (inversa).</p>
        <p>x = 10 × (6/12) × (8/5) = 8 dias.</p>`
      }
    ],
    flashcards: [
      { question: "Na regra de três composta, com qual grandeza devemos comparar as demais?", answer: "Com a grandeza que contém a incógnita." },
      { question: "Mais horas de trabalho por dia reduzem os dias necessários. A relação é?", answer: "Inversa." }
    ],
    questions: [
      {
        prompt: "6 trabalhadores, a 8 h/dia, fazem uma tarefa em 10 dias. 12 trabalhadores, a 5 h/dia, farão em:",
        options: ["6 dias", "8 dias", "10 dias", "12 dias"],
        correct: 1,
        explanation: "x = 10 × (6/12) × (8/5) = 8 dias."
      },
      {
        prompt: "Se 4 máquinas produzem 1.200 peças em 3 horas, 6 máquinas iguais produzirão em 5 horas:",
        options: ["2.000", "2.400", "3.000", "3.600"],
        correct: 2,
        explanation: "Produção é direta com máquinas e tempo: 1200 × (6/4) × (5/3) = 3000."
      }
    ]
  });

  extend("Equações", {
    sections: [
      {
        title: "📖 Transformando texto em equação",
        html: `<p>Muitas questões escondem a equação dentro de uma frase.</p>
        <p><strong>Exemplo:</strong> “o dobro de um número, somado a 7, é 31” vira 2x + 7 = 31.</p>
        <p>Então 2x = 24 e x = 12.</p>`
      },
      {
        title: "⚠️ Cuidado com distribuição de sinal",
        html: `<p>Em -(x - 4), o sinal negativo multiplica todos os termos: -x + 4.</p>
        <p><strong>Pegadinha:</strong> 3 - (2x - 5) = 3 - 2x + 5 = 8 - 2x.</p>`
      }
    ],
    flashcards: [
      { question: "Como escrever 'o triplo de x menos 5'?", answer: "3x - 5." },
      { question: "Quanto vale -(x - 7)?", answer: "-x + 7." }
    ],
    questions: [
      {
        prompt: "O dobro de um número, somado a 7, é 31. Esse número é:",
        options: ["10", "12", "14", "19"],
        correct: 1,
        explanation: "2x + 7 = 31; 2x = 24; x = 12."
      },
      {
        prompt: "A expressão 5 - (2x - 3) simplifica-se para:",
        options: ["2 - 2x", "8 - 2x", "8 + 2x", "2x + 2"],
        correct: 1,
        explanation: "O sinal de menos troca os sinais dentro dos parênteses: 5 - 2x + 3 = 8 - 2x."
      }
    ]
  });

  extend("Estatística", {
    sections: [
      {
        title: "📉 Efeito de valores extremos",
        html: `<p>A média é sensível a valores muito altos ou muito baixos; a mediana é mais resistente.</p>
        <p><strong>Exemplo:</strong> salários 2, 2, 2, 2 e 20 mil. A média é 5,6 mil, mas a mediana é 2 mil.</p>
        <p>Em distribuições com extremos, a mediana pode representar melhor o valor típico.</p>`
      },
      {
        title: "🧠 Média após alteração de um valor",
        html: `<p>Se a média de n valores aumenta em k unidades, a soma total aumenta em n·k.</p>
        <p><strong>Exemplo:</strong> média de 10 alunos sobe 2 pontos; a soma das notas aumentou 20 pontos.</p>`
      }
    ],
    flashcards: [
      { question: "Qual medida é mais afetada por valores extremos: média ou mediana?", answer: "A média." },
      { question: "Se a média de 8 valores aumenta 3, quanto aumenta a soma?", answer: "24." }
    ],
    questions: [
      {
        prompt: "A média de 10 valores aumenta de 6 para 8. A soma total dos valores aumentou em:",
        options: ["2", "10", "20", "80"],
        correct: 2,
        explanation: "A média aumentou 2 em 10 valores; a soma aumenta 10×2 = 20."
      },
      {
        prompt: "No conjunto 2, 2, 3, 3, 30, a medida menos afetada pelo valor 30 é:",
        options: ["Média", "Mediana", "Amplitude", "Soma"],
        correct: 1,
        explanation: "A mediana depende da posição central e é mais resistente a valores extremos."
      }
    ]
  });

  extend("Probabilidade", {
    sections: [
      {
        title: "🎯 Probabilidade de pelo menos um",
        html: `<p>Questões com “pelo menos um” costumam ser mais fáceis pelo evento complementar.</p>
        <p><strong>Exemplo:</strong> ao lançar duas moedas, probabilidade de pelo menos uma cara = 1 - P(nenhuma cara).</p>
        <p>P(nenhuma cara) = 1/4. Logo, a resposta é 3/4.</p>`
      },
      {
        title: "🚫 Independência não é exclusão",
        html: `<p>Eventos independentes podem ocorrer juntos. Eventos mutuamente exclusivos não podem ocorrer simultaneamente.</p>
        <p>Essa diferença é uma pegadinha clássica em provas de raciocínio lógico e probabilidade.</p>`
      }
    ],
    flashcards: [
      { question: "Qual estratégia é útil para 'pelo menos um'?", answer: "Calcular 1 menos a probabilidade de nenhum ocorrer." },
      { question: "Eventos independentes são necessariamente mutuamente exclusivos?", answer: "Não." }
    ],
    questions: [
      {
        prompt: "Ao lançar duas moedas, a probabilidade de obter pelo menos uma cara é:",
        options: ["1/4", "1/2", "3/4", "1"],
        correct: 2,
        explanation: "Use o complementar: 1 - P(duas coroas) = 1 - 1/4 = 3/4."
      },
      {
        prompt: "Sobre eventos independentes, é correto afirmar que:",
        options: ["Nunca podem ocorrer juntos", "A ocorrência de um não altera a probabilidade do outro", "Sempre têm a mesma probabilidade", "Sua união é sempre impossível"],
        correct: 1,
        explanation: "Independência significa que conhecer a ocorrência de um evento não muda a probabilidade do outro."
      }
    ]
  });

  extend("Lógica", {
    sections: [
      {
        title: "🧠 Condição suficiente e necessária",
        html: `<p>Na condicional “se p, então q”, p é condição <strong>suficiente</strong> para q, e q é condição <strong>necessária</strong> para p.</p>
        <p><strong>Pegadinha:</strong> não é válido inverter automaticamente. De p → q não se conclui q → p.</p>`
      },
      {
        title: "🔁 Negação da condicional",
        html: `<p>A negação de “se p, então q” é <strong>p e não q</strong>.</p>
        <p>Isso decorre do fato de a condicional ser falsa somente quando o antecedente é verdadeiro e o consequente é falso.</p>`
      },
      {
        title: "🧩 Argumentos clássicos",
        html: `<p><strong>Modus ponens:</strong> p → q; p; logo q.</p>
        <p><strong>Modus tollens:</strong> p → q; não q; logo não p.</p>
        <p>Já afirmar o consequente (p → q; q; logo p) é uma falácia.</p>`
      }
    ],
    flashcards: [
      { question: "Na proposição p → q, p é condição de que tipo para q?", answer: "Condição suficiente." },
      { question: "Qual é a negação de p → q?", answer: "p e não q." },
      { question: "O que é modus tollens?", answer: "De p → q e não q, concluir não p." }
    ],
    questions: [
      {
        prompt: "A negação de “Se estudo, então aprendo” é:",
        options: ["Não estudo e não aprendo", "Estudo e não aprendo", "Não estudo ou aprendo", "Se não estudo, então não aprendo"],
        correct: 1,
        explanation: "A negação de p → q é p ∧ ¬q: estudo e não aprendo."
      },
      {
        prompt: "Premissas: “Se chove, a rua molha” e “A rua não molhou”. Uma conclusão válida é:",
        options: ["Choveu", "Não choveu", "A rua secou", "Nada pode ser concluído"],
        correct: 1,
        explanation: "É modus tollens: p → q e ¬q implicam ¬p."
      },
      {
        prompt: "De p → q e q, concluir p é:",
        options: ["Modus ponens", "Modus tollens", "Falácia da afirmação do consequente", "Contraposição"],
        correct: 2,
        explanation: "A conclusão p não é garantida apenas porque q ocorreu."
      }
    ]
  });
})();
