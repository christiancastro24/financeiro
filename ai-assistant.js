// ========== ASSISTENTE FINANCEIRO INTELIGENTE (SEM IA) ==========

let aiChatMessages = [];
let financialAnalysis = null;

// Inicializar o assistente
function initAIAssistant() {
  const chatButton = document.getElementById("aiChatButton");
  const chatWindow = document.getElementById("aiChatWindow");
  const chatClose = document.getElementById("aiChatClose");
  const chatSend = document.getElementById("aiChatSend");
  const chatInput = document.getElementById("aiChatInput");

  // Analisar dados ao iniciar
  financialAnalysis = analyzeFinancialData();

  // Abrir/Fechar chat
  chatButton.addEventListener("click", () => {
    chatWindow.classList.toggle("active");
    chatButton.classList.toggle("active");

    if (
      chatWindow.classList.contains("active") &&
      aiChatMessages.length === 0
    ) {
      showWelcomeMessage();
    }
  });

  chatClose.addEventListener("click", () => {
    chatWindow.classList.remove("active");
    chatButton.classList.remove("active");
  });

  // Enviar mensagem
  chatSend.addEventListener("click", sendAIMessage);

  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendAIMessage();
    }
  });
}

// Mensagem de boas-vindas com insights automáticos
function showWelcomeMessage() {
  const insights = generateAutoInsights();

  let welcomeText = "👋 Olá! Sou seu assistente financeiro inteligente.\n\n";
  welcomeText += "📊 Analisei seus dados e encontrei:\n\n";

  insights.slice(0, 3).forEach((insight, idx) => {
    welcomeText += `${idx + 1}. ${insight.title}\n`;
  });

  welcomeText += "\n💬 Pergunte-me qualquer coisa sobre suas finanças!";

  addAIMessage("assistant", welcomeText, true);
}

// Analisar dados financeiros completos
function analyzeFinancialData() {
  const transactions = JSON.parse(
    localStorage.getItem("financialData") || "[]"
  );
  const dreams = JSON.parse(localStorage.getItem("dreams") || "[]");
  const jornada100k = JSON.parse(
    localStorage.getItem("jornada100k_data") || "null"
  );

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Transações do mês atual
  const monthTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return (
      tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
    );
  });

  // Transações do mês anterior
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lastMonthTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return (
      tDate.getMonth() === lastMonth && tDate.getFullYear() === lastMonthYear
    );
  });

  // Calcular receitas e despesas
  const income = monthTransactions
    .filter((t) => t.type === "income" && t.paid)
    .reduce((sum, t) => sum + t.value, 0);

  const expenses = monthTransactions
    .filter((t) => t.type === "expense" && t.paid)
    .reduce((sum, t) => sum + t.value, 0);

  const lastMonthExpenses = lastMonthTransactions
    .filter((t) => t.type === "expense" && t.paid)
    .reduce((sum, t) => sum + t.value, 0);

  const balance = income - expenses;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;

  // Gastos por categoria
  const categories = {};
  monthTransactions
    .filter((t) => t.type === "expense" && t.paid)
    .forEach((t) => {
      categories[t.category] = (categories[t.category] || 0) + t.value;
    });

  const sortedCategories = Object.entries(categories).sort(
    (a, b) => b[1] - a[1]
  );

  // Investimentos
  const totalInvested = transactions
    .filter(
      (t) => t.type === "expense" && t.category === "Investimentos" && t.paid
    )
    .reduce((sum, t) => sum + t.value, 0);

  return {
    income,
    expenses,
    lastMonthExpenses,
    balance,
    savingsRate,
    categories: sortedCategories,
    totalInvested,
    dreams,
    jornada100k,
    monthTransactions,
    totalTransactions: transactions.length,
  };
}

