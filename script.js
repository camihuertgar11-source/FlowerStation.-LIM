
/* =========================================================
   CONFIGURACIÓN — esto es lo único que normalmente necesitas
   editar. Todo lo demás de este archivo ya funciona solo.
   ========================================================= */

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwHssw7zGKrLtZOlILHTUkQJgk551w5SQ9cIG9iONlcEAhjAlRgf8mtfrhjvi_QcGtu/exec";

// Texto que aparece en el pie de página con los datos de la feria.
const FAIR_INFO = "Feria de emprendimiento · Fecha y lugar por confirmar";

// Catálogo de productos. Agrega, edita o borra los que quieras.
// "image" es el nombre del archivo de foto (debe estar en la misma
// carpeta que index.html). Si lo borras o no se encuentra el
// archivo, se muestra un ícono dibujado en su lugar.
const PRODUCTS = [
  {
    id: "llav-1",
    category: "Llaveros",
    name: "Llavero rosa",
    desc: "Una flor de limpiapipas perfecta para llevar a todos lados.",
    price: 4000,
    image: "Llavero rosa.jpg",
    color: "var(--pink)"
  },
  {
    id: "llav-2",
    category: "Llaveros",
    name: "Llavero girasol",
    desc: "Hermoso llavero de girasol hecho con limpiapipas y para todos",
    price: 5000,
    image: "Llavero Girasol.jpg",
    color: "var(--yellow)"
  },
  {
    id: "llav-3",
    category: "Llaveros",
    name: "Llavero margarita",
    desc: "Una margarita muy colorida para llevar a todas partes",
    price: 4000,
    image: "Llavero margaritas.jpg",
    color: "var(--yellow)"
  },
  {
    id: "maceta-1",
    category: "Cajas con maceta",
    name: "Caja plastica con girasol",
    desc: "Cajita plastica con un hermoso Girasol en su maceta",
    price: 23000,
    image: "Caja Plastica de Girasol.jpg",
    color: "var(--blue)"
  },
  {
    id: "ramo-1",
    category: "Ramos de flores",
    name: "Ramo pequeño (8 flores)",
    desc: "Ocho flores de limpiapipas envueltas y listas para regalar.",
    price: 17000,
    image: "Ramo.jpg",
    color: "var(--pink)"
  },
  {
    id: "ramo-2",
    category: "Ramos de flores",
    name: "Ramo grande (10 flores)",
    desc: "Diez flores, envoltura y moño incluidos.",
    price: 22000,
    image: "Ramo 2.jpg",
    color: "var(--yellow)"
  },
  {
    id: "ramo-3",
    category: "Ramos de flores",
    name: "Ramo grande (12 flores)",
    desc: "Doce flores, perfectas para quien mas amas",
    price: 26000,
    image: "Ramo 1.jpg",
    color: "var(--blue)"
  },
  {
    id: "flor-individual",
    category: "Ramos de flores",
    name: "Flor Individual",
    desc: "Tulipanes, Rosa, Lirio o Hibicus",
    price: 10000,
    image: "Flor individual.jpg",
    color: "var(--blue)"
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
        ${productMediaHTML(product)}
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

function productMediaHTML(product) {
  if (product.image) {
    // onerror: si la foto no se encuentra (nombre mal escrito, no
    // subida todavía, etc.) vuelve a mostrar el ícono dibujado
    // para que la tarjeta nunca se vea rota.
    return `<img src="${encodeURI(product.image)}" alt="${product.name}" loading="lazy"
      onerror="this.replaceWith(iconFallback('${product.color}'))">`;
  }
  return flowerIconSVG(product.color);
}

function iconFallback(color) {
  const wrapper = document.createElement("div");
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.innerHTML = flowerIconSVG(color);
  return wrapper;
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
