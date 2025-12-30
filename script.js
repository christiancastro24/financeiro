let currentMonth = new Date();
let transactions = [];
let editingId = null;
let dailySpending = {};

// FORMAT CURRENCY
function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// INITIALIZE
function init() {
  loadData();
  updateMonth();
  updateDashboard();
  updateCategorySummary();
  setupEventListeners();
}

// LOAD DATA FROM LOCALSTORAGE
function loadData() {
  const saved = localStorage.getItem("financialData");
  if (saved) {
    transactions = JSON.parse(saved);
  }
  const savedSpending = localStorage.getItem("dailySpending");
  if (savedSpending) {
    dailySpending = JSON.parse(savedSpending);
  }
  loadCurrentBudget();
}

// SAVE DATA TO LOCALSTORAGE
function saveData() {
  localStorage.setItem("financialData", JSON.stringify(transactions));
  localStorage.setItem("dailySpending", JSON.stringify(dailySpending));
}

// GET MONTH KEY
function getMonthKey() {
  return `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
}

// GET MONTHLY BUDGET FROM TRANSACTIONS
function getMonthlyBudgetFromTransactions() {
  const monthTransactions = getMonthTransactions();
  const gastosGerais = monthTransactions.find(
    (t) => t.type === "expense" && t.category === "GastosGerais"
  );
  return gastosGerais ? gastosGerais.value : 0;
}

// LOAD CURRENT BUDGET
function loadCurrentBudget() {
  const budget = getMonthlyBudgetFromTransactions();

  if (budget > 0) {
    document.getElementById("budgetTableSection").style.display = "block";
    document.getElementById("budgetInfo").style.display = "block";
    document.getElementById("noBudgetMessage").style.display = "none";
    renderBudgetTable();
  } else {
    document.getElementById("budgetTableSection").style.display = "none";
    document.getElementById("budgetInfo").style.display = "none";
    document.getElementById("noBudgetMessage").style.display = "block";
  }
}

// RENDER BUDGET TABLE
function renderBudgetTable() {
  const budget = getMonthlyBudgetFromTransactions();

  if (budget === 0) {
    document.getElementById("budgetTableSection").style.display = "none";
    document.getElementById("noBudgetMessage").style.display = "block";
    document.getElementById("budgetInfo").style.display = "none";
    return;
  }

  document.getElementById("noBudgetMessage").style.display = "none";
  document.getElementById("budgetTableSection").style.display = "block";
  document.getElementById("budgetInfo").style.display = "block";
  document.getElementById("budgetDisplay").textContent = `R$ ${formatCurrency(
    budget
  )}`;

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  const dailyBudget = budget / daysInMonth;

  const monthKey = getMonthKey();
  if (!dailySpending[monthKey]) {
    dailySpending[monthKey] = {};
  }

  let accumulated = 0;
  let totalSpent = 0;
  const rows = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const daySpent = dailySpending[monthKey][day] || 0;
    totalSpent += daySpent;
    accumulated += dailyBudget - daySpent;

    const available = accumulated;
    const isNegative = available < 0;

    rows.push(`
            <tr style="${daySpent > 0 ? "background: #f8f9fa;" : ""}">
                <td style="font-weight: 600; color: #2c3e50;">Dia ${day}</td>
                <td style="padding: 10px 12px; text-align: center;">
                    <div style="display: inline-block; position: relative; width: 140px;">
                        <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #95a5a6; font-size: 14px; pointer-events: none;">R$</span>
                        <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            value="${daySpent || ""}"
                            placeholder="0,00"
                            onchange="updateDailySpending(${day}, this.value)"
                            style="width: 100%; padding: 10px 12px 10px 32px; border: 1px solid #dfe6e9; border-radius: 6px; font-size: 14px; text-align: right; transition: all 0.2s;"
                        />
                    </div>
                </td>
                <td style="text-align: right; padding-right: 20px; font-weight: 600; font-size: 15px; color: ${
                  isNegative ? "#e74c3c" : "#27ae60"
                }">
                    ${isNegative ? "- " : ""}R$ ${formatCurrency(
      Math.abs(available)
    )}
                </td>
            </tr>
        `);
  }

  document.getElementById("budgetTableBody").innerHTML = rows.join("");

  document.getElementById("summaryTotal").textContent = formatCurrency(budget);
  document.getElementById("summarySpent").textContent =
    formatCurrency(totalSpent);

  const today = new Date().getDate();
  const isCurrentMonth =
    currentMonth.getMonth() === new Date().getMonth() &&
    currentMonth.getFullYear() === new Date().getFullYear();

  if (isCurrentMonth) {
    let availableToday = 0;
    for (let day = 1; day <= today; day++) {
      const daySpent = dailySpending[monthKey][day] || 0;
      availableToday += dailyBudget - daySpent;
    }
    document.getElementById("summaryAvailable").textContent = formatCurrency(
      Math.max(0, availableToday)
    );
  } else {
    document.getElementById("summaryAvailable").textContent = formatCurrency(
      Math.max(0, accumulated)
    );
  }
}

// UPDATE DAILY SPENDING
function updateDailySpending(day, value) {
  const monthKey = getMonthKey();
  if (!dailySpending[monthKey]) {
    dailySpending[monthKey] = {};
  }

  const numValue = parseFloat(value) || 0;
  dailySpending[monthKey][day] = numValue;

  saveData();
  renderBudgetTable();
}

function switchTab(tab) {
  document
    .querySelectorAll(".nav-item")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));

  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
  document.getElementById(tab).classList.add("active");

  // Controlar visibilidade do seletor de mês
  const monthSelector = document.getElementById("monthSelector");
  if (monthSelector) {
    // ⬇️ ADICIONADO "dreams" AQUI
    if (
      tab === "jornada100k" ||
      tab === "analytics" ||
      tab === "retirement" ||
      tab === "dreams"
    ) {
      monthSelector.classList.add("hidden");
    } else {
      monthSelector.classList.remove("hidden");
    }
  }

  const titles = {
    dashboard: "Dashboard",
    analytics: "Análises",
    budget: "Orçamento Diário",
    summary: "Resumo por Categoria",
    investments: "Investimentos",
    retirement: "Aposentadoria",
    jornada100k: "Jornada 100k",
    dreams: "Metas & Sonhos", // ⬅️ ADICIONADO
  };
  document.getElementById("pageTitle").textContent = titles[tab];

  if (tab === "dashboard") {
    updateDashboard();
  } else if (tab === "analytics") {
    updateDashboardWithCharts();
  } else if (tab === "summary") {
    updateCategorySummary();
  } else if (tab === "budget") {
    loadCurrentBudget();
  } else if (tab === "investments") {
    updateInvestmentsSummary();
    updateSimulator();
  } else if (tab === "dreams") {
    // ⬅️ ADICIONADO
    initDreams();
  }
}

// CHANGE MONTH
function changeMonth(delta) {
  currentMonth.setMonth(currentMonth.getMonth() + delta);
  updateMonth();
  updateDashboard();
  updateCategorySummary();
  loadCurrentBudget();
}

// UPDATE MONTH DISPLAY
function updateMonth() {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  document.getElementById("currentMonth").textContent = `${
    months[currentMonth.getMonth()]
  } ${currentMonth.getFullYear()}`;
}

// GET MONTH TRANSACTIONS
function getMonthTransactions() {
  return transactions.filter((t) => {
    const tDate = new Date(t.date);
    return (
      tDate.getMonth() === currentMonth.getMonth() &&
      tDate.getFullYear() === currentMonth.getFullYear()
    );
  });
}

// UPDATE DASHBOARD
function updateDashboard() {
  const monthTransactions = getMonthTransactions();

  const incomePaid = monthTransactions
    .filter((t) => t.type === "income" && t.paid)
    .reduce((sum, t) => sum + t.value, 0);

  const incomePending = monthTransactions
    .filter((t) => t.type === "income" && !t.paid)
    .reduce((sum, t) => sum + t.value, 0);

  const incomeTotal = incomePaid + incomePending;

  const expensePaid = monthTransactions
    .filter((t) => t.type === "expense" && t.paid)
    .reduce((sum, t) => sum + t.value, 0);

  const expensePending = monthTransactions
    .filter((t) => t.type === "expense" && !t.paid)
    .reduce((sum, t) => sum + t.value, 0);

  const expenseTotal = expensePaid + expensePending;

  const balancePrevisto = incomeTotal - expenseTotal;

  document.getElementById("totalIncome").textContent = `R$ ${formatCurrency(
    incomeTotal
  )}`;
  document.getElementById("totalExpense").textContent = `R$ ${formatCurrency(
    expenseTotal
  )}`;
  document.getElementById("balance").textContent = `R$ ${formatCurrency(
    balancePrevisto
  )}`;

  renderTransactions(monthTransactions);
}

// RENDER TRANSACTIONS
function renderTransactions(list) {
  const container = document.getElementById("transactionsList");
  if (list.length === 0) {
    container.innerHTML =
      '<div class="empty-state">Nenhuma transação registrada neste mês</div>';
    return;
  }

  const sortedList = [...list].sort((a, b) => {
    if (a.category === "Salário" && b.category !== "Salário") return -1;
    if (a.category !== "Salário" && b.category === "Salário") return 1;
    if (a.type === "income" && b.type === "expense") return -1;
    if (a.type === "expense" && b.type === "income") return 1;
    return 0;
  });

  container.innerHTML = sortedList
    .map(
      (t) => `
            <div class="transaction-item ${t.paid ? "paid" : "unpaid"}">
                <div class="transaction-info">
                    <div class="transaction-title">${t.title}</div>
                    <div class="transaction-details">
                        <span class="category-badge">${t.category}</span>
                        <span>${new Date(t.date).toLocaleDateString(
                          "pt-BR"
                        )}</span>
                        <span> • ${t.paid ? "Pago" : "Pendente"}</span>
                    </div>
                </div>
                <div class="transaction-value ${t.type}">
                    ${t.type === "income" ? "+" : "-"} R$ ${formatCurrency(
        t.value
      )}
                </div>
                <div class="transaction-actions">
                    ${
                      !t.paid
                        ? `<button class="btn btn-success" onclick="togglePaid('${t.id}')" title="Marcar como pago">✓</button>`
                        : `<button class="btn btn-unpay" onclick="togglePaid('${t.id}')" title="Desmarcar como pago">↺</button>`
                    }
                    <button class="btn btn-edit" onclick="editTransaction('${
                      t.id
                    }')" title="Editar">✎</button>
                    <button class="btn btn-danger" onclick="deleteTransaction('${
                      t.id
                    }')" title="Excluir">✕</button>
                </div>
            </div>
        `
    )
    .join("");
}

// UPDATE CATEGORY SUMMARY
function updateCategorySummary() {
  const monthTransactions = getMonthTransactions();
  const categories = {};

  monthTransactions
    .filter((t) => t.type === "expense" && t.paid)
    .forEach((t) => {
      categories[t.category] = (categories[t.category] || 0) + t.value;
    });

  const container = document.getElementById("categorySummary");
  const entries = Object.entries(categories).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    container.innerHTML =
      '<div class="empty-state">Nenhum gasto registrado neste mês</div>';
    return;
  }

  container.innerHTML = entries
    .map(
      ([cat, val]) => `
            <div class="category-item">
                <span class="category-name">${cat}</span>
                <span class="category-value">R$ ${formatCurrency(val)}</span>
            </div>
        `
    )
    .join("");
}

// OPEN MODAL
function openModal() {
  editingId = null;
  document.getElementById("modalTitle").textContent = "Nova Transação";
  document.getElementById("transactionForm").reset();

  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  document.getElementById("transactionDate").value = formattedDate;

  document.getElementById("transactionModal").classList.add("active");
}

// CLOSE MODAL
function closeModal() {
  document.getElementById("transactionModal").classList.remove("active");
}

// EDIT TRANSACTION
function editTransaction(id) {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) return;

  editingId = id;
  document.getElementById("modalTitle").textContent = "Editar Transação";
  document.getElementById("type").value = transaction.type;
  document.getElementById("title").value = transaction.title;
  document.getElementById("value").value = transaction.value;
  document.getElementById("category").value = transaction.category;

  const transactionDate = new Date(transaction.date);
  const formattedDate = transactionDate.toISOString().split("T")[0];
  document.getElementById("transactionDate").value = formattedDate;

  document.getElementById("transactionModal").classList.add("active");
}

// DELETE TRANSACTION
function deleteTransaction(id) {
  if (confirm("Deseja realmente excluir esta transação?")) {
    transactions = transactions.filter((t) => t.id !== id);
    saveData();
    updateDashboard();
    updateCategorySummary();
    loadCurrentBudget();
  }
}

// TOGGLE PAID
function togglePaid(id) {
  const transaction = transactions.find((t) => t.id === id);
  if (transaction) {
    transaction.paid = !transaction.paid;
    saveData();
    updateDashboard();
    updateCategorySummary();
    loadCurrentBudget();
  }
}

// SETUP EVENT LISTENERS
function setupEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", function () {
      switchTab(this.dataset.tab);
    });
  });

  // Month navigation
  document
    .getElementById("prevMonth")
    .addEventListener("click", () => changeMonth(-1));
  document
    .getElementById("nextMonth")
    .addEventListener("click", () => changeMonth(1));

  // Modal
  document.getElementById("openModalBtn").addEventListener("click", openModal);
  document
    .getElementById("closeModalBtn")
    .addEventListener("click", closeModal);
  document
    .getElementById("goToDashboard")
    .addEventListener("click", () => switchTab("dashboard"));

  // Form submit
  document.getElementById("transactionForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const selectedDate = new Date(
      document.getElementById("transactionDate").value + "T12:00:00"
    );

    const transaction = {
      id: editingId || Date.now().toString(),
      type: document.getElementById("type").value,
      title: document.getElementById("title").value,
      value: parseFloat(document.getElementById("value").value),
      category: document.getElementById("category").value,
      date: selectedDate.toISOString(),
      paid: document.getElementById("type").value === "income" ? true : false,
    };

    if (editingId) {
      const index = transactions.findIndex((t) => t.id === editingId);
      transactions[index] = { ...transactions[index], ...transaction };
    } else {
      transactions.push(transaction);
    }

    saveData();
    closeModal();
    updateDashboard();
    updateCategorySummary();
    loadCurrentBudget();
  });

  // Close modal on background click
  document
    .getElementById("transactionModal")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        closeModal();
      }
    });
}

/* ============================================ */
/* ADICIONAR NO FINAL DO SEU script.js */
/* DEPOIS DA FUNÇÃO init() */
/* ============================================ */

// ========== VARIÁVEIS GLOBAIS PARA INVESTIMENTOS ==========
let investmentChart = null;
let myInvestmentChart = null;
const CDI_RATE_ANNUAL = 0.1175; // 11.75% ao ano (CDI atual aproximado)

// ========== ATUALIZAR RESUMO DE INVESTIMENTOS ==========
function updateInvestmentsSummary() {
  // PEGAR TODOS OS INVESTIMENTOS (não filtrar por mês)
  const investments = transactions.filter(
    (t) => t.type === "expense" && t.category === "Investimentos" && t.paid
  );

  const totalInvested = investments.reduce((sum, inv) => sum + inv.value, 0);

  // Calcular projeção de 12 meses com base no total já investido
  const projection12m = calculateInvestmentProjection(
    totalInvested,
    0,
    12,
    100
  );
  const gain12m = projection12m - totalInvested;

  document.getElementById("totalInvested").textContent = `R$ ${formatCurrency(
    totalInvested
  )}`;
  document.getElementById("projection12m").textContent = `R$ ${formatCurrency(
    projection12m
  )}`;
  document.getElementById(
    "projection12mGain"
  ).textContent = `+R$ ${formatCurrency(gain12m)} de rendimento`;

  renderInvestmentsList(investments);
  updateMyInvestmentChart(totalInvested);
  renderInvestmentTable(totalInvested);
}

// ========== CALCULAR PROJEÇÃO DE INVESTIMENTO ==========
function calculateInvestmentProjection(
  initial,
  monthly,
  months,
  cdiPercentage
) {
  const monthlyRate =
    Math.pow(1 + CDI_RATE_ANNUAL * (cdiPercentage / 100), 1 / 12) - 1;
  let total = initial;

  for (let i = 0; i < months; i++) {
    total = total * (1 + monthlyRate) + monthly;
  }

  return total;
}

// ========== RENDERIZAR LISTA DE INVESTIMENTOS ==========
function renderInvestmentsList(investments) {
  const container = document.getElementById("investmentsList");

  if (investments.length === 0) {
    container.innerHTML = `
            <div class="empty-investments">
                <div class="empty-investments-icon">💎</div>
                <p>Nenhum investimento registrado ainda.<br>
                Cadastre investimentos na categoria "Investimentos" no Dashboard.</p>
            </div>
        `;
    return;
  }

  // Ordenar por data (mais recentes primeiro)
  const sortedInvestments = [...investments].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  container.innerHTML = sortedInvestments
    .map(
      (inv) => `
            <div class="investment-item">
                <div class="investment-item-header">
                    <div class="investment-item-title">${inv.title}</div>
                    <div class="investment-item-date">${new Date(
                      inv.date
                    ).toLocaleDateString("pt-BR")}</div>
                </div>
                <div class="investment-item-value">R$ ${formatCurrency(
                  inv.value
                )}</div>
                <span class="investment-item-category">${inv.category}</span>
            </div>
        `
    )
    .join("");
}

// ========== RENDERIZAR TABELA DE PROJEÇÃO ==========
function renderInvestmentTable(totalInvested) {
  const tbody = document.getElementById("investmentTableBody");
  if (!tbody) {
    console.error("Elemento investmentTableBody não encontrado!");
    return;
  }

  if (totalInvested === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: #95a5a6;">
          Nenhum investimento registrado ainda.
        </td>
      </tr>
    `;
    return;
  }

  const monthlyRate = Math.pow(1 + CDI_RATE_ANNUAL, 1 / 12) - 1;
  const months = 12;

  let rows = [];
  let accumulated = totalInvested;
  let totalInterest = 0;

  for (let i = 1; i <= months; i++) {
    const monthInterest = accumulated * monthlyRate;
    totalInterest += monthInterest;
    accumulated += monthInterest;

    rows.push(`
      <tr>
        <td>${i}</td>
        <td class="text-success">R$ ${formatCurrency(monthInterest)}</td>
        <td class="text-primary">R$ ${formatCurrency(totalInvested)}</td>
        <td class="text-success">R$ ${formatCurrency(totalInterest)}</td>
        <td class="text-purple">R$ ${formatCurrency(accumulated)}</td>
      </tr>
    `);
  }

  tbody.innerHTML = rows.join("");
}

