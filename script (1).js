const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector(".nav-links");

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.textContent = isOpen ? "× Close" : "☰ Menu";
  });
  document.querySelectorAll(".nav-links a").forEach((link) =>
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.textContent = "☰ Menu";
    }),
  );
}

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  revealItems.forEach((item) => revealObserver.observe(item));
} else revealItems.forEach((item) => item.classList.add("visible"));

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

// Pre-select a product when a visitor arrives from the product catalogue.
const productFromUrl = new URLSearchParams(window.location.search).get(
  "product",
);
const productSelect = document.querySelector("#product");
if (productFromUrl && productSelect) productSelect.value = productFromUrl;

const enquiryForm = document.querySelector("#enquiry-form");
if (enquiryForm) {
  enquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const note = document.querySelector("#form-note");
    const data = Object.fromEntries(new FormData(form).entries());
    const whatsappText = `Hi Nikhil, I am ${data.name}. I am interested in ${data.product}. Quantity/delivery: ${data.quantity || "not specified"}. ${data.message}`;
    const whatsappUrl = `https://wa.me/918087362932?text=${encodeURIComponent(whatsappText)}`;
    note.textContent = "Sending the email notification...";
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (!response.ok) throw new Error("Email service returned an error");
      note.textContent =
        "Email notification sent. Opening WhatsApp with the same enquiry...";
    } catch (error) {
      note.textContent =
        "Email service needs activation or is unavailable. Opening WhatsApp so the enquiry is not lost.";
    }
    window.open(whatsappUrl, "_blank", "noopener");
    form.reset();
  });
}

const invoiceForm = document.querySelector("#invoice-form");
const invoiceFields = invoiceForm
  ? invoiceForm.querySelectorAll("input, select, textarea")
  : [];
