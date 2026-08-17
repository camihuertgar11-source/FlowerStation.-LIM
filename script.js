/* =========================================================
   CONFIGURACIÓN — esto es lo único que normalmente necesitas
   editar. Todo lo demás de este archivo ya funciona solo.
   ========================================================= */

// URL de tu Google Apps Script publicado como Web App.
// La consigues siguiendo los pasos de LEEME.md. Mientras la pegas,
// el formulario mostrará un aviso de error al enviar.
const GOOGLE_SCRIPT_URL = "PEGA_AQUI_TU_URL_DE_GOOGLE_APPS_SCRIPT";

// Texto que aparece en el pie de página con los datos de la feria.
const FAIR_INFO = "Feria de emprendimiento · Fecha y lugar por confirmar";

// Catálogo de productos. Agrega, edita o borra los que quieras.
// "icon" es un color de fondo para la tarjeta (no necesitas fotos).
const PRODUCTS = [
  {
    id: "llav-1",
    category: "Llaveros",
    name: "Llavero flor sencilla",
    desc: "Una flor de limpiapipas en el color que elijas.",
    price: 8000,
    color: "var(--pink)"
  },
  {
    id: "llav-2",
    category: "Llaveros",
    name: "Llavero mini ramo",
    desc: "Tres florecitas pequeñas juntas en un llavero.",
    price: 12000,
    color: "var(--yellow)"
  },
  {
    id: "maceta-1",
    category: "Cajas con maceta",
    name: "Caja + maceta chica",
    desc: "Cajita decorada con una macetita y una flor adentro.",
    price: 18000,
    color: "var(--blue)"
  },
  {
    id: "maceta-2",
    category: "Cajas con maceta",
    name: "Caja + maceta grande",
    desc: "Versión grande, ideal para regalo.",
    price: 26000,
    color: "var(--green)"
  },
  {
    id: "ramo-1",
    category: "Ramos de flores",
    name: "Ramo pequeño (5 flores)",
    desc: "Cinco flores de limpiapipas envueltas y listas para regalar.",
    price: 22000,
    color: "var(--pink)"
  },
  {
    id: "ramo-2",
    category: "Ramos de flores",
    name: "Ramo grande (10 flores)",
    desc: "Diez flores, envoltura y moño incluidos.",
    price: 38000,
    color: "var(--yellow)"
  }
];

/* =========================================================
   A partir de aquí ya no necesitas tocar nada.
   ========================================================= */

const money = (n) => "$" + n.toLocaleString("es-CO");

let cart = {}; // { productId: qty }
let activeCategory = "Todos";

const categoryTabs = document.getElementById("categoryTabs");
const productGrid = document.getElementById("productGrid");
const cartCountEl = document.getElementById("cartCount");
const orderSummary = document.getElementById("orderSummary");
const orderTotalEl = document.getElementById("orderTotal");
const drawerTotalEl = document.getElementById("drawerTotal");
const cartDrawerBody = document.getElementById("cartDrawerBody");
const submitOrderBtn = document.getElementById("submitOrderBtn");

document.getElementById("fairInfoFooter").textContent = FAIR_INFO;

function getCategories() {
  return ["Todos", ...new Set(PRODUCTS.map(p => p.category))];
}

function renderTabs() {
  categoryTabs.innerHTML = "";
  getCategories().forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "tab-btn" + (cat === activeCategory ? " active" : "");
    btn.textContent = cat;
    btn.setAttribute("role", "tab");
    btn.addEventListener("click", () => {
      activeCategory = cat;
      renderTabs();
      renderProducts();
    });
    categoryTabs.appendChild(btn);
  });
}