// Gerar insights automáticos
function generateAutoInsights() {
  const insights = [];
  const data = financialAnalysis;

  // 1. Taxa de poupança
  if (data.savingsRate < 10) {
    insights.push({
      type: "alert",
      title: "⚠️ Taxa de poupança baixa",
      message: `Você está poupando apenas ${data.savingsRate.toFixed(
        1
      )}% da sua renda (R$ ${data.balance.toFixed(
        2
      )}). O ideal é poupar pelo menos 20%.`,
      action:
        "Tente reduzir gastos em categorias não essenciais como Lazer e Compras.",
    });
  } else if (data.savingsRate >= 20) {
    insights.push({
      type: "success",
      title: "🎉 Excelente taxa de poupança!",
      message: `Parabéns! Você está poupando ${data.savingsRate.toFixed(
        1
      )}% da sua renda (R$ ${data.balance.toFixed(2)}).`,
      action: "Continue assim e considere aumentar seus investimentos!",
    });
  } else {
    insights.push({
      type: "info",
      title: "💰 Taxa de poupança moderada",
      message: `Você está poupando ${data.savingsRate.toFixed(
        1
      )}% da sua renda (R$ ${data.balance.toFixed(2)}).`,
      action: "Tente alcançar 20% para ter uma reserva mais robusta.",
    });
  }

  // 2. Categoria com maior gasto
  if (data.categories.length > 0) {
    const [topCategory, topValue] = data.categories[0];
    const percentage = (topValue / data.expenses) * 100;

    if (percentage > 40) {
      insights.push({
        type: "warning",
        title: `📊 ${topCategory} consome ${percentage.toFixed(
          0
        )}% do orçamento`,
        message: `Você gastou R$ ${topValue.toFixed(
          2
        )} em ${topCategory} este mês.`,
        action: "Verifique se há oportunidades de economia nesta categoria.",
      });
    }
  }

  // 3. Comparação com mês anterior
  if (data.lastMonthExpenses > 0) {
    const diff = data.expenses - data.lastMonthExpenses;
    const percentChange = (diff / data.lastMonthExpenses) * 100;

    if (percentChange > 15) {
      insights.push({
        type: "alert",
        title: "📈 Gastos aumentaram",
        message: `Seus gastos subiram ${percentChange.toFixed(
          0
        )}% em relação ao mês passado (+R$ ${diff.toFixed(2)}).`,
        action: "Revise suas transações e identifique o que mudou.",
      });
    } else if (percentChange < -10) {
      insights.push({
        type: "success",
        title: "📉 Economia em alta!",
        message: `Você economizou ${Math.abs(percentChange).toFixed(
          0
        )}% em relação ao mês passado (-R$ ${Math.abs(diff).toFixed(2)})!`,
        action: null,
      });
    }
  }

  // 4. Análise de investimentos
  if (data.totalInvested > 0) {
    insights.push({
      type: "success",
      title: "💎 Você tem investimentos!",
      message: `Total investido: R$ ${data.totalInvested.toFixed(2)}`,
      action: "Continue investindo mensalmente para alcançar seus objetivos.",
    });
  } else if (data.balance > 500) {
    insights.push({
      type: "tip",
      title: "💡 Oportunidade de investimento",
      message: `Com R$ ${data.balance.toFixed(
        2
      )} de sobra este mês, considere investir!`,
      action:
        "Comece com Tesouro Direto ou CDB - investimentos seguros e rentáveis.",
    });
  }

  // 5. Análise de sonhos/metas
  if (data.dreams && data.dreams.length > 0) {
    data.dreams.forEach((dream) => {
      const progress = (dream.current / dream.target) * 100;
      const remaining = dream.target - dream.current;

      if (dream.deadline) {
        const deadline = new Date(dream.deadline);
        const now = new Date();
        const monthsRemaining = Math.max(
          0,
          (deadline.getFullYear() - now.getFullYear()) * 12 +
            (deadline.getMonth() - now.getMonth())
        );
        const monthlyNeeded =
          monthsRemaining > 0 ? remaining / monthsRemaining : remaining;

        if (monthlyNeeded > data.balance && data.balance > 0) {
          insights.push({
            type: "warning",
            title: `🎯 ${dream.name}: Meta desafiadora`,
            message: `Você precisa poupar R$ ${monthlyNeeded.toFixed(
              2
            )}/mês, mas está poupando R$ ${data.balance.toFixed(2)}.`,
            action: `Aumente sua poupança em R$ ${(
              monthlyNeeded - data.balance
            ).toFixed(2)}/mês ou ajuste o prazo.`,
          });
        } else if (progress >= 75) {
          insights.push({
            type: "success",
            title: `🚀 ${dream.name}: Quase lá!`,
            message: `Você já conquistou ${progress.toFixed(0)}% do seu sonho!`,
            action: `Faltam apenas R$ ${remaining.toFixed(2)}`,
          });
        }
      }
    });
  }

  // 6. Jornada 100k
  if (data.jornada100k && data.jornada100k.currentAmount > 0) {
    const progress = (data.jornada100k.currentAmount / 100000) * 100;
    insights.push({
      type: "info",
      title: "🚀 Jornada 100k",
      message: `Você já acumulou R$ ${data.jornada100k.currentAmount.toFixed(
        2
      )} (${progress.toFixed(1)}%)`,
      action: `Continue depositando mensalmente para alcançar os R$ 100.000!`,
    });
  }

  return insights;
}