const invoiceData = () => {
  const form = document.querySelector("#invoice-form");
  if (!form) return null;
  const data = Object.fromEntries(new FormData(form).entries());
  data.quantity = Number(data.quantity || 0);
  data.price = Number(data.price || 0);
  data.total = data.quantity * data.price;
  return data;
};
const updateInvoicePreview = () => {
  const data = invoiceData();
  if (!data) return;
  const set = (id, value) => {
    const element = document.querySelector(id);
    if (element) element.textContent = value;
  };
  set("#preview-number", data.invoiceNumber || "NP-2026-001");
  set("#preview-buyer", data.buyerName || "Customer name");
  set("#preview-address", data.address || "Delivery address will appear here.");
  set("#preview-product", data.product || "Select a product");
  set("#preview-qty", `${data.quantity} kg × ₹${data.price.toFixed(2)}`);
  set("#preview-total", `₹${data.total.toFixed(2)}`);
  set("#preview-date", `Draft date: ${new Date().toLocaleDateString("en-IN")}`);
};
if (invoiceForm) {
  invoiceFields.forEach((field) =>
    field.addEventListener("input", updateInvoicePreview),
  );
  updateInvoicePreview();
  invoiceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = invoiceData();
    const note = document.querySelector("#invoice-note");
    if (!window.jspdf) {
      note.textContent = "PDF library is still loading. Please try again.";
      return;
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.setTextColor(23, 63, 54);
    pdf.setFontSize(20);
    pdf.text("NP NATURALS", 20, 24);
    pdf.setFontSize(16);
    pdf.text("Quotation / Invoice Draft", 20, 36);
    pdf.setTextColor(90, 100, 95);
    pdf.setFontSize(10);
    pdf.text(`Number: ${data.invoiceNumber}`, 140, 24);
    pdf.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 140, 31);
    pdf.line(20, 44, 190, 44);
    pdf.setTextColor(23, 32, 29);
    pdf.text(`Buyer: ${data.buyerName}`, 20, 58);
    pdf.text(`Email: ${data.buyerEmail || "Not provided"}`, 20, 65);
    pdf.text(`Address: ${data.address || "Not provided"}`, 20, 72);
    pdf.line(20, 84, 190, 84);
    pdf.text("Product", 20, 96);
    pdf.text("Quantity", 115, 96);
    pdf.text("Price / kg", 145, 96);
    pdf.text("Amount", 175, 96);
    pdf.text(data.product, 20, 108);
    pdf.text(`${data.quantity} kg`, 115, 108);
    pdf.text(`₹${data.price.toFixed(2)}`, 145, 108);
    pdf.text(`₹${data.total.toFixed(2)}`, 175, 108);
    pdf.line(20, 116, 190, 116);
    pdf.setFontSize(13);
    pdf.text(`Total: ₹${data.total.toFixed(2)}`, 140, 130);
    pdf.setFontSize(9);
    pdf.setTextColor(90, 100, 95);
    pdf.text(
      "Draft generated in the browser. Confirm final tax, payment and delivery terms with NP Naturals.",
      20,
      155,
    );
    pdf.text(
      "NP Naturals | Nashik, Maharashtra | +91 80873 62932 | npnaturals.india@gmail.com",
      20,
      170,
    );
    pdf.save(`${data.invoiceNumber || "np-naturals-invoice"}.pdf`);
    note.textContent =
      "PDF downloaded. Please confirm final details before using it as an official invoice.";
  });
  document.querySelector("#invoice-whatsapp").addEventListener("click", () => {
    const data = invoiceData();
    const text = `Hi Nikhil, invoice/quote ${data.invoiceNumber} for ${data.buyerName}: ${data.quantity} kg of ${data.product} at ₹${data.price}/kg. Total draft: ₹${data.total.toFixed(2)}.`;
    window.open(
      `https://wa.me/918087362932?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener",
    );
  });
}

// Simple cart and payment handoff for the Products page.
const cartModal = document.querySelector("#cart-modal");
const cartItems = document.querySelector("#cart-items");
const cartTotal = document.querySelector("#cart-total");
const checkoutTotal = document.querySelector("#checkout-total");
const cart = [];
const money = (value) => `₹${Number(value).toLocaleString("en-IN")}`;
const renderCart = () => {
  if (!cartItems) return;
  cartItems.innerHTML = cart.length
    ? cart
        .map(
          (item, index) =>
            `<div class="cart-line"><div><strong>${item.product}</strong><small>${money(item.price)} / kg</small></div><div class="quantity-control"><button type="button" data-quantity="${index}" data-change="-1">−</button><span>${item.quantity} kg</span><button type="button" data-quantity="${index}" data-change="1">+</button></div><strong>${money(item.price * item.quantity)}</strong></div>`,
        )
        .join("")
    : '<p class="empty-cart">Your cart is empty. Choose a product to begin.</p>';
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (cartTotal) cartTotal.textContent = money(total);
  if (checkoutTotal) checkoutTotal.textContent = money(total);
  cartItems.querySelectorAll("[data-quantity]").forEach((button) =>
    button.addEventListener("click", () => {
      const index = Number(button.dataset.quantity);
      cart[index].quantity += Number(button.dataset.change);
      if (cart[index].quantity < 1) cart.splice(index, 1);
      renderCart();
    }),
  );
};
const openCart = () => {
  if (!cartModal) return;
  cartModal.classList.add("is-open");
  cartModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
  renderCart();
};
const closeCart = () => {
  if (!cartModal) return;
  cartModal.classList.remove("is-open");
  cartModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
};
document.querySelectorAll(".buy-button").forEach((button) =>
  button.addEventListener("click", () => {
    const product = button.dataset.product;
    const price = Number(button.dataset.price);
    const existing = cart.find((item) => item.product === product);
    if (existing) existing.quantity += 1;
    else cart.push({ product, price, quantity: 1 });
    openCart();
  }),
);
document
  .querySelectorAll("[data-close-cart]")
  .forEach((button) => button.addEventListener("click", closeCart));
const paymentButton = document.querySelector("#go-to-payment");
if (paymentButton)
  paymentButton.addEventListener("click", () => {
    if (!cart.length) return;
    document.querySelector('[data-cart-step="cart"]').hidden = true;
    document.querySelector('[data-cart-step="payment"]').hidden = false;
    renderCart();
  });
const backToCart = document.querySelector("#back-to-cart");
if (backToCart)
  backToCart.addEventListener("click", () => {
    document.querySelector('[data-cart-step="payment"]').hidden = true;
    document.querySelector('[data-cart-step="cart"]').hidden = false;
  });
const checkoutForm = document.querySelector("#checkout-form");
if (checkoutForm)
  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(checkoutForm).entries());
    const order = cart
      .map(
        (item) =>
          `${item.product} (${item.quantity} kg × ${money(item.price)})`,
      )
      .join(", ");
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const message = `Hi Nikhil, I want to place an order. Products: ${order}. Total: ${money(total)}. Name: ${data.name}. Phone: ${data.phone}. Address: ${data.address}. Payment preference: ${data.payment}.`;
    const note = document.querySelector("#checkout-note");
    note.textContent =
      "Opening WhatsApp with your cart and delivery details. NP Naturals will confirm payment instructions and delivery charges.";
    window.open(
      `https://wa.me/918087362932?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener",
    );
  });