function renderProducts() {
  productGrid.innerHTML = "";
  const list = PRODUCTS.filter(p => activeCategory === "Todos" || p.category === activeCategory);

  list.forEach(product => {
    const qty = cart[product.id] || 0;
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-icon" style="background:${product.color}22">
        ${flowerIconSVG(product.color)}
      </div>
      <div class="product-name">${product.name}</div>
      <div class="product-desc">${product.desc}</div>
      <div class="product-price">${money(product.price)}</div>
      <div class="qty-row">
        <div class="qty-control">
          <button type="button" data-action="dec" aria-label="Quitar uno">−</button>
          <span>${qty}</span>
          <button type="button" data-action="inc" aria-label="Agregar uno">+</button>
        </div>
        <button type="button" class="add-btn ${qty > 0 ? "in-cart" : ""}" data-action="add">
          ${qty > 0 ? "En el pedido" : "Agregar"}
        </button>
      </div>
    `;

    card.querySelector('[data-action="inc"]').addEventListener("click", () => changeQty(product.id, 1));
    card.querySelector('[data-action="dec"]').addEventListener("click", () => changeQty(product.id, -1));
    card.querySelector('[data-action="add"]').addEventListener("click", () => {
      if ((cart[product.id] || 0) === 0) changeQty(product.id, 1);
    });

    productGrid.appendChild(card);
  });
}

function flowerIconSVG(color) {
  return `<svg width="46" height="46" viewBox="0 0 46 46">
    <line x1="23" y1="23" x2="23" y2="42" stroke="var(--green)" stroke-width="3" stroke-linecap="round"/>
    <g stroke="${color}" stroke-width="4" stroke-linecap="round" fill="none">
      <path d="M23 23 C14 20 12 12 16 6"/>
      <path d="M23 23 C32 20 34 12 30 6"/>
      <path d="M23 23 C14 26 8 24 4 18"/>
      <path d="M23 23 C32 26 38 24 42 18"/>
    </g>
    <circle cx="23" cy="23" r="4.5" fill="var(--green-ink)"/>
  </svg>`;
}

function changeQty(id, delta) {
  const current = cart[id] || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) delete cart[id];
  else cart[id] = next;
  renderProducts();
  renderCart();
}

function removeItem(id) {
  delete cart[id];
  renderProducts();
  renderCart();
}

function cartItems() {
  return Object.entries(cart).map(([id, qty]) => {
    const product = PRODUCTS.find(p => p.id === id);
    return { product, qty, subtotal: product.price * qty };
  });
}

function cartTotal() {
  return cartItems().reduce((sum, item) => sum + item.subtotal, 0);
}

function renderCart() {
  const items = cartItems();
  const total = cartTotal();
  const count = items.reduce((s, i) => s + i.qty, 0);

  cartCountEl.textContent = count;
  orderTotalEl.textContent = money(total);
  drawerTotalEl.textContent = money(total);
  submitOrderBtn.disabled = count === 0;

  const rowsHTML = items.length
    ? items.map(({ product, qty, subtotal }) => `
        <div class="summary-row">
          <div>
            <div class="item-name">${product.name}</div>
            <div class="item-sub">${qty} × ${money(product.price)} = ${money(subtotal)}</div>
          </div>
          <button type="button" class="item-remove" data-id="${product.id}">Quitar</button>
        </div>
      `).join("")
    : `<p class="empty-state">Todavía no has agregado nada. Vuelve al catálogo y elige tus favoritos 🌼</p>`;

  orderSummary.innerHTML = rowsHTML;
  cartDrawerBody.innerHTML = rowsHTML || `<p class="empty-state">Tu carrito está vacío.</p>`;

  [...document.querySelectorAll('.item-remove')].forEach(btn => {
    btn.addEventListener("click", () => removeItem(btn.dataset.id));
  });
}

/* ---------- Carrito lateral ---------- */
const cartDrawer = document.getElementById("cartDrawer");
const cartBackdrop = document.getElementById("cartBackdrop");

function openCart() {
  cartDrawer.classList.add("open");
  cartBackdrop.classList.add("open");
}
function closeCart() {
  cartDrawer.classList.remove("open");
  cartBackdrop.classList.remove("open");
}
document.getElementById("openCartBtn").addEventListener("click", openCart);
document.getElementById("closeCartBtn").addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);
document.getElementById("goToOrderBtn").addEventListener("click", closeCart);

/* ---------- Envío del pedido a Google Sheets ---------- */
const orderForm = document.getElementById("orderForm");
const orderSuccess = document.getElementById("orderSuccess");
const successName = document.getElementById("successName");

orderForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const items = cartItems();
  if (items.length === 0) return;

  const name = document.getElementById("buyerName").value.trim();
  const phone = document.getElementById("buyerPhone").value.trim();
  const delivery = document.getElementById("deliveryMethod").value;
  const notes = document.getElementById("buyerNotes").value.trim();

  const pedidoTexto = items
    .map(({ product, qty, subtotal }) => `${qty} x ${product.name} (${money(subtotal)})`)
    .join("; ");

  const payload = {
    nombre: name,
    celular: phone,
    entrega: delivery,
    pedido: pedidoTexto,
    total: cartTotal(),
    notas: notes
  };

  if (GOOGLE_SCRIPT_URL.includes("PEGA_AQUI")) {
    alert("Falta conectar el formulario a Google Sheets. Revisa el archivo script.js (GOOGLE_SCRIPT_URL) y el LEEME.md.");
    return;
  }

  submitOrderBtn.disabled = true;
  submitOrderBtn.textContent = "Enviando...";

  try {
    // "text/plain" evita que el navegador bloquee el envío por CORS;
    // Google Apps Script igual lo lee bien como JSON del lado del servidor.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    cart = {};
    renderProducts();
    renderCart();
    orderForm.reset();
    orderForm.hidden = true;
    successName.textContent = name ? `, ${name}` : "";
    orderSuccess.hidden = false;
    orderSuccess.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (err) {
    alert("No pudimos enviar tu pedido. Revisa tu conexión a internet e intenta de nuevo.");
  } finally {
    submitOrderBtn.textContent = "Confirmar pedido";
    submitOrderBtn.disabled = cartItems().length === 0;
  }
});

document.getElementById("newOrderBtn").addEventListener("click", () => {
  orderSuccess.hidden = true;
  orderForm.hidden = false;
});

/* ---------- Inicio ---------- */
renderTabs();
renderProducts();
renderCart();
