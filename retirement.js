// retirement.js - Gerenciamento da aba de Aposentadoria

const TARGET_AMOUNT = 600000;
const END_DATE = new Date(2047, 2, 1); // março/2047

let retirementData = {
  contributions: [],
  interestRate: 6,
  targetIncome: 3000,
};

function initRetirement() {
  loadRetirementData();
  setupRetirementListeners();
}

function loadRetirementData() {
  try {
    const saved = localStorage.getItem("retirementData2");
    if (saved) {
      const parsed = JSON.parse(saved);
      retirementData.contributions = parsed.contributions.map((c) => ({
        amount: parseFloat(c.amount),
        date: new Date(c.date),
      }));
      retirementData.interestRate = parseFloat(parsed.interestRate) || 6;
      retirementData.targetIncome = parseFloat(parsed.targetIncome) || 3000;

      document.getElementById("retInterestRate").value =
        retirementData.interestRate;
      document.getElementById("retTargetIncome").value =
        retirementData.targetIncome;
    }
  } catch (e) {
    console.error("Erro ao carregar dados de aposentadoria:", e);
  }
  updateRetirementUI();
}

function saveRetirementData() {
  try {
    localStorage.setItem("retirementData2", JSON.stringify(retirementData));
  } catch (e) {
    console.error("Erro ao salvar dados de aposentadoria:", e);
  }
}

function setupRetirementListeners() {
  document
    .getElementById("retAddContribution")
    .addEventListener("click", addRetirementContribution);
  document
    .getElementById("retRecalculate")
    .addEventListener("click", recalculateRetirement);
  document
    .getElementById("retReset")
    .addEventListener("click", resetRetirementData);
  document
    .getElementById("retInterestRate")
    .addEventListener("change", updateRetirementUI);
  document
    .getElementById("retTargetIncome")
    .addEventListener("change", updateRetirementUI);
}

function addRetirementContribution() {
  const amount = parseFloat(document.getElementById("retMonthlyAmount").value);

  if (!amount || amount <= 0) {
    alert("Digite um valor válido!");
    return;
  }

  retirementData.contributions.push({
    amount: amount,
    date: new Date(),
  });

  saveRetirementData();
  updateRetirementUI();

  document.getElementById("retMonthlyAmount").value = "";
  alert("✅ Aporte registrado com sucesso!");
}

function getRemainingMonths() {
  const now = new Date();
  const years = END_DATE.getFullYear() - now.getFullYear();
  const months = END_DATE.getMonth() - now.getMonth();
  const total = years * 12 + months;
  return Math.max(0, total);
}

function calculateCurrentBalance() {
  const now = new Date();
  const monthlyRate =
    Math.pow(1 + retirementData.interestRate / 100, 1 / 12) - 1;
  let balance = 0;

  retirementData.contributions.forEach((contribution) => {
    const ageInDays = (now - contribution.date) / (1000 * 60 * 60 * 24);
    const ageInMonths = ageInDays / 30.44;
    balance += contribution.amount * Math.pow(1 + monthlyRate, ageInMonths);
  });

  return balance;
}

function calculateIdealMonthly() {
  const remainingMonths = getRemainingMonths();

  if (remainingMonths === 0) return 0;

  const monthlyRate =
    Math.pow(1 + retirementData.interestRate / 100, 1 / 12) - 1;
  const currentBalance = calculateCurrentBalance();
  const futureBalance =
    currentBalance * Math.pow(1 + monthlyRate, remainingMonths);
  const stillNeeded = TARGET_AMOUNT - futureBalance;

  if (stillNeeded <= 0) return 0;

  const idealPayment =
    (stillNeeded * monthlyRate) /
    (Math.pow(1 + monthlyRate, remainingMonths) - 1);

  return Math.max(0, idealPayment);
}