// ========== GRÁFICO DOS MEUS INVESTIMENTOS ==========
function updateMyInvestmentChart(totalInvested) {
  const ctx = document.getElementById("myInvestmentChart");
  if (!ctx) return;

  const labels = [];
  const investedData = [];
  const projectionData = [];

  const monthlyRate = Math.pow(1 + CDI_RATE_ANNUAL, 1 / 12) - 1;
  const months = 12;

  let currentAmount = totalInvested;

  labels.push("Hoje");
  investedData.push(totalInvested);
  projectionData.push(totalInvested);

  for (let i = 1; i <= months; i++) {
    currentAmount = currentAmount * (1 + monthlyRate);

    labels.push(`${i}m`);
    investedData.push(totalInvested);
    projectionData.push(currentAmount);
  }

  if (myInvestmentChart) {
    myInvestmentChart.destroy();
  }

  myInvestmentChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Investido",
          data: investedData,
          borderColor: "#95a5a6",
          backgroundColor: "rgba(149, 165, 166, 0.1)",
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
        {
          label: "Projeção com CDI 100%",
          data: projectionData,
          borderColor: "#9b59b6",
          backgroundColor: "rgba(155, 89, 182, 0.1)",
          borderWidth: 3,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            font: { size: 13, weight: "600" },
            padding: 15,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: "rgba(44, 62, 80, 0.95)",
          padding: 12,
          callbacks: {
            label: function (context) {
              return (
                context.dataset.label +
                ": R$ " +
                formatCurrency(context.parsed.y)
              );
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "R$ " + formatCurrency(value);
            },
          },
        },
      },
    },
  });
}

