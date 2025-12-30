// ============================================
// JORNADA 100K - LÓGICA INTEGRADA
// ============================================
const J100K_STORAGE_KEY = "jornada100k_data";
const J100K_GOAL = 100000;

let j100kData = {
  startingBalance: 0,
  targetMonths: 48,
  months: [],
};

function j100k_loadData() {
  const saved = localStorage.getItem(J100K_STORAGE_KEY);
  if (saved) {
    j100kData = JSON.parse(saved);
  }
}

function j100k_saveData() {
  localStorage.setItem(J100K_STORAGE_KEY, JSON.stringify(j100kData));
}

function j100k_openConfigModal() {
  document.getElementById("j100k_configModal").classList.add("active");
}

function j100k_closeConfigModal() {
  document.getElementById("j100k_configModal").classList.remove("active");
}

function j100k_initializeFromModal() {
  j100k_initialize();
  j100k_closeConfigModal();
}

function j100k_initialize() {
  const startingBalance =
    parseFloat(document.getElementById("j100k_startingBalance").value) || 0;
  const targetMonths =
    parseInt(document.getElementById("j100k_targetMonths").value) || 48;

  j100kData = {
    startingBalance: startingBalance,
    targetMonths: targetMonths,
    months: [],
  };

  const today = new Date();
  for (let i = 0; i < targetMonths; i++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
    j100kData.months.push({
      date: monthDate.toISOString(),
      deposit: 0,
      balance: 0,
    });
  }

  j100k_saveData();
  j100k_updateDisplay();
  j100k_renderMonths();
}

function j100k_updateDisplay() {
  const totalDeposits = j100kData.months.reduce((sum, m) => sum + m.deposit, 0);
  const currentBalance = j100kData.startingBalance + totalDeposits;
  const remaining = J100K_GOAL - currentBalance;
  const progress = (currentBalance / J100K_GOAL) * 100;

  const today = new Date();
  const completedMonths = j100kData.months.filter((m) => {
    const monthDate = new Date(m.date);
    return monthDate < today && m.deposit > 0;
  }).length;

  const monthsRemaining = j100kData.targetMonths - completedMonths;
  const recommendedDeposit =
    monthsRemaining > 0 ? remaining / monthsRemaining : 0;

  document.getElementById("j100k_currentAmount").textContent =
    "R$ " + currentBalance.toLocaleString("pt-BR");
  document.getElementById("j100k_remaining").textContent =
    "R$ " + Math.max(0, remaining).toLocaleString("pt-BR");
  document.getElementById("j100k_monthsRemaining").textContent = Math.max(
    0,
    monthsRemaining
  );
  document.getElementById("j100k_recommendedDeposit").textContent =
    "R$ " +
    Math.max(0, recommendedDeposit).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const progressBar = document.getElementById("j100k_progressBar");
  const progressText = document.getElementById("j100k_progressText");
  progressBar.style.width = Math.min(100, progress) + "%";
  progressText.textContent = progress.toFixed(1) + "%";
}

function j100k_renderMonths() {
  const container = document.getElementById("j100k_monthsContainer");
  container.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let runningBalance = j100kData.startingBalance;

  j100kData.months.forEach((month, index) => {
    const monthDate = new Date(month.date);
    monthDate.setHours(0, 0, 0, 0);

    const isCurrent =
      monthDate.getMonth() === today.getMonth() &&
      monthDate.getFullYear() === today.getFullYear();

    runningBalance += month.deposit;
    month.balance = runningBalance;

    const monthItem = document.createElement("div");
    monthItem.className = "month-item";
    if (month.deposit > 0) monthItem.classList.add("completed");
    if (isCurrent) monthItem.classList.add("current");

    const monthName = monthDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    monthItem.innerHTML = `
            <div class="month-date">${monthName}</div>
            <div class="month-input-wrapper">
              <input 
                type="number" 
                value="${month.deposit || ""}" 
                placeholder="R$ 0,00"
                id="j100k_month_${index}"
                step="0.01"
                min="0"
              />
              <button class="btn save-btn" onclick="j100k_saveMonth(${index})">💾 Salvar</button>
            </div>
            <div class="month-balance">
              R$ ${runningBalance.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
              <div class="month-status">${
                month.deposit > 0 ? "✅ Aporte realizado" : "⏳ Pendente"
              }</div>
            </div>
          `;

    container.appendChild(monthItem);
  });
}

function j100k_saveMonth(index) {
  const input = document.getElementById(`j100k_month_${index}`);
  const value = parseFloat(input.value) || 0;
  j100kData.months[index].deposit = value;
  j100k_saveData();
  j100k_updateDisplay();
  j100k_renderMonths();
}

function j100k_resetAll() {
  if (
    confirm(
      "Tem certeza que deseja resetar todos os dados? Esta ação não pode ser desfeita."
    )
  ) {
    localStorage.removeItem(J100K_STORAGE_KEY);
    j100kData = {
      startingBalance: 0,
      targetMonths: 48,
      months: [],
    };
    document.getElementById("j100k_startingBalance").value = 0;
    document.getElementById("j100k_targetMonths").value = 48;
    j100k_updateDisplay();
    document.getElementById("j100k_monthsContainer").innerHTML =
      '<p style="color: #8b92a7; text-align: center; padding: 20px;">Configure o planejamento inicial para começar</p>';
  }
}

// Inicializar quando a aba Jornada 100k for aberta
document.addEventListener("DOMContentLoaded", function () {
  j100k_loadData();
  if (j100kData.months.length > 0) {
    j100k_updateDisplay();
    j100k_renderMonths();
  }

  // Controlar visibilidade do seletor de mês
  const navItems = document.querySelectorAll(".nav-item");
  const monthSelector = document.getElementById("monthSelector");

  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      const tab = this.getAttribute("data-tab");

      // Esconder o seletor de mês apenas na aba jornada100k
      if (tab === "jornada100k") {
        monthSelector.style.display = "none";
      } else {
        monthSelector.style.display = "flex";
      }
    });
  });
});
