let allProducts = [];
let visibleProducts = [];

// -----------------------------
// Fetch data
// -----------------------------
async function loadProducts() {
  const response = await fetch("data/products_with_apk.json");
  const data = await response.json();

  allProducts = data;
  visibleProducts = data;

  renderTable();
}

// -----------------------------
// Render
// -----------------------------
function renderTable() {
  const tbody = document.querySelector("#products-table tbody");
  tbody.innerHTML = "";

  for (const p of visibleProducts) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${formatName(p)}</td>
      <td>${p.categoryLevel2 || p.categoryLevel1 || ""}</td>
      <td>${p.volume}</td>
      <td>${p.alcoholPercentage}</td>
      <td>${p.price}</td>
      <td>${p.apk !== null ? p.apk.toFixed(3) : "—"}</td>
      <td>
        ${p.productUrl ? `<a href="${p.productUrl}" target="_blank">↗</a>` : ""}
      </td>
    `;

    tbody.appendChild(tr);
  }
}

// -----------------------------
// Helpers
// -----------------------------
function formatName(p) {
  return `${p.productNameBold || ""} ${p.productNameThin || ""}`.trim();
}

// -----------------------------
// Init
// -----------------------------
loadProducts();
