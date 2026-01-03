// ========== ASSISTENTE FINANCEIRO IA ==========

let aiChatMessages = [];

// Inicializar o assistente
function initAIAssistant() {
  const chatButton = document.getElementById("aiChatButton");
  const chatWindow = document.getElementById("aiChatWindow");
  const chatClose = document.getElementById("aiChatClose");
  const chatSend = document.getElementById("aiChatSend");
  const chatInput = document.getElementById("aiChatInput");

  // Abrir/Fechar chat
  chatButton.addEventListener("click", () => {
    chatWindow.classList.toggle("active");
    chatButton.classList.toggle("active");

    if (
      chatWindow.classList.contains("active") &&
      aiChatMessages.length === 0
    ) {
      addAIMessage(
        "assistant",
        "👋 Olá! Sou seu assistente financeiro inteligente. Posso ajudá-lo a:\n\n• Analisar seus gastos\n• Sugerir economias\n• Responder perguntas sobre suas finanças\n• Dar conselhos personalizados\n\nPergunte-me qualquer coisa!",
        true
      );
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
  contentDiv.textContent = content;

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(contentDiv);

  messagesContainer.appendChild(messageDiv);

  // Adicionar ações rápidas após a mensagem de boas-vindas
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

// Mostrar loading
function showAILoading() {
  const messagesContainer = document.getElementById("aiChatMessages");

  const loadingDiv = document.createElement("div");
  loadingDiv.className = "ai-message assistant";
  loadingDiv.id = "ai-loading-message";

  const avatarDiv = document.createElement("div");
  avatarDiv.className = "ai-message-avatar";
  avatarDiv.textContent = "🤖";

  const contentDiv = document.createElement("div");
  contentDiv.className = "ai-message-content";

  const loadingSpan = document.createElement("div");
  loadingSpan.className = "ai-message-loading";
  loadingSpan.innerHTML = "<span></span><span></span><span></span>";

  contentDiv.appendChild(loadingSpan);
  loadingDiv.appendChild(avatarDiv);
  loadingDiv.appendChild(contentDiv);

  messagesContainer.appendChild(loadingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Remover loading
function hideAILoading() {
  const loadingMessage = document.getElementById("ai-loading-message");
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

// Enviar mensagem
async function sendAIMessage() {
  const chatInput = document.getElementById("aiChatInput");
  const message = chatInput.value.trim();

  if (!message) return;

  // Adicionar mensagem do usuário
  addAIMessage("user", message);
  chatInput.value = "";

  // Mostrar loading
  showAILoading();

  try {
    // Coletar dados financeiros
    const financialData = getFinancialData();

    // Fazer chamada à API do Claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `Você é um assistente financeiro especializado. Aqui estão os dados financeiros do usuário:

${financialData}

Pergunta do usuário: ${message}

Responda de forma clara, objetiva e útil, com dicas práticas. Use emojis quando apropriado para deixar a resposta mais amigável.`,
          },
        ],
      }),
    });

    const data = await response.json();

    hideAILoading();

    // Extrair texto da resposta
    let aiResponse = "";
    if (data.content && data.content.length > 0) {
      aiResponse = data.content
        .map((item) => (item.type === "text" ? item.text : ""))
        .filter(Boolean)
        .join("\n");
    }

    if (aiResponse) {
      addAIMessage("assistant", aiResponse);
    } else {
      addAIMessage(
        "assistant",
        "❌ Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente."
      );
    }
  } catch (error) {
    hideAILoading();
    console.error("Erro ao chamar API:", error);
    addAIMessage(
      "assistant",
      "❌ Desculpe, não consegui processar sua mensagem. Verifique sua conexão e tente novamente."
    );
  }
}

// Função auxiliar para perguntas rápidas
function askAI(question) {
  const chatInput = document.getElementById("aiChatInput");
  chatInput.value = question;
  sendAIMessage();
}

// Coletar dados financeiros do localStorage
function getFinancialData() {
  const transactions = JSON.parse(
    localStorage.getItem("financialData") || "[]"
  );
  const dreams = JSON.parse(localStorage.getItem("dreams") || "[]");

  // Calcular estatísticas do mês atual
  const now = new Date();
  const monthTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return (
      tDate.getMonth() === now.getMonth() &&
      tDate.getFullYear() === now.getFullYear()
    );
  });

  const income = monthTransactions
    .filter((t) => t.type === "income" && t.paid)
    .reduce((sum, t) => sum + t.value, 0);

  const expense = monthTransactions
    .filter((t) => t.type === "expense" && t.paid)
    .reduce((sum, t) => sum + t.value, 0);

  const balance = income - expense;

  // Gastos por categoria
  const categories = {};
  monthTransactions
    .filter((t) => t.type === "expense" && t.paid)
    .forEach((t) => {
      categories[t.category] = (categories[t.category] || 0) + t.value;
    });

  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, val]) => `${cat}: R$ ${val.toFixed(2)}`)
    .join(", ");

  // Total de investimentos
  const totalInvested = transactions
    .filter(
      (t) => t.type === "expense" && t.category === "Investimentos" && t.paid
    )
    .reduce((sum, t) => sum + t.value, 0);

  // Sonhos
  const activeDreams = dreams.length;
  const dreamsProgress =
    dreams.length > 0
      ? dreams
          .map(
            (d) => `${d.name}: ${((d.current / d.target) * 100).toFixed(1)}%`
          )
          .join(", ")
      : "Nenhum sonho cadastrado";

  return `
📊 Resumo Financeiro (Mês Atual):
- Receitas: R$ ${income.toFixed(2)}
- Despesas: R$ ${expense.toFixed(2)}
- Saldo: R$ ${balance.toFixed(2)}
- Taxa de poupança: ${income > 0 ? ((balance / income) * 100).toFixed(1) : 0}%

💰 Top 5 Categorias de Gastos:
${topCategories || "Nenhum gasto registrado"}

💎 Investimentos:
- Total investido: R$ ${totalInvested.toFixed(2)}

✨ Sonhos e Metas:
- Total de sonhos: ${activeDreams}
- Progresso: ${dreamsProgress}

📝 Total de transações no mês: ${monthTransactions.length}
  `.trim();
}

// Inicializar quando o documento estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAIAssistant);
} else {
  initAIAssistant();
}
