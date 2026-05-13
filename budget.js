// ========== ORÇAMENTO A CADA 10 DIAS (DECENDIAL) - LAYOUT EM BLOCOS ==========

let periodSpending = {};
let monthlyBudgets = {};

function loadBudgetData() {
  const savedSpending = localStorage.getItem("periodSpending");
  if (savedSpending) periodSpending = JSON.parse(savedSpending);

  const savedBudgets = localStorage.getItem("monthlyBudgets");
  if (savedBudgets) monthlyBudgets = JSON.parse(savedBudgets);
}

function saveBudgetData() {
  localStorage.setItem("periodSpending", JSON.stringify(periodSpending));
  localStorage.setItem("monthlyBudgets", JSON.stringify(monthlyBudgets));
}

function saveNewBudget() {
  const input = document.getElementById("newBudgetInput");
  const val = parseFloat(input.value);
  if (!val || val <= 0) {
    alert("Por favor, insira um valor válido para o orçamento.");
    return;
  }
  const monthKey = getMonthKey();
  monthlyBudgets[monthKey] = val;
  saveBudgetData();
  loadBudgetView();
}

function editMonthlyBudget() {
  const monthKey = getMonthKey();
  const currentBudget = monthlyBudgets[monthKey] || 0;
  const newVal = prompt("Digite o novo orçamento mensal total:", currentBudget);

  if (newVal !== null) {
    const parsed = parseFloat(newVal);
    if (!isNaN(parsed) && parsed > 0) {
      monthlyBudgets[monthKey] = parsed;
      saveBudgetData();
      loadBudgetView();
    } else if (parsed === 0) {
      delete monthlyBudgets[monthKey];
      saveBudgetData();
      loadBudgetView();
    }
  }
}

function loadBudgetView() {
  const monthKey = getMonthKey();
  const totalBudget = monthlyBudgets[monthKey] || 0;

  if (totalBudget > 0) {
    document.getElementById("budgetTableSection").style.display = "block";
    document.getElementById("noBudgetMessage").style.display = "none";
    renderBlocks(totalBudget);
  } else {
    document.getElementById("budgetTableSection").style.display = "none";
    document.getElementById("noBudgetMessage").style.display = "block";
  }
}

function renderBlocks(totalBudget) {
  const monthKey = getMonthKey();
  if (!periodSpending[monthKey]) {
    periodSpending[monthKey] = { 1: 0, 2: 0, 3: 0 };
  }

  // 1. Cálculos Mensais
  const spent1 = periodSpending[monthKey][1] || 0;
  const spent2 = periodSpending[monthKey][2] || 0;
  const spent3 = periodSpending[monthKey][3] || 0;
  const totalSpent = spent1 + spent2 + spent3;
  const available = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // 2. Atualizar Cards Superiores
  document.getElementById("summaryTotal").textContent =
    `R$ ${formatCurrency(totalBudget)}`;
  document.getElementById("summarySpent").textContent =
    `R$ ${formatCurrency(totalSpent)}`;
  document.getElementById("summaryAvailable").textContent =
    `R$ ${formatCurrency(available)}`;
  document.getElementById("summaryPercent").textContent =
    `${percentUsed.toFixed(1)}%`;

  // Cores dinâmicas para o Disponível (Vermelho se negativo)
  const availableEl = document.getElementById("summaryAvailable");
  availableEl.className = `card-value ${available < 0 ? "text-danger" : "text-success"}`;

  // 3. Atualizar Barra de Progresso do Meio
  document.getElementById("progressPercentText").textContent =
    `${percentUsed.toFixed(1)}%`;
  const mainBar = document.getElementById("mainProgressBar");
  mainBar.style.width = `${Math.min(percentUsed, 100)}%`;
  if (percentUsed > 100) {
    mainBar.classList.add("over");
    document.getElementById("progressPercentText").classList.add("text-danger");
  } else {
    mainBar.classList.remove("over");
    document
      .getElementById("progressPercentText")
      .classList.remove("text-danger");
  }

  // 4. Gerar os 3 Blocos Decendiais
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const budgetPerPeriod = totalBudget / 3;

  const periods = [
    { id: 1, name: "Dias 01 a 10", spent: spent1 },
    { id: 2, name: "Dias 11 a 20", spent: spent2 },
    { id: 3, name: `Dias 21 a ${daysInMonth}`, spent: spent3 },
  ];

  const container = document.getElementById("budgetPeriodsContainer");
  let html = "";

  periods.forEach((p) => {
    const periodAvailable = budgetPerPeriod - p.spent;
    const periodPercent = (p.spent / budgetPerPeriod) * 100;
    const isOver = p.spent > budgetPerPeriod;

    html += `
      <div class="period-block" style="${isOver ? "border-color: #e74c3c;" : ""}">
        <div class="period-header">
          <span>${p.name}</span>
        </div>
        
        <div class="period-stats">
          <div class="period-stat-item">
            <label>Meta do Período</label>
            <span style="color: #4facfe;">R$ ${formatCurrency(budgetPerPeriod)}</span>
          </div>
          <div class="period-stat-item" style="text-align: right;">
            <label>Restante</label>
            <span class="${isOver ? "text-danger" : "text-success"}">
              R$ ${formatCurrency(periodAvailable)}
            </span>
          </div>
        </div>

        <div class="mb-2">
          <div class="flex-between" style="font-size: 11px; margin-bottom: 5px;">
            <span style="color: #8b92a7;">Progresso do Período</span>
            <span style="color: ${isOver ? "#e74c3c" : "#e4e6eb"}">${periodPercent.toFixed(1)}%</span>
          </div>
          <div class="progress-track" style="height: 6px;">
            <div class="progress-fill ${isOver ? "over" : ""}" style="width: ${Math.min(periodPercent, 100)}%;"></div>
          </div>
        </div>

        <div class="period-input-area">
          <label style="display: block; font-size: 11px; color: #8b92a7; margin-bottom: 5px;">
            Registrar Gasto (R$)
          </label>
          <div style="position: relative;">
            <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #8b92a7; font-size: 14px;">R$</span>
            <input 
              type="number" 
              step="0.01" 
              min="0"
              value="${p.spent || ""}"
              placeholder="0,00"
              onchange="updatePeriodSpending(${p.id}, this.value)"
            />
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function updatePeriodSpending(periodId, value) {
  const monthKey = getMonthKey();
  if (!periodSpending[monthKey]) {
    periodSpending[monthKey] = { 1: 0, 2: 0, 3: 0 };
  }
  const numValue = parseFloat(value) || 0;
  periodSpending[monthKey][periodId] = numValue;

  saveBudgetData();
  loadBudgetView();
}