function updateRetirementUI() {
  retirementData.interestRate = parseFloat(
    document.getElementById("retInterestRate").value
  );
  retirementData.targetIncome = parseFloat(
    document.getElementById("retTargetIncome").value
  );

  const currentBalance = calculateCurrentBalance();
  const totalContributed = retirementData.contributions.reduce(
    (sum, c) => sum + c.amount,
    0
  );
  const earnings = currentBalance - totalContributed;
  const remainingMonths = getRemainingMonths();
  const idealMonthly = calculateIdealMonthly();

  document.getElementById("retCurrentBalance").textContent =
    currentBalance.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  document.getElementById("retTotalContributed").textContent =
    totalContributed.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  document.getElementById("retEarnings").textContent = earnings.toLocaleString(
    "pt-BR",
    { style: "currency", currency: "BRL" }
  );

  document.getElementById("retRemainingMonths").textContent = remainingMonths;

  document.getElementById("retIdealMonthly").textContent =
    idealMonthly.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const infoBox = document.getElementById("retInfoMessage");
  if (idealMonthly === 0) {
    infoBox.textContent = "🎉 Parabéns! Você já atingiu a meta!";
    infoBox.style.background = "#d1fae5";
    infoBox.style.borderLeftColor = "#10b981";
    infoBox.style.color = "#065f46";
  } else {
    infoBox.textContent = `Deposite R$ ${idealMonthly.toFixed(
      2
    )}/mês pelos próximos ${remainingMonths} meses para atingir R$ 600.000`;
    infoBox.style.background = "#eff6ff";
    infoBox.style.borderLeftColor = "#3b82f6";
    infoBox.style.color = "#1e40af";
  }

  updateRetirementHistory();
}

function updateRetirementHistory() {
  const container = document.getElementById("retHistoryContainer");

  if (retirementData.contributions.length === 0) {
    container.innerHTML =
      '<p style="color: #666; text-align: center;">Nenhum aporte registrado ainda</p>';
    return;
  }

  const sorted = [...retirementData.contributions].sort(
    (a, b) => b.date - a.date
  );

  container.innerHTML = sorted
    .map((c, index) => {
      const originalIndex = retirementData.contributions.findIndex(
        (contrib) =>
          contrib.date.getTime() === c.date.getTime() &&
          contrib.amount === c.amount
      );

      return `
      <div class="retirement-history-item">
        <div class="retirement-history-info">
          <div class="retirement-history-date">${c.date.toLocaleDateString(
            "pt-BR",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }
          )}</div>
          <div class="retirement-history-value">${c.amount.toLocaleString(
            "pt-BR",
            { style: "currency", currency: "BRL" }
          )}</div>
        </div>
        <div class="retirement-history-actions">
          <button class="retirement-btn-edit" onclick="editRetirementContribution(${originalIndex})" title="Editar">✏️</button>
          <button class="retirement-btn-delete" onclick="deleteRetirementContribution(${originalIndex})" title="Remover">🗑️</button>
        </div>
      </div>
    `;
    })
    .join("");
}

function editRetirementContribution(index) {
  const contribution = retirementData.contributions[index];
  const newAmount = prompt(
    "Digite o novo valor do aporte:",
    contribution.amount.toFixed(2)
  );

  if (newAmount === null) return;

  const amount = parseFloat(newAmount);

  if (!amount || amount <= 0) {
    alert("❌ Valor inválido!");
    return;
  }

  retirementData.contributions[index].amount = amount;
  saveRetirementData();
  updateRetirementUI();
  alert("✅ Aporte editado com sucesso!");
}

function deleteRetirementContribution(index) {
  const contribution = retirementData.contributions[index];
  const confirmDelete = confirm(
    `⚠️ Deseja realmente remover o aporte de ${contribution.amount.toLocaleString(
      "pt-BR",
      { style: "currency", currency: "BRL" }
    )}?\n\nData: ${contribution.date.toLocaleDateString("pt-BR")}`
  );

  if (!confirmDelete) return;

  retirementData.contributions.splice(index, 1);
  saveRetirementData();
  updateRetirementUI();
  alert("🗑️ Aporte removido com sucesso!");
}

function recalculateRetirement() {
  saveRetirementData();
  updateRetirementUI();
  alert("✅ Recálculo realizado com sucesso!");
}

function resetRetirementData() {
  if (
    confirm(
      "⚠️ Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita!"
    )
  ) {
    localStorage.removeItem("retirementData2");
    retirementData = {
      contributions: [],
      interestRate: 6,
      targetIncome: 3000,
    };
    document.getElementById("retInterestRate").value = 6;
    document.getElementById("retTargetIncome").value = 3000;
    updateRetirementUI();
    alert("🗑️ Dados resetados!");
  }
}

// Inicializar quando a página carregar
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRetirement);
} else {
  initRetirement();
}

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function () {
    const tab = this.getAttribute("data-tab");
    const monthSelector = document.querySelector(".month-selector");

    if (monthSelector) {
      // Esconder o seletor de mês na aba de aposentadoria
      if (tab === "retirement") {
        monthSelector.style.display = "none";
      } else {
        monthSelector.style.display = "flex";
      }
    }
  });
});
