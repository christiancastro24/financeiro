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

// SWITCH TAB
function switchTab(tab) {
  document
    .querySelectorAll(".nav-item")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));

  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
  document.getElementById(tab).classList.add("active");

  const titles = {
    dashboard: "Dashboard",
    budget: "Orçamento Diário",
    summary: "Resumo por Categoria",
    investments: "Investimentos",
  };
  document.getElementById("pageTitle").textContent = titles[tab];

  if (tab === "summary") {
    updateCategorySummary();
  } else if (tab === "budget") {
    loadCurrentBudget();
  } else if (tab === "investments") {
    updateInvestmentsSummary();
    updateSimulator();
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