// ========== ATUALIZAR SIMULADOR ==========
function updateSimulator() {
  const initialInput = document.getElementById("initialAmount");
  const monthlyInput = document.getElementById("monthlyAmount");
  const monthsInput = document.getElementById("investmentPeriod");
  const cdiInput = document.getElementById("cdiPercentage");

  if (!initialInput || !monthlyInput || !monthsInput || !cdiInput) {
    return;
  }

  const initial = parseFloat(initialInput.value) || 0;
  const monthly = parseFloat(monthlyInput.value) || 0;
  const months = parseInt(monthsInput.value) || 12;
  const cdiPercent = parseInt(cdiInput.value) || 100;

  const totalInvested = initial + monthly * months;
  const finalAmount = calculateInvestmentProjection(
    initial,
    monthly,
    months,
    cdiPercent
  );
  const earnings = finalAmount - totalInvested;

  document.getElementById(
    "simTotalInvested"
  ).textContent = `R$ ${formatCurrency(totalInvested)}`;
  document.getElementById("simEarnings").textContent = `R$ ${formatCurrency(
    earnings
  )}`;
  document.getElementById("simFinalAmount").textContent = `R$ ${formatCurrency(
    finalAmount
  )}`;

  updateInvestmentChart(initial, monthly, months, cdiPercent);
}

