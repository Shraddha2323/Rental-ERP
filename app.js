const config = window.RENTAL_ERP_CONFIG || {};

const demoTenants = [
  {
    id: "demo-1",
    name: "Amit Sharma",
    phone: "+91 98765 43210",
    email: "amit@example.com",
    property_name: "Green Heights",
    unit_name: "A-1202",
    lease_start: "2026-01-01",
    lease_end: "2026-12-31",
    monthly_rent: 42000,
    deposit_amount: 126000,
    outstanding_amount: 0,
    status: "active",
  },
  {
    id: "demo-2",
    name: "Priya Mehta",
    phone: "+91 99887 76655",
    email: "priya@example.com",
    property_name: "Lakeview Arcade",
    unit_name: "Shop 8",
    lease_start: "2025-09-01",
    lease_end: "2026-08-31",
    monthly_rent: 56000,
    deposit_amount: 168000,
    outstanding_amount: 12000,
    status: "notice",
  },
  {
    id: "demo-3",
    name: "Rahul Iyer",
    phone: "+91 91234 56789",
    email: "rahul@example.com",
    property_name: "Palm Residency",
    unit_name: "B-403",
    lease_start: "2025-04-01",
    lease_end: "2026-03-31",
    monthly_rent: 31500,
    deposit_amount: 94500,
    outstanding_amount: 31500,
    status: "inactive",
  },
];

let tenants = [];
let searchTerm = "";
let statusFilter = "all";

const elements = {
  rows: document.querySelector("#tenantRows"),
  emptyState: document.querySelector("#emptyState"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  refreshButton: document.querySelector("#refreshButton"),
  addTenantButton: document.querySelector("#addTenantButton"),
  dialog: document.querySelector("#tenantDialog"),
  form: document.querySelector("#tenantForm"),
  totalTenants: document.querySelector("#totalTenants"),
  activeTenants: document.querySelector("#activeTenants"),
  monthlyRent: document.querySelector("#monthlyRent"),
  outstandingRent: document.querySelector("#outstandingRent"),
  connectionDot: document.querySelector("#connectionDot"),
  connectionTitle: document.querySelector("#connectionTitle"),
  connectionDetail: document.querySelector("#connectionDetail"),
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function hasSupabaseConfig() {
  return Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY);
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${config.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${config.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Database request failed with ${response.status}`);
  }

  return response.status === 204 ? [] : response.json();
}

function readLocalTenants() {
  const saved = localStorage.getItem("rental-erp-demo-tenants");
  return saved ? JSON.parse(saved) : demoTenants;
}

function writeLocalTenants(nextTenants) {
  localStorage.setItem("rental-erp-demo-tenants", JSON.stringify(nextTenants));
}

async function loadTenants() {
  setConnection("checking");

  try {
    if (hasSupabaseConfig()) {
      tenants = await supabaseRequest("tenants?select=*&order=created_at.desc");
      setConnection("live");
    } else {
      tenants = readLocalTenants();
      setConnection("demo");
    }
  } catch (error) {
    console.error(error);
    tenants = readLocalTenants();
    setConnection("offline");
  }

  render();
}

async function addTenant(tenant) {
  if (hasSupabaseConfig()) {
    const [savedTenant] = await supabaseRequest("tenants", {
      method: "POST",
      body: JSON.stringify(tenant),
    });
    tenants = [savedTenant, ...tenants];
  } else {
    const savedTenant = {
      ...tenant,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    tenants = [savedTenant, ...tenants];
    writeLocalTenants(tenants);
  }

  render();
}

function setConnection(state) {
  elements.connectionDot.className = "status-dot";

  if (state === "live") {
    elements.connectionDot.classList.add("live");
    elements.connectionTitle.textContent = "Live database";
    elements.connectionDetail.textContent = "Connected to Supabase Postgres";
    return;
  }

  if (state === "offline") {
    elements.connectionDot.classList.add("offline");
    elements.connectionTitle.textContent = "Demo fallback";
    elements.connectionDetail.textContent = "Check Supabase URL/key or policies";
    return;
  }

  if (state === "demo") {
    elements.connectionTitle.textContent = "Demo mode";
    elements.connectionDetail.textContent = "Add Supabase config to go live";
    return;
  }

  elements.connectionTitle.textContent = "Checking database";
  elements.connectionDetail.textContent = "Preparing tenant records";
}

function getFilteredTenants() {
  const term = searchTerm.trim().toLowerCase();

  return tenants.filter((tenant) => {
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    const searchable = [
      tenant.name,
      tenant.phone,
      tenant.email,
      tenant.property_name,
      tenant.unit_name,
      tenant.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesStatus && (!term || searchable.includes(term));
  });
}

function renderMetrics(filteredTenants) {
  const active = tenants.filter((tenant) => tenant.status === "active").length;
  const totalRent = filteredTenants.reduce((sum, tenant) => sum + Number(tenant.monthly_rent || 0), 0);
  const totalOutstanding = filteredTenants.reduce(
    (sum, tenant) => sum + Number(tenant.outstanding_amount || 0),
    0,
  );

  elements.totalTenants.textContent = tenants.length;
  elements.activeTenants.textContent = active;
  elements.monthlyRent.textContent = currency.format(totalRent);
  elements.outstandingRent.textContent = currency.format(totalOutstanding);
}

function renderRows(filteredTenants) {
  elements.rows.innerHTML = filteredTenants
    .map(
      (tenant) => `
        <tr>
          <td>
            <strong>${escapeHtml(tenant.name)}</strong>
            <small>${escapeHtml(tenant.phone || "No phone")} ${tenant.email ? `- ${escapeHtml(tenant.email)}` : ""}</small>
          </td>
          <td>
            <strong>${escapeHtml(tenant.property_name)}</strong>
            <small>${escapeHtml(tenant.unit_name)}</small>
          </td>
          <td>
            <strong>${formatDate(tenant.lease_start)}</strong>
            <small>to ${formatDate(tenant.lease_end)}</small>
          </td>
          <td>${currency.format(Number(tenant.monthly_rent || 0))}</td>
          <td>${currency.format(Number(tenant.deposit_amount || 0))}</td>
          <td>${currency.format(Number(tenant.outstanding_amount || 0))}</td>
          <td><span class="pill ${escapeHtml(tenant.status)}">${escapeHtml(tenant.status)}</span></td>
        </tr>
      `,
    )
    .join("");

  elements.emptyState.hidden = filteredTenants.length > 0;
}

function render() {
  const filteredTenants = getFilteredTenants();
  renderMetrics(filteredTenants);
  renderRows(filteredTenants);
}

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (match) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[match];
  });
}

elements.searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  render();
});

elements.statusFilter.addEventListener("change", (event) => {
  statusFilter = event.target.value;
  render();
});

elements.refreshButton.addEventListener("click", loadTenants);

elements.addTenantButton.addEventListener("click", () => {
  elements.form.reset();
  elements.dialog.showModal();
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitter = event.submitter?.value;
  if (submitter === "cancel") {
    elements.dialog.close();
    return;
  }

  const formData = new FormData(elements.form);
  const tenant = Object.fromEntries(formData.entries());
  tenant.monthly_rent = Number(tenant.monthly_rent || 0);
  tenant.deposit_amount = Number(tenant.deposit_amount || 0);
  tenant.outstanding_amount = Number(tenant.outstanding_amount || 0);

  try {
    await addTenant(tenant);
    elements.dialog.close();
  } catch (error) {
    console.error(error);
    alert("Could not save tenant. Please check the database setup.");
  }
});

loadTenants();
