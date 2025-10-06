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
  };
  document.getElementById("pageTitle").textContent = titles[tab];

  if (tab === "summary") {
    updateCategorySummary();
  } else if (tab === "budget") {
    loadCurrentBudget();
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

// INITIALIZE APP
init();