// Processar pergunta do usuário
function processUserQuestion(question) {
  const q = question.toLowerCase().trim();
  const data = financialAnalysis;

  // Padrões de perguntas
  if (q.includes("gastei") || q.includes("gasto") || q.includes("despesa")) {
    if (q.includes("mês") || q.includes("mes")) {
      return {
        answer:
          `💰 Seus gastos este mês:\n\n` +
          `• Total: R$ ${data.expenses.toFixed(2)}\n` +
          `• Maior categoria: ${
            data.categories[0]
              ? data.categories[0][0] +
                " (R$ " +
                data.categories[0][1].toFixed(2) +
                ")"
              : "N/A"
          }\n\n` +
          `📊 Top 5 categorias:\n` +
          data.categories
            .slice(0, 5)
            .map(
              ([cat, val], idx) => `${idx + 1}. ${cat}: R$ ${val.toFixed(2)}`
            )
            .join("\n"),
      };
    }
  }

  if (
    q.includes("economia") ||
    q.includes("economizar") ||
    q.includes("poupar")
  ) {
    const insights = generateAutoInsights();
    const tips = insights.filter((i) => i.action).slice(0, 3);

    return {
      answer:
        `💡 Dicas de economia personalizadas:\n\n` +
        tips
          .map((tip, idx) => `${idx + 1}. ${tip.title}\n   ${tip.action}`)
          .join("\n\n"),
    };
  }

  if (
    q.includes("saúde") ||
    q.includes("financeira") ||
    q.includes("situação")
  ) {
    let health = "🟢 Boa";
    if (data.savingsRate < 10) health = "🔴 Precisa melhorar";
    else if (data.savingsRate < 20) health = "🟡 Regular";

    return {
      answer:
        `💚 Análise de Saúde Financeira:\n\n` +
        `Status: ${health}\n\n` +
        `📊 Resumo:\n` +
        `• Receitas: R$ ${data.income.toFixed(2)}\n` +
        `• Despesas: R$ ${data.expenses.toFixed(2)}\n` +
        `• Saldo: R$ ${data.balance.toFixed(2)}\n` +
        `• Taxa de poupança: ${data.savingsRate.toFixed(1)}%\n\n` +
        `${
          data.savingsRate >= 20
            ? "✅ Parabéns! Você está no caminho certo!"
            : "⚠️ Tente reduzir gastos para poupar mais."
        }`,
    };
  }

  if (q.includes("categoria") || (q.includes("onde") && q.includes("mais"))) {
    return {
      answer:
        `📊 Ranking de gastos por categoria:\n\n` +
        data.categories
          .slice(0, 5)
          .map(([cat, val], idx) => {
            const percent = (val / data.expenses) * 100;
            return `${idx + 1}. ${cat}: R$ ${val.toFixed(2)} (${percent.toFixed(
              0
            )}%)`;
          })
          .join("\n"),
    };
  }

  if (q.includes("investimento") || q.includes("investir")) {
    return {
      answer:
        `💎 Análise de Investimentos:\n\n` +
        `• Total investido: R$ ${data.totalInvested.toFixed(2)}\n` +
        `• Disponível para investir: R$ ${data.balance.toFixed(2)}\n\n` +
        `💡 Sugestões:\n` +
        `${
          data.balance > 500
            ? "✅ Você tem condições de investir este mês!\n• Tesouro Direto (baixo risco)\n• CDB (renda fixa)\n• Fundos de investimento"
            : "⚠️ Foque primeiro em aumentar sua poupança mensal."
        }`,
    };
  }

  if (q.includes("sonho") || q.includes("meta") || q.includes("objetivo")) {
    if (data.dreams.length === 0) {
      return {
        answer:
          `✨ Você ainda não cadastrou nenhum sonho!\n\n` +
          `Vá na aba "Metas & Sonhos" para começar a planejar seus objetivos.`,
      };
    }

    return {
      answer:
        `✨ Seus sonhos e metas:\n\n` +
        data.dreams
          .map((dream, idx) => {
            const progress = (dream.current / dream.target) * 100;
            return `${idx + 1}. ${dream.name}\n   ${progress.toFixed(
              0
            )}% completo (R$ ${dream.current.toFixed(
              2
            )} de R$ ${dream.target.toFixed(2)})`;
          })
          .join("\n\n"),
    };
  }

  if (q.includes("100k") || q.includes("jornada")) {
    if (!data.jornada100k) {
      return {
        answer:
          `🚀 Você ainda não iniciou a Jornada 100k!\n\n` +
          `Vá na aba "Jornada 100k" para configurar seu planejamento.`,
      };
    }

    const progress = (data.jornada100k.currentAmount / 100000) * 100;
    const remaining = 100000 - data.jornada100k.currentAmount;

    return {
      answer:
        `🚀 Jornada 100k:\n\n` +
        `• Progresso: ${progress.toFixed(1)}%\n` +
        `• Acumulado: R$ ${data.jornada100k.currentAmount.toFixed(2)}\n` +
        `• Falta: R$ ${remaining.toFixed(2)}\n` +
        `• Meses restantes: ${data.jornada100k.targetMonths}\n\n` +
        `💪 Continue depositando mensalmente para alcançar sua meta!`,
    };
  }

  // Resposta padrão
  return {
    answer:
      `🤔 Desculpe, não entendi sua pergunta.\n\n` +
      `Tente perguntar sobre:\n` +
      `• "Quanto gastei este mês?"\n` +
      `• "Como posso economizar?"\n` +
      `• "Analise minha saúde financeira"\n` +
      `• "Quais são meus sonhos?"\n` +
      `• "Como está a Jornada 100k?"`,
  };
}

