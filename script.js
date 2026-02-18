function scrollToForm(type) {
  document.getElementById("type").value = type;
  document.getElementById("formSection").scrollIntoView({ behavior: "smooth" });
}

function calculateCPA() {
  const adCost = document.getElementById("adCost").value;
  const contracts = document.getElementById("contracts").value;

  if (adCost && contracts && contracts > 0) {
    const cpa = adCost / contracts;
    document.getElementById("result").innerText =
      "현재 계약 CPA는 " + cpa.toLocaleString() + "원 입니다.";
  } else {
    document.getElementById("result").innerText =
      "값을 정확히 입력해주세요.";
  }
}

document.getElementById("leadForm").addEventListener("submit", function(e) {
  e.preventDefault();
  alert("신청이 접수되었습니다. 빠르게 연락드리겠습니다.");
});