// UPI links copied from the previous NP Naturals checkout.
const setUpiPaymentLinks = () => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderText = cart
    .map((item) => `${item.product} ${item.quantity}kg`)
    .join(", ");
  const note = encodeURIComponent(`${orderText} - NP Naturals`);
  const upi = `upi://pay?pa=9322362932@ybl&pn=NP%20Naturals&am=${total}&cu=INR&tn=${note}`;
  const setHref = (id, value) => {
    const link = document.querySelector(`#${id}`);
    if (link) link.href = value;
  };
  setHref("upi-any", upi);
  setHref(
    "gpay",
    `tez://upi/pay?pa=9322362932@ybl&pn=NP%20Naturals&am=${total}&cu=INR&tn=${note}`,
  );
  setHref(
    "phonepe",
    `phonepe://pay?pa=9322362932@ybl&pn=NP%20Naturals&am=${total}&cu=INR&tn=${note}`,
  );
  setHref(
    "paytm",
    `paytmmp://pay?pa=9322362932@ybl&pn=NP%20Naturals&am=${total}&cu=INR&tn=${note}`,
  );
  const qr = document.querySelector("#upi-qr");
  if (qr)
    qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upi)}`;
};
if (paymentButton) paymentButton.addEventListener("click", setUpiPaymentLinks);

// Reusable WhatsApp enquiry popup on every page.
const inquiryModal = document.querySelector("#inquiry-modal");
const openInquiry = document.querySelector("#open-inquiry");
const closeInquiry = () => {
  if (!inquiryModal) return;
  inquiryModal.classList.remove("is-open");
  inquiryModal.setAttribute("aria-hidden", "true");
  if (openInquiry) openInquiry.setAttribute("aria-expanded", "false");
  document.body.classList.remove("inquiry-open");
};
if (openInquiry && inquiryModal)
  openInquiry.addEventListener("click", () => {
    inquiryModal.classList.add("is-open");
    inquiryModal.setAttribute("aria-hidden", "false");
    openInquiry.setAttribute("aria-expanded", "true");
    document.body.classList.add("inquiry-open");
    document.querySelector("#quick-name")?.focus();
  });
document
  .querySelectorAll("[data-close-inquiry]")
  .forEach((button) => button.addEventListener("click", closeInquiry));
const quickInquiryForm = document.querySelector("#quick-inquiry-form");
if (quickInquiryForm)
  quickInquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(quickInquiryForm).entries());
    const message = `Hi Nikhil, I have a product enquiry for NP Naturals.\n\nName / company: ${data.name}\nEmail: ${data.email || "Not provided"}\nPhone / WhatsApp: ${data.phone}\nProduct: ${data.product}\nMessage: ${data.message}`;
    window.open(
      `https://wa.me/918087362932?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener",
    );
    const note = quickInquiryForm.querySelector(".form-note");
    if (note)
      note.textContent = "WhatsApp opened with your enquiry. Thank you.";
  });

// Six-section SPA navigation with active-section highlighting.
const spaSections = document.querySelectorAll(".spa-section");
const spaNavLinks = document.querySelectorAll('.nav-links a[href^="#"]');
if (spaSections.length && spaNavLinks.length) {
  const setActiveSection = (id) => {
    spaNavLinks.forEach((link) =>
      link.classList.toggle("active", link.getAttribute("href") === `#${id}`),
    );
    if (window.location.hash !== `#${id}`)
      history.replaceState(null, "", `#${id}`);
  };
  const spaObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    },
    { root: document.querySelector(".spa-body"), threshold: [0.35, 0.6, 0.8] },
  );
  spaSections.forEach((section) => spaObserver.observe(section));
  spaNavLinks.forEach((link) =>
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "auto", block: "start" });
      history.replaceState(null, "", link.getAttribute("href"));
      setActiveSection(target.id);
    }),
  );
  const initial = window.location.hash
    ? document.querySelector(window.location.hash)
    : null;
  if (initial && initial.classList.contains("spa-section"))
    setTimeout(
      () => initial.scrollIntoView({ behavior: "auto", block: "start" }),
      50,
    );
}

const exportForm = document.querySelector("#export-enquiry-form");
if (exportForm)
  exportForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(exportForm).entries());
    const message = `Hi Nikhil, I have a GLOBAL & INDIAN EXPORT buyer enquiry for NP Naturals.\n\nName: ${data.name}\nCompany: ${data.company}\nCountry: ${data.country}\nProduct: ${data.product}\nQuantity: ${data.quantity}\nPackaging: ${data.packaging}\nDestination: ${data.destination}\nWhatsApp / Phone: ${data.phone}\nEmail: ${data.email}\nRequirements: ${data.requirements}`;
    window.open(
      `https://wa.me/918087362932?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener",
    );
    const note = document.querySelector("#export-form-note");
    if (note)
      note.textContent =
        "WhatsApp opened with your full buyer enquiry. NP Naturals will review the requirement and prepare a custom quote.";
  });