// Adicionar mensagem na interface
function addAIMessage(role, content, showQuickActions = false) {
  const messagesContainer = document.getElementById("aiChatMessages");

  const messageDiv = document.createElement("div");
  messageDiv.className = `ai-message ${role}`;

  const avatarDiv = document.createElement("div");
  avatarDiv.className = "ai-message-avatar";
  avatarDiv.textContent = role === "assistant" ? "🤖" : "👤";

  const contentDiv = document.createElement("div");
  contentDiv.className = "ai-message-content";
  contentDiv.style.whiteSpace = "pre-line";
  contentDiv.textContent = content;

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(contentDiv);

  messagesContainer.appendChild(messageDiv);

  // Adicionar ações rápidas
  if (showQuickActions) {
    const quickActionsDiv = document.createElement("div");
    quickActionsDiv.className = "ai-quick-actions";
    quickActionsDiv.innerHTML = `
      <button class="ai-quick-action" onclick="askAI('Quanto gastei este mês?')">💰 Gastos do mês</button>
      <button class="ai-quick-action" onclick="askAI('Como posso economizar?')">💡 Dicas de economia</button>
      <button class="ai-quick-action" onclick="askAI('Analise minha saúde financeira')">📊 Saúde financeira</button>
    `;

    const wrapperDiv = document.createElement("div");
    wrapperDiv.style.width = "100%";
    wrapperDiv.appendChild(quickActionsDiv);
    messagesContainer.appendChild(wrapperDiv);
  }

  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  aiChatMessages.push({ role, content });
}

// Enviar mensagem
function sendAIMessage() {
  const chatInput = document.getElementById("aiChatInput");
  const message = chatInput.value.trim();

  if (!message) return;

  // Adicionar mensagem do usuário
  addAIMessage("user", message);
  chatInput.value = "";

  // Processar pergunta
  setTimeout(() => {
    const response = processUserQuestion(message);
    addAIMessage("assistant", response.answer);
  }, 500);
}

// Função auxiliar para perguntas rápidas
function askAI(question) {
  const chatInput = document.getElementById("aiChatInput");
  chatInput.value = question;
  sendAIMessage();
}

// Inicializar quando o documento estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAIAssistant);
} else {
  initAIAssistant();
}
