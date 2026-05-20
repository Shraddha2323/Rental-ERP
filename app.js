const config = window.RENTAL_ERP_CONFIG || {};
const firebaseSdkVersion = "11.10.0";

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
let firebaseModules;
let firestoreDb;

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
  statusChart: document.querySelector("#statusChart"),
  rentChart: document.querySelector("#rentChart"),
  statusLegend: document.querySelector("#statusLegend"),
  rentLegend: document.querySelector("#rentLegend"),
  collectionRate: document.querySelector("#collectionRate"),
  collectionFill: document.querySelector("#collectionFill"),
  outstandingBars: document.querySelector("#outstandingBars"),
  connectionDot: document.querySelector("#connectionDot"),
  connectionTitle: document.querySelector("#connectionTitle"),
  connectionDetail: document.querySelector("#connectionDetail"),
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const chartColors = ["#126b57", "#2f6fbb", "#d49b2a", "#c8524f", "#6b5dd3", "#4a9c8c"];

function hasFirebaseConfig() {
  return Boolean(config.FIREBASE_API_KEY && config.FIREBASE_PROJECT_ID && config.FIREBASE_APP_ID);
}

async function getFirebase() {
  if (!firebaseModules) {
    const [{ initializeApp }, firestore] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-firestore.js`),
    ]);

    const app = initializeApp({
      apiKey: config.FIREBASE_API_KEY,
      authDomain: config.FIREBASE_AUTH_DOMAIN,
      projectId: config.FIREBASE_PROJECT_ID,
      storageBucket: config.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
      appId: config.FIREBASE_APP_ID,
    });

    firestoreDb = firestore.getFirestore(app);
    firebaseModules = firestore;
  }

  return { db: firestoreDb, firestore: firebaseModules };
}

async function loadFirestoreTenants() {
  const { db, firestore } = await getFirebase();
  const snapshot = await firestore.getDocs(firestore.collection(db, "tenants"));

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .sort((first, second) => getCreatedAtMillis(second.created_at) - getCreatedAtMillis(first.created_at));
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
    if (hasFirebaseConfig()) {
      tenants = await loadFirestoreTenants();
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
  if (hasFirebaseConfig()) {
    const { db, firestore } = await getFirebase();
    const tenantToSave = {
      ...tenant,
      created_at: firestore.serverTimestamp(),
      updated_at: firestore.serverTimestamp(),
    };
    const docRef = await firestore.addDoc(firestore.collection(db, "tenants"), tenantToSave);
    tenants = [{ ...tenant, id: docRef.id, created_at: new Date().toISOString() }, ...tenants];
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
    elements.connectionDetail.textContent = "Connected to Firebase Firestore";
    return;
  }

  if (state === "offline") {
    elements.connectionDot.classList.add("offline");
    elements.connectionTitle.textContent = "Demo fallback";
    elements.connectionDetail.textContent = "Check Firebase config or rules";
    return;
  }

  if (state === "demo") {
    elements.connectionTitle.textContent = "Demo mode";
    elements.connectionDetail.textContent = "Add Firebase config to go live";
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

function renderAnalytics(filteredTenants) {
  const statusData = ["active", "notice", "inactive"].map((status, index) => ({
    label: status,
    value: filteredTenants.filter((tenant) => tenant.status === status).length,
    color: chartColors[index],
  }));

  const rentByProperty = groupByValue(filteredTenants, "property_name", "monthly_rent").map((item, index) => ({
    ...item,
    color: chartColors[index % chartColors.length],
  }));

  const totalRent = filteredTenants.reduce((sum, tenant) => sum + Number(tenant.monthly_rent || 0), 0);
  const totalOutstanding = filteredTenants.reduce(
    (sum, tenant) => sum + Number(tenant.outstanding_amount || 0),
    0,
  );
  const expected = totalRent + totalOutstanding;
  const collectionRate = expected > 0 ? Math.round((totalRent / expected) * 100) : 0;

  drawDonutChart(elements.statusChart, statusData);
  drawDonutChart(elements.rentChart, rentByProperty);
  renderLegend(elements.statusLegend, statusData, "count");
  renderLegend(elements.rentLegend, rentByProperty, "currency");
  renderCollection(collectionRate, filteredTenants);
}

function groupByValue(records, labelKey, valueKey) {
  const grouped = records.reduce((accumulator, record) => {
    const label = record[labelKey] || "Unassigned";
    accumulator[label] = (accumulator[label] || 0) + Number(record[valueKey] || 0);
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((first, second) => second.value - first.value);
}

function drawDonutChart(canvas, segments) {
  const context = canvas.getContext("2d");
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 10;
  const total = segments.reduce((sum, segment) => sum + Number(segment.value || 0), 0);

  context.clearRect(0, 0, size, size);

  if (!total) {
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.strokeStyle = "#edf1f7";
    context.lineWidth = 26;
    context.stroke();
    return;
  }

  let startAngle = -Math.PI / 2;
  segments.forEach((segment) => {
    const sliceAngle = (segment.value / total) * Math.PI * 2;
    context.beginPath();
    context.arc(center, center, radius, startAngle, startAngle + sliceAngle);
    context.strokeStyle = segment.color;
    context.lineWidth = 28;
    context.lineCap = "round";
    context.stroke();
    startAngle += sliceAngle;
  });

  context.fillStyle = "#1d2433";
  context.font = "700 22px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(total.toLocaleString("en-IN"), center, center - 6);
  context.fillStyle = "#667085";
  context.font = "700 11px system-ui, sans-serif";
  context.fillText("total", center, center + 17);
}

function renderLegend(container, segments, mode) {
  const total = segments.reduce((sum, segment) => sum + Number(segment.value || 0), 0);
  const visibleSegments = segments.filter((segment) => Number(segment.value || 0) > 0);

  container.innerHTML = (visibleSegments.length ? visibleSegments : [{ label: "No data", value: 0, color: "#d9e0ec" }])
    .map((segment) => {
      const percent = total > 0 ? Math.round((segment.value / total) * 100) : 0;
      const value = mode === "currency" ? currency.format(segment.value) : segment.value;
      return `
        <div class="legend-row">
          <span class="legend-dot" style="background: ${segment.color}"></span>
          <span>${escapeHtml(formatLabel(segment.label))}</span>
          <strong>${value}${total > 0 ? ` (${percent}%)` : ""}</strong>
        </div>
      `;
    })
    .join("");
}

function renderCollection(collectionRate, filteredTenants) {
  elements.collectionRate.textContent = `${collectionRate}%`;
  elements.collectionFill.style.width = `${collectionRate}%`;

  const owingTenants = filteredTenants
    .filter((tenant) => Number(tenant.outstanding_amount || 0) > 0)
    .sort((first, second) => Number(second.outstanding_amount || 0) - Number(first.outstanding_amount || 0))
    .slice(0, 4);
  const maxOutstanding = Math.max(...owingTenants.map((tenant) => Number(tenant.outstanding_amount || 0)), 1);

  elements.outstandingBars.innerHTML = owingTenants.length
    ? owingTenants
        .map((tenant) => {
          const outstanding = Number(tenant.outstanding_amount || 0);
          const width = Math.max(4, Math.round((outstanding / maxOutstanding) * 100));
          return `
            <div class="bar-row">
              <header>
                <span>${escapeHtml(tenant.name)}</span>
                <strong>${currency.format(outstanding)}</strong>
              </header>
              <div class="bar-track"><span style="width: ${width}%"></span></div>
            </div>
          `;
        })
        .join("")
    : `<div class="empty-state">No outstanding rent in this view.</div>`;
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
  renderAnalytics(filteredTenants);
  renderRows(filteredTenants);
}

function formatLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getCreatedAtMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  return new Date(value).getTime() || 0;
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
