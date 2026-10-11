const form = document.getElementById("calculatorForm");
const inputA = document.getElementById("numberA");
const inputB = document.getElementById("numberB");

const resultSection = document.getElementById("resultSection");
const resultValue = document.getElementById("resultValue");
const equation = document.getElementById("equation");
const errorMessage = document.getElementById("errorMessage");

const stepsSection = document.getElementById("stepsSection");
const stepsList = document.getElementById("stepsList");

const swapBtn = document.getElementById("swapBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const stepsBtn = document.getElementById("stepsBtn");

let currentResult = "";
let calculationSteps = [];

// Format a digit string with Indian-style comma separators.
function formatIndianNumber(value) {
  const digits = String(value);
  const lastThree = digits.slice(-3);
  const remaining = digits.slice(0, -3);

  if (!remaining) return lastThree;

  return remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",")
    + "," + lastThree;
}

// Create a readable expression for one diagonal.
function formatExpression(terms) {
  return terms.map(term => `${term.a} × ${term.b}`).join(" + ");
}

// Urdhva Tiryagbhyam: vertically and crosswise multiplication.
function vedicMultiply(numberA, numberB) {
  // Store digits from right to left.
  const a = numberA.split("").reverse().map(Number);
  const b = numberB.split("").reverse().map(Number);

  const outputDigits = [];
  const steps = [];
  let carry = 0;

  // Each diagonal has digit pairs whose positions add to k.
  for (let k = 0; k < a.length + b.length - 1; k++) {
    const terms = [];
    let sum = carry;

    for (let i = 0; i < a.length; i++) {
      const j = k - i;

      if (j >= 0 && j < b.length) {
        terms.push({
          a: a[i],
          b: b[j]
        });

        sum += a[i] * b[j];
      }
    }

    const digit = sum % 10;
    const nextCarry = Math.floor(sum / 10);

    outputDigits.push(digit);

    steps.push({
      position: k + 1,
      terms: terms,
      expression: formatExpression(terms),
      incomingCarry: carry,
      sum: sum,
      digit: digit,
      nextCarry: nextCarry
    });

    carry = nextCarry;
  }

  // Append any remaining carry digits.
  while (carry > 0) {
    outputDigits.push(carry % 10);
    carry = Math.floor(carry / 10);
  }

  // Reverse the digits to form the final answer.
  const product = outputDigits.reverse().join("").replace(/^0+(?=\d)/, "");

  return {
    product,
    steps
  };
}

// Validate inputs and run the calculation.
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const rawA = inputA.value.trim();
  const rawB = inputB.value.trim();

  errorMessage.textContent = "";
  resultSection.hidden = true;
  stepsSection.hidden = true;

  if (!/^\d+$/.test(rawA) || !/^\d+$/.test(rawB)) {
    errorMessage.textContent =
      "Please enter valid non-negative whole numbers using digits only.";
    return;
  }

  if (rawA.length > 30 || rawB.length > 30) {
    errorMessage.textContent =
      "Please enter numbers with no more than 30 digits.";
    return;
  }

  const a = rawA.replace(/^0+(?=\d)/, "");
  const b = rawB.replace(/^0+(?=\d)/, "");

  const calculation = vedicMultiply(a, b);

  currentResult = calculation.product;
  calculationSteps = calculation.steps;

  resultValue.textContent = formatIndianNumber(currentResult);
  equation.textContent =
    `${formatIndianNumber(a)} × ${formatIndianNumber(b)} = ${formatIndianNumber(currentResult)}`;

  renderSteps(calculationSteps);

  resultSection.hidden = false;
  stepsSection.hidden = false;

  copyBtn.textContent = "▣ Copy result";
  stepsBtn.textContent = "↑ Calculation steps";

  resultSection.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
});

// Display the calculation, including carries.
function renderSteps(steps) {
  stepsList.replaceChildren();

  steps.forEach(function (step) {
    const card = document.createElement("article");
    card.className = "step-card";

    const header = document.createElement("div");
    header.className = "step-header";

    const title = document.createElement("span");
    title.className = "step-name";
    title.textContent = `Diagonal ${step.position}`;

    const badge = document.createElement("span");
    badge.className = "step-badge";
    badge.textContent = `Digit: ${step.digit}`;

    header.append(title, badge);

    const math = document.createElement("div");
    math.className = "step-math";
    math.textContent = step.expression || "0";

    const detail = document.createElement("p");
    detail.className = "step-detail";

    const carryText = step.incomingCarry
      ? ` + incoming carry ${step.incomingCarry}`
      : "";

    detail.textContent =
      `Sum: ${step.expression || "0"}${carryText} = ${step.sum}. ` +
      `Write ${step.digit} in this position; carry ${step.nextCarry} forward.`;

    card.append(header, math, detail);
    stepsList.appendChild(card);
  });
}

// Swap the two input values.
swapBtn.addEventListener("click", function () {
  const temporary = inputA.value;
  inputA.value = inputB.value;
  inputB.value = temporary;

  if (inputA.value.trim() && inputB.value.trim()) {
    form.requestSubmit();
  }
});

// Clear the calculator.
clearBtn.addEventListener("click", function () {
  form.reset();

  resultSection.hidden = true;
  stepsSection.hidden = true;
  errorMessage.textContent = "";

  currentResult = "";
  calculationSteps = [];

  inputA.focus();
});

// Copy the product to the clipboard.
copyBtn.addEventListener("click", async function () {
  if (currentResult === "") return;

  try {
    await navigator.clipboard.writeText(currentResult);
    copyBtn.textContent = "✓ Copied!";
  } catch {
    errorMessage.textContent =
      "Clipboard access is unavailable. Select and copy the result manually.";
  }
});

// Show or hide the working steps.
stepsBtn.addEventListener("click", function () {
  stepsSection.hidden = !stepsSection.hidden;

  stepsBtn.textContent = stepsSection.hidden
    ? "↓ View calculation steps"
    : "↑ Hide calculation steps";

  if (!stepsSection.hidden) {
    stepsSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
});

// Automatically update the footer year.
document.getElementById("year").textContent = new Date().getFullYear();