// ========== GRÁFICO DO SIMULADOR ==========
function updateInvestmentChart(initial, monthly, months, cdiPercent) {
  const ctx = document.getElementById("investmentChart");
  if (!ctx) return;

  const labels = [];
  const investedData = [];
  const projectionData = [];

  const monthlyRate =
    Math.pow(1 + CDI_RATE_ANNUAL * (cdiPercent / 100), 1 / 12) - 1;

  let totalInvested = initial;
  let totalWithYield = initial;

  labels.push("Início");
  investedData.push(initial);
  projectionData.push(initial);

  for (let i = 1; i <= months; i++) {
    totalInvested += monthly;
    totalWithYield = totalWithYield * (1 + monthlyRate) + monthly;

    labels.push(`Mês ${i}`);
    investedData.push(totalInvested);
    projectionData.push(totalWithYield);
  }

  if (investmentChart) {
    investmentChart.destroy();
  }

  investmentChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Total Investido",
          data: investedData,
          borderColor: "#95a5a6",
          backgroundColor: "rgba(149, 165, 166, 0.1)",
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
        {
          label: "Projeção com Rendimento",
          data: projectionData,
          borderColor: "#9b59b6",
          backgroundColor: "rgba(155, 89, 182, 0.1)",
          borderWidth: 3,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            font: { size: 13, weight: "600" },
            padding: 15,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: "rgba(44, 62, 80, 0.95)",
          padding: 12,
          callbacks: {
            label: function (context) {
              return (
                context.dataset.label +
                ": R$ " +
                formatCurrency(context.parsed.y)
              );
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "R$ " + formatCurrency(value);
            },
          },
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
    },
  });
}

// ========== ALTERNAR ENTRE VISUALIZAÇÕES ==========
function setupInvestmentToggle() {
  const toggleBtns = document.querySelectorAll(".toggle-btn");
  const views = {
    "my-investments": document.getElementById("my-investments-view"),
    simulator: document.getElementById("simulator-view"),
  };

  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const viewName = this.getAttribute("data-view");

      // Atualizar botões
      toggleBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      // Atualizar views
      Object.values(views).forEach((v) => v.classList.remove("active"));
      views[viewName].classList.add("active");

      // Atualizar dados se necessário
      if (viewName === "simulator") {
        updateSimulator();
      }
    });
  });
}

// ========== SETUP EVENT LISTENERS PARA INVESTIMENTOS ==========
function setupInvestmentsListeners() {
  const simulatorInputs = [
    "initialAmount",
    "monthlyAmount",
    "investmentPeriod",
    "cdiPercentage",
  ];

  simulatorInputs.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("input", updateSimulator);
    }
  });

  setupInvestmentToggle();
}

// ========== INICIALIZAR INVESTIMENTOS ==========
setupInvestmentsListeners();

// INITIALIZE APP
init();

setupInvestmentsListeners();
if (document.getElementById("investments")) {
  updateSimulator();
}

// ========== VARIÁVEIS GLOBAIS PARA OS GRÁFICOS ==========
let patrimonialChart = null;
let categoryPieChart = null;
let incomeExpenseChart = null;

// ========== FUNÇÃO PRINCIPAL PARA ATUALIZAR DASHBOARD COM GRÁFICOS ==========
function updateDashboardWithCharts() {
  updateFinancialHealthScore();
  updatePatrimonialChart();
  updateCategoryPieChart();
  updateIncomeExpenseChart();
}

// ========== 1. SCORE DE SAÚDE FINANCEIRA ==========
function updateFinancialHealthScore() {
  const container = document.getElementById("financialHealthScore");
  if (!container) return;

  const monthTransactions = getMonthTransactions();

  const income = monthTransactions
    .filter((t) => t.type === "income" && t.paid)
    .reduce((sum, t) => sum + t.value, 0);

  const expense = monthTransactions
    .filter((t) => t.type === "expense" && t.paid)
    .reduce((sum, t) => sum + t.value, 0);

  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  let score = 0;
  let message = "";
  let color = "";

  if (savingsRate >= 30) {
    score = 100;
    message = "Excelente! Você está poupando mais de 30% da sua renda.";
    color = "#27ae60";
  } else if (savingsRate >= 20) {
    score = 80;
    message = "Muito bom! Continue mantendo essa taxa de poupança.";
    color = "#2ecc71";
  } else if (savingsRate >= 10) {
    score = 60;
    message = "Bom! Tente aumentar sua taxa de poupança gradualmente.";
    color = "#f39c12";
  } else if (savingsRate >= 0) {
    score = 40;
    message = "Atenção! Tente poupar pelo menos 10% da sua renda.";
    color = "#e67e22";
  } else {
    score = 20;
    message = "Alerta! Suas despesas estão maiores que sua renda.";
    color = "#e74c3c";
  }

  container.innerHTML = `
    <div style="display: flex; align-items: center; gap: 30px; padding: 20px;">
      <div style="position: relative; width: 150px; height: 150px;">
        <svg width="150" height="150" style="transform: rotate(-90deg);">
          <circle cx="75" cy="75" r="60" fill="none" stroke="#2a2f3e" stroke-width="12"/>
          <circle cx="75" cy="75" r="60" fill="none" stroke="${color}" stroke-width="12"
            stroke-dasharray="${(score / 100) * 377} 377" 
            stroke-linecap="round"
            style="transition: stroke-dasharray 1s ease;"/>
        </svg>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: ${color};">${score}</div>
          <div style="font-size: 12px; color: #8b92a7;">pontos</div>
        </div>
      </div>
      <div style="flex: 1;">
        <div style="font-size: 18px; font-weight: 600; color: white; margin-bottom: 10px;">
          Taxa de Poupança: ${savingsRate.toFixed(1)}%
        </div>
        <div style="color: #8b92a7; line-height: 1.6;">
          ${message}
        </div>
        <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 13px; color: #b0b8c9;">
          <strong>Receita:</strong> R$ ${formatCurrency(income)} • 
          <strong>Despesa:</strong> R$ ${formatCurrency(expense)}
        </div>
      </div>
    </div>
  `;
}

// ========== 2. EVOLUÇÃO PATRIMONIAL (ÚLTIMOS 6 MESES) ==========
function updatePatrimonialChart() {
  const ctx = document.getElementById("patrimonialChart");
  if (!ctx) return;

  const months = [];
  const balances = [];

  // Gerar últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    const monthTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return (
        tDate.getMonth() === date.getMonth() &&
        tDate.getFullYear() === date.getFullYear()
      );
    });

    const income = monthTransactions
      .filter((t) => t.type === "income" && t.paid)
      .reduce((sum, t) => sum + t.value, 0);

    const expense = monthTransactions
      .filter((t) => t.type === "expense" && t.paid)
      .reduce((sum, t) => sum + t.value, 0);

    const monthNames = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    months.push(
      `${monthNames[date.getMonth()]}/${date
        .getFullYear()
        .toString()
        .slice(-2)}`
    );

    // Acumular saldo
    const previousBalance =
      balances.length > 0 ? balances[balances.length - 1] : 0;
    balances.push(previousBalance + (income - expense));
  }

  if (patrimonialChart) {
    patrimonialChart.destroy();
  }

  patrimonialChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "Patrimônio",
          data: balances,
          borderColor: "#667eea",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "#667eea",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(44, 62, 80, 0.95)",
          padding: 12,
          titleColor: "#fff",
          bodyColor: "#fff",
          callbacks: {
            label: function (context) {
              return "Saldo: R$ " + formatCurrency(context.parsed.y);
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "R$ " + formatCurrency(value);
            },
            color: "#8b92a7",
            font: { size: 11 },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.05)",
          },
        },
        x: {
          ticks: {
            color: "#8b92a7",
            font: { size: 11 },
          },
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

// ========== 3. GASTOS POR CATEGORIA (PIE CHART) ==========
function updateCategoryPieChart() {
  const ctx = document.getElementById("categoryPieChart");
  if (!ctx) return;

  const monthTransactions = getMonthTransactions();
  const categories = {};

  monthTransactions
    .filter((t) => t.type === "expense" && t.paid)
    .forEach((t) => {
      categories[t.category] = (categories[t.category] || 0) + t.value;
    });

  const labels = Object.keys(categories);
  const data = Object.values(categories);

  const colors = [
    "#667eea",
    "#764ba2",
    "#f093fb",
    "#4facfe",
    "#43e97b",
    "#fa709a",
    "#fee140",
    "#30cfd0",
  ];

  if (categoryPieChart) {
    categoryPieChart.destroy();
  }

  if (labels.length === 0) {
    ctx.parentElement.innerHTML =
      '<div style="text-align: center; padding: 60px; color: #8b92a7;">Nenhum gasto registrado este mês</div>';
    return;
  }

  categoryPieChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: "#1a1f2e",
          hoverOffset: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: "#e4e6eb",
            font: { size: 12 },
            padding: 15,
            generateLabels: function (chart) {
              const data = chart.data;
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i,
                };
              });
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(44, 62, 80, 0.95)",
          padding: 12,
          callbacks: {
            label: function (context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `R$ ${formatCurrency(value)} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

// ========== 4. RECEITAS VS DESPESAS (BAR CHART) ==========
function updateIncomeExpenseChart() {
  const ctx = document.getElementById("incomeExpenseChart");
  if (!ctx) return;

  const months = [];
  const incomes = [];
  const expenses = [];

  // Últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    const monthTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return (
        tDate.getMonth() === date.getMonth() &&
        tDate.getFullYear() === date.getFullYear()
      );
    });

    const income = monthTransactions
      .filter((t) => t.type === "income" && t.paid)
      .reduce((sum, t) => sum + t.value, 0);

    const expense = monthTransactions
      .filter((t) => t.type === "expense" && t.paid)
      .reduce((sum, t) => sum + t.value, 0);

    const monthNames = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    months.push(
      `${monthNames[date.getMonth()]}/${date
        .getFullYear()
        .toString()
        .slice(-2)}`
    );
    incomes.push(income);
    expenses.push(expense);
  }

  if (incomeExpenseChart) {
    incomeExpenseChart.destroy();
  }

  incomeExpenseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          label: "Receitas",
          data: incomes,
          backgroundColor: "rgba(39, 174, 96, 0.8)",
          borderColor: "#27ae60",
          borderWidth: 2,
          borderRadius: 8,
        },
        {
          label: "Despesas",
          data: expenses,
          backgroundColor: "rgba(231, 76, 60, 0.8)",
          borderColor: "#e74c3c",
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            color: "#e4e6eb",
            font: { size: 13, weight: "600" },
            padding: 15,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: "rgba(44, 62, 80, 0.95)",
          padding: 12,
          callbacks: {
            label: function (context) {
              return (
                context.dataset.label +
                ": R$ " +
                formatCurrency(context.parsed.y)
              );
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "R$ " + formatCurrency(value);
            },
            color: "#8b92a7",
            font: { size: 11 },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.05)",
          },
        },
        x: {
          ticks: {
            color: "#8b92a7",
            font: { size: 11 },
          },
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

// ========== METAS & SONHOS - JAVASCRIPT ==========

// Frases motivacionais
const motivationalQuotes = [
  "Sonhos não morrem, apenas adormecem na alma da gente. 💫",
  "O sucesso é a soma de pequenos esforços repetidos dia após dia. 🌟",
  "Acredite em você mesmo e tudo será possível. ✨",
  "Seus sonhos estão esperando por você do outro lado do medo. 🚀",
  "Cada centavo economizado é um passo mais perto do seu sonho. 💰",
  "O futuro pertence àqueles que acreditam na beleza de seus sonhos. 🌈",
  "Não importa quão devagar você vá, desde que não pare. 🎯",
  "Grandes conquistas requerem grandes ambições. 🏆",
  "Você é mais forte do que imagina. Continue! 💪",
  "O melhor momento para começar foi ontem. O segundo melhor é agora. ⏰",
];

// Mapas de países (coordenadas para o mapa)
const countryCoordinates = {
  BR: { lat: -14.235, lng: -51.9253, name: "Brasil" },
  US: { lat: 37.0902, lng: -95.7129, name: "Estados Unidos" },
  FR: { lat: 46.2276, lng: 2.2137, name: "França" },
  IT: { lat: 41.8719, lng: 12.5674, name: "Itália" },
  ES: { lat: 40.4637, lng: -3.7492, name: "Espanha" },
  PT: { lat: 39.3999, lng: -8.2245, name: "Portugal" },
  GB: { lat: 55.3781, lng: -3.436, name: "Reino Unido" },
  DE: { lat: 51.1657, lng: 10.4515, name: "Alemanha" },
  JP: { lat: 36.2048, lng: 138.2529, name: "Japão" },
  AU: { lat: -25.2744, lng: 133.7751, name: "Austrália" },
  CA: { lat: 56.1304, lng: -106.3468, name: "Canadá" },
  MX: { lat: 23.6345, lng: -102.5528, name: "México" },
  AR: { lat: -38.4161, lng: -63.6167, name: "Argentina" },
  CL: { lat: -35.6751, lng: -71.543, name: "Chile" },
  GR: { lat: 39.0742, lng: 21.8243, name: "Grécia" },
  TH: { lat: 15.87, lng: 100.9925, name: "Tailândia" },
  NZ: { lat: -40.9006, lng: 174.886, name: "Nova Zelândia" },
};

let dreams = [];
let editingDreamId = null;
let currentDreamImage = null;

// ========== INICIALIZAÇÃO ==========
function initDreams() {
  console.log("Inicializando aba de sonhos...");
  loadDreams();
  displayDailyMotivation();
  renderDreams();
  setupDreamListeners();
}

// ========== CARREGAR DADOS ==========
function loadDreams() {
  const saved = localStorage.getItem("dreams");
  if (saved) {
    dreams = JSON.parse(saved);
  }
}

// ========== SALVAR DADOS ==========
function saveDreams() {
  localStorage.setItem("dreams", JSON.stringify(dreams));
}

// ========== FRASE MOTIVACIONAL DIÁRIA ==========
function displayDailyMotivation() {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem("motivationDate");
  let quoteIndex = localStorage.getItem("motivationIndex");

  if (savedDate !== today || !quoteIndex) {
    quoteIndex = Math.floor(Math.random() * motivationalQuotes.length);
    localStorage.setItem("motivationDate", today);
    localStorage.setItem("motivationIndex", quoteIndex);
  }

  const quote = motivationalQuotes[quoteIndex];
  document.getElementById("dailyMotivation").textContent = quote;
}

// ========== RENDERIZAR SONHOS ==========
function renderDreams() {
  const grid = document.getElementById("dreamsGrid");
  const empty = document.getElementById("dreamsEmpty");

  if (dreams.length === 0) {
    grid.style.display = "none";
    empty.style.display = "block";
    return;
  }

  grid.style.display = "grid";
  empty.style.display = "none";

  grid.innerHTML = dreams
    .map((dream) => {
      const progress = (dream.current / dream.target) * 100;
      const remaining = dream.target - dream.current;

      const typeIcons = {
        travel: "🌍",
        purchase: "🛍️",
        savings: "💰",
        investment: "📈",
        education: "📚",
        other: "⭐",
      };

      const typeLabels = {
        travel: "Viagem",
        purchase: "Compra",
        savings: "Poupança",
        investment: "Investimento",
        education: "Educação",
        other: "Outro",
      };

      return `
      <div class="dream-card" onclick="openDreamDetail('${dream.id}')">
        <div class="dream-card-image ${dream.image ? "" : "placeholder"}">
          ${
            dream.image
              ? `<img src="${dream.image}" alt="${dream.name}">`
              : typeIcons[dream.type]
          }
          <div class="dream-type-badge">
            ${typeIcons[dream.type]} ${typeLabels[dream.type]}
          </div>
        </div>
        
        <div class="dream-card-content">
          <div class="dream-card-header">
            <h3 class="dream-card-title">${dream.name}</h3>
            ${
              dream.country
                ? `
              <div class="dream-card-location">
                📍 ${dream.city || ""} ${
                    dream.city && dream.country ? "•" : ""
                  } ${countryCoordinates[dream.country]?.name || ""}
              </div>
            `
                : ""
            }
          </div>
          
          <div class="dream-progress">
            <div class="dream-progress-header">
              <span class="dream-progress-current">R$ ${formatCurrency(
                dream.current
              )}</span>
              <span class="dream-progress-target">R$ ${formatCurrency(
                dream.target
              )}</span>
            </div>
            <div class="dream-progress-bar">
              <div class="dream-progress-fill" style="width: ${Math.min(
                progress,
                100
              )}%"></div>
            </div>
            <div class="dream-progress-percentage">${progress.toFixed(
              1
            )}% conquistado</div>
          </div>
          
          <div class="dream-card-footer">
            <div class="dream-remaining">
              Falta: <strong>R$ ${formatCurrency(remaining)}</strong>
            </div>
            ${
              dream.targetDate
                ? `
              <div class="dream-date">
                📅 ${new Date(dream.targetDate).toLocaleDateString("pt-BR")}
              </div>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

// ========== SETUP EVENT LISTENERS ==========
function setupDreamListeners() {
  // Botão adicionar sonho
  document
    .getElementById("addDreamBtn")
    ?.addEventListener("click", openDreamModal);

  // Fechar modais
  document
    .getElementById("closeDreamModalBtn")
    ?.addEventListener("click", closeDreamModal);
  document
    .getElementById("closeDreamDetailBtn")
    ?.addEventListener("click", closeDreamDetailModal);
  document
    .getElementById("closeAddAmountBtn")
    ?.addEventListener("click", closeAddAmountModal);

  // Form de sonho
  document.getElementById("dreamForm")?.addEventListener("submit", saveDream);

  // Tipo de sonho (mostrar seção de viagem)
  document.getElementById("dreamType")?.addEventListener("change", (e) => {
    const travelSection = document.getElementById("travelSection");
    travelSection.style.display =
      e.target.value === "travel" ? "block" : "none";
  });

  // Upload de imagem
  document.getElementById("uploadImageBtn")?.addEventListener("click", () => {
    document.getElementById("dreamImage").click();
  });

  document
    .getElementById("dreamImage")
    ?.addEventListener("change", handleImageUpload);

  // Form adicionar valor
  document
    .getElementById("addAmountForm")
    ?.addEventListener("submit", saveAmount);

  // Botão adicionar valor no detalhe
  document.getElementById("addAmountBtn")?.addEventListener("click", () => {
    closeDreamDetailModal();
    openAddAmountModal();
  });

  // Fechar modal ao clicar fora
  document.getElementById("dreamModal")?.addEventListener("click", (e) => {
    if (e.target.id === "dreamModal") closeDreamModal();
  });

  document
    .getElementById("dreamDetailModal")
    ?.addEventListener("click", (e) => {
      if (e.target.id === "dreamDetailModal") closeDreamDetailModal();
    });

  document.getElementById("addAmountModal")?.addEventListener("click", (e) => {
    if (e.target.id === "addAmountModal") closeAddAmountModal();
  });
}

// ========== UPLOAD DE IMAGEM ==========
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    currentDreamImage = event.target.result;
    showImagePreview(currentDreamImage);
  };
  reader.readAsDataURL(file);
}

function showImagePreview(src) {
  const preview = document.getElementById("imagePreview");
  preview.innerHTML = `<img src="${src}" alt="Preview">`;
  preview.classList.add("active");
}

// ========== MODAL DE SONHO ==========
function openDreamModal(dreamId = null) {
  editingDreamId = dreamId;
  currentDreamImage = null;

  const modal = document.getElementById("dreamModal");
  const title = document.getElementById("dreamModalTitle");
  const form = document.getElementById("dreamForm");

  form.reset();
  document.getElementById("imagePreview").classList.remove("active");
  document.getElementById("travelSection").style.display = "none";

  if (dreamId) {
    const dream = dreams.find((d) => d.id === dreamId);
    if (dream) {
      title.textContent = "✏️ Editar Sonho";
      document.getElementById("dreamType").value = dream.type;
      document.getElementById("dreamName").value = dream.name;
      document.getElementById("dreamTarget").value = dream.target;
      document.getElementById("dreamCurrent").value = dream.current;
      document.getElementById("dreamDate").value = dream.targetDate || "";
      document.getElementById("dreamDescription").value =
        dream.description || "";

      if (dream.type === "travel") {
        document.getElementById("travelSection").style.display = "block";
        document.getElementById("dreamCountry").value = dream.country || "";
        document.getElementById("dreamCity").value = dream.city || "";
      }

      if (dream.image) {
        currentDreamImage = dream.image;
        showImagePreview(dream.image);
      }
    }
  } else {
    title.textContent = "✨ Novo Sonho";
  }

  modal.classList.add("active");
}

function closeDreamModal() {
  document.getElementById("dreamModal").classList.remove("active");
  editingDreamId = null;
  currentDreamImage = null;
}

// ========== SALVAR SONHO ==========
// SUBSTITUA a função saveDream no seu script.js por esta versão corrigida:

function saveDream(e) {
  e.preventDefault();
  e.stopPropagation(); // Adicionado para evitar problemas de propagação

  const form = document.getElementById("dreamForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const imageUrl = document.getElementById("dreamImageUrl").value;
  const finalImage = imageUrl || currentDreamImage;

  const dreamData = {
    id: editingDreamId || Date.now().toString(),
    type: document.getElementById("dreamType").value,
    name: document.getElementById("dreamName").value.trim(),
    target: parseFloat(document.getElementById("dreamTarget").value) || 0,
    current: parseFloat(document.getElementById("dreamCurrent").value) || 0,
    targetDate: document.getElementById("dreamDate").value || null,
    description: document.getElementById("dreamDescription").value.trim(),
    image: finalImage || null,
    country: document.getElementById("dreamCountry").value || null,
    city: document.getElementById("dreamCity").value || null,
    createdAt: new Date().toISOString(),
    history: [],
  };

  console.log("Salvando sonho:", dreamData); // Para debug

  if (editingDreamId) {
    // Editando sonho existente
    const index = dreams.findIndex((d) => d.id === editingDreamId);
    if (index !== -1) {
      // Preserva histórico e data de criação
      dreamData.history = dreams[index].history || [];
      dreamData.createdAt = dreams[index].createdAt || dreamData.createdAt;
      dreams[index] = dreamData;
    }
  } else {
    // Novo sonho
    dreams.push(dreamData);
  }

  saveDreams();
  renderDreams();
  closeDreamModal();

  // Mostra feedback visual
  showToast("Sonho salvo com sucesso! ✨");
}

// Adiciona função de toast para feedback
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #27ae60;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Adiciona animações CSS para o toast
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ========== MODAL DE DETALHES ==========
function openDreamDetail(dreamId) {
  const dream = dreams.find((d) => d.id === dreamId);
  if (!dream) return;

  editingDreamId = dreamId;

  const modal = document.getElementById("dreamDetailModal");
  const header = document.getElementById("dreamDetailHeader");
  const body = document.getElementById("dreamDetailBody");

  const progress = (dream.current / dream.target) * 100;
  const remaining = dream.target - dream.current;

  // Header
  header.innerHTML = `
    ${
      dream.image
        ? `<img src="${dream.image}" alt="${dream.name}">`
        : '<div style="font-size: 80px;">🌟</div>'
    }
    <div class="dream-detail-overlay">
      <h2 class="dream-detail-title">${dream.name}</h2>
      ${
        dream.country
          ? `<div class="dream-detail-location">📍 ${dream.city || ""} ${
              countryCoordinates[dream.country]?.name || ""
            }</div>`
          : ""
      }
    </div>
  `;

  // Body
  body.innerHTML = `
    ${
      dream.description
        ? `<p style="color: #8b92a7; margin-bottom: 24px;">${dream.description}</p>`
        : ""
    }
    
    <div class="dream-detail-stats">
      <div class="dream-stat-card">
        <div class="dream-stat-label">Meta</div>
        <div class="dream-stat-value">R$ ${formatCurrency(dream.target)}</div>
      </div>
      <div class="dream-stat-card">
        <div class="dream-stat-label">Economizado</div>
        <div class="dream-stat-value success">R$ ${formatCurrency(
          dream.current
        )}</div>
      </div>
      <div class="dream-stat-card">
        <div class="dream-stat-label">Falta</div>
        <div class="dream-stat-value warning">R$ ${formatCurrency(
          remaining
        )}</div>
      </div>
    </div>
    
    <div class="dream-detail-progress">
      <div class="dream-progress-header">
        <span style="color: #8b92a7;">Progresso</span>
        <span style="color: #27ae60; font-weight: 700;">${progress.toFixed(
          1
        )}%</span>
      </div>
      <div class="dream-progress-bar" style="height: 16px;">
        <div class="dream-progress-fill" style="width: ${Math.min(
          progress,
          100
        )}%"></div>
      </div>
    </div>
    
    ${
      dream.targetDate
        ? `
      <div style="text-align: center; margin: 20px 0; padding: 12px; background: #1e2738; border-radius: 8px;">
        <span style="color: #8b92a7;">Data Alvo: </span>
        <strong style="color: #ffffff;">${new Date(
          dream.targetDate
        ).toLocaleDateString("pt-BR")}</strong>
      </div>
    `
        : ""
    }
    
    <div style="display: flex; gap: 12px; margin-top: 20px;">
      <button class="btn" onclick="editDream('${
        dream.id
      }')" style="flex: 1;">✏️ Editar</button>
      <button class="btn btn-danger" onclick="deleteDream('${
        dream.id
      }')" style="flex: 1;">🗑️ Excluir</button>
    </div>
  `;

  modal.classList.add("active");
}

function closeDreamDetailModal() {
  document.getElementById("dreamDetailModal").classList.remove("active");
}

// ========== EDITAR SONHO ==========
function editDream(dreamId) {
  closeDreamDetailModal();
  openDreamModal(dreamId);
}

// ========== DELETAR SONHO ==========
function deleteDream(dreamId) {
  if (!confirm("Tem certeza que deseja excluir este sonho?")) return;

  dreams = dreams.filter((d) => d.id !== dreamId);
  saveDreams();
  renderDreams();
  closeDreamDetailModal();
}

// ========== MODAL ADICIONAR VALOR ==========
function openAddAmountModal() {
  const modal = document.getElementById("addAmountModal");
  document.getElementById("addAmountForm").reset();
  document.getElementById("addAmountDate").value = new Date()
    .toISOString()
    .split("T")[0];
  modal.classList.add("active");
}

function closeAddAmountModal() {
  document.getElementById("addAmountModal").classList.remove("active");
}

function saveAmount(e) {
  e.preventDefault();

  if (!editingDreamId) return;

  const amount = parseFloat(document.getElementById("addAmountValue").value);
  const date = document.getElementById("addAmountDate").value;

  const dream = dreams.find((d) => d.id === editingDreamId);
  if (dream) {
    dream.current += amount;
    dream.history = dream.history || [];
    dream.history.push({
      amount,
      date,
      timestamp: new Date().toISOString(),
    });

    saveDreams();
    renderDreams();
    closeAddAmountModal();
  }
}

// ========== INICIALIZAR QUANDO A ABA FOR ABERTA ==========
// Adicione no switchTab() do script.js:
// if (tab === 'dreams') { initDreams(); }
