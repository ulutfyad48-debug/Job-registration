/* ==========================================================================
   JobPortal — app.js
   Everything here is generic. Adding/removing/editing jobs only requires
   editing jobs.json. Site branding/text only requires editing config.json.
   ========================================================================== */

(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  const state = {
    config: null,
    jobs: [],
    currentJob: null,
    formData: {},
    referenceNumber: ""
  };

  const SCREEN_IDS = [
    "screen-code",
    "screen-details",
    "screen-form",
    "screen-payment",
    "screen-final"
  ];

  // ---------------------------------------------------------------------
  // Bootstrapping
  // ---------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    setupTheme();

    try {
      const [config, jobs] = await Promise.all([
        fetchJSON("config.json"),
        fetchJSON("jobs.json")
      ]);
      state.config = config;
      state.jobs = jobs;
      applyConfigToUI(config);
      renderProgress(0);
    } catch (err) {
      console.error("Failed to load configuration:", err);
      showFatalError();
      return;
    }

    bindEvents();
  }

  function fetchJSON(path) {
    return fetch(path, { cache: "no-store" }).then((res) => {
      if (!res.ok) throw new Error("Could not load " + path);
      return res.json();
    });
  }

  function showFatalError() {
    const el = document.getElementById("screen-code");
    if (el) {
      el.innerHTML =
        '<h1>Unable to load</h1><p>Site configuration could not be loaded. Please refresh the page or contact support.</p>';
    }
  }

  // ---------------------------------------------------------------------
  // Config → UI (branding & static text, all sourced from config.json)
  // ---------------------------------------------------------------------
  function applyConfigToUI(config) {
    const { site, text } = config;

    setText("brandName", site.shortName);
    setText("brandTagline", site.tagline);
    setText("brandMark", site.logoText);
    document.title = site.title;
    setText("footerText", site.footerText);

    setText("welcomeHeading", text.welcomeHeading);
    setText("welcomeSubtext", text.welcomeSubtext);
    document.getElementById("jobCodeInput").placeholder = text.codePlaceholder;
    setText("continueBtnText", text.continueButton);

    setText("successHeading", text.successHeading);
    setText("successSubtext", text.successSubtext);
    setText("finalHeading", text.finalHeading);
    setText("finalSubtext", text.finalSubtext);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined) el.textContent = value;
  }

  // ---------------------------------------------------------------------
  // Theme (dark / light) — persisted in localStorage
  // ---------------------------------------------------------------------
  function setupTheme() {
    const saved = localStorage.getItem("jp-theme");
    const initial = saved || "dark";
    setTheme(initial);
  }

  function setTheme(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("jp-theme", mode);
    const icon = document.getElementById("themeIcon");
    if (!icon) return;
    icon.innerHTML =
      mode === "dark"
        ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'
        : '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>';
  }

  // ---------------------------------------------------------------------
  // Screen navigation
  // ---------------------------------------------------------------------
  function showScreen(id) {
    SCREEN_IDS.forEach((sid) => {
      document.getElementById(sid).classList.toggle("hidden", sid !== id);
    });
    renderProgress(SCREEN_IDS.indexOf(id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderProgress(activeIndex) {
    const bar = document.getElementById("progressBar");
    const labels = (state.config && state.config.steps) || SCREEN_IDS;
    bar.innerHTML = "";
    labels.forEach((_, i) => {
      const step = document.createElement("div");
      step.className =
        "step" + (i < activeIndex ? " done" : i === activeIndex ? " active" : "");
      step.innerHTML = '<div class="fill"></div>';
      bar.appendChild(step);
    });
  }

  // ---------------------------------------------------------------------
  // Event bindings
  // ---------------------------------------------------------------------
  function bindEvents() {
    document.getElementById("themeToggle").addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      setTheme(current === "dark" ? "light" : "dark");
    });

    document.getElementById("continueBtn").addEventListener("click", handleCodeSubmit);
    document.getElementById("jobCodeInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleCodeSubmit();
    });

    document.getElementById("backFromDetailsBtn").addEventListener("click", () => {
      showScreen("screen-code");
    });

    document.getElementById("startRegistrationBtn").addEventListener("click", () => {
      buildForm(state.currentJob);
      showScreen("screen-form");
    });

    document.getElementById("backFromFormBtn").addEventListener("click", () => {
      showScreen("screen-details");
    });

    document.getElementById("registrationForm").addEventListener("submit", handleFormSubmit);

    document.getElementById("continueToFinalBtn").addEventListener("click", () => {
      showScreen("screen-final");
    });

    document.getElementById("whatsappBtn").addEventListener("click", sendViaWhatsApp);
    document.getElementById("pdfBtn").addEventListener("click", downloadPDF);
  }

  // ---------------------------------------------------------------------
  // Screen 1 → 2: Job code validation
  // ---------------------------------------------------------------------
  function handleCodeSubmit() {
    const input = document.getElementById("jobCodeInput");
    const errorEl = document.getElementById("codeError");
    const code = input.value.trim().toUpperCase();

    errorEl.classList.remove("show");
    input.classList.remove("shake");

    if (!code) {
      showCodeError(state.config.text.invalidCodeMessage);
      return;
    }

    const job = state.jobs.find((j) => String(j.id).toUpperCase() === code);

    if (!job) {
      showCodeError(state.config.text.invalidCodeMessage);
      return;
    }

    state.currentJob = job;
    renderJobDetails(job);
    showScreen("screen-details");
  }

  function showCodeError(message) {
    const input = document.getElementById("jobCodeInput");
    const errorEl = document.getElementById("codeError");
    errorEl.textContent = message;
    errorEl.classList.add("show");
    input.classList.add("shake");
    setTimeout(() => input.classList.remove("shake"), 400);
  }

  // ---------------------------------------------------------------------
  // Screen 2: Job details (fully derived from the matched job object)
  // ---------------------------------------------------------------------
  function renderJobDetails(job) {
    setText("detailsEyebrow", "Job Code · " + job.id);
    setText("detailsJobTitle", job.jobTitle);
    setText("detailsCompany", job.company);
    setText("detailsDescription", job.description);

    const meta = document.getElementById("detailsMeta");
    meta.innerHTML = "";
    meta.appendChild(pill(job.id, ""));
    if (job.website) meta.appendChild(pillLink(job.website));
    meta.appendChild(pill(job.registrationFee, "fee"));

    const reqList = document.getElementById("detailsRequirements");
    reqList.innerHTML = "";
    (job.requirements || []).forEach((req) => {
      const li = document.createElement("li");
      li.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg><span>' +
        escapeHTML(req) +
        "</span>";
      reqList.appendChild(li);
    });
  }

  function pill(label, extraClass) {
    const span = document.createElement("span");
    span.className = "pill" + (extraClass ? " " + extraClass : "");
    span.textContent = label;
    return span;
  }

  function pillLink(url) {
    const a = document.createElement("a");
    a.className = "pill";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "Company Website";
    return a;
  }

  // ---------------------------------------------------------------------
  // Screen 3: Dynamic form — generated purely from job.formFields
  // ---------------------------------------------------------------------
  function buildForm(job) {
    setText("formJobTitle", "Registration — " + job.jobTitle);
    const container = document.getElementById("formFieldsContainer");
    container.innerHTML = "";

    const fields = job.formFields && job.formFields.length ? job.formFields : defaultFields();

    fields.forEach((field) => {
      const wrap = document.createElement("div");
      wrap.className = "field";

      const label = document.createElement("label");
      label.setAttribute("for", "f_" + field.id);
      label.innerHTML =
        escapeHTML(field.label) + (field.required ? ' <span class="req-star">*</span>' : "");
      wrap.appendChild(label);

      let input;
      if (field.type === "select") {
        input = document.createElement("select");
        input.id = "f_" + field.id;
        const blank = document.createElement("option");
        blank.value = "";
        blank.textContent = "Select...";
        input.appendChild(blank);
        (field.options || []).forEach((opt) => {
          const o = document.createElement("option");
          o.value = opt;
          o.textContent = opt;
          input.appendChild(o);
        });
      } else if (field.type === "textarea") {
        input = document.createElement("textarea");
        input.id = "f_" + field.id;
        if (field.placeholder) input.placeholder = field.placeholder;
      } else {
        input = document.createElement("input");
        input.type = field.type || "text";
        input.id = "f_" + field.id;
        if (field.placeholder) input.placeholder = field.placeholder;
      }

      input.name = field.id;
      input.dataset.label = field.label;
      if (field.required) input.required = true;

      wrap.appendChild(input);
      container.appendChild(wrap);
    });
  }

  function defaultFields() {
    return [
      { id: "fullName", label: "Full Name", type: "text", required: true },
      { id: "country", label: "Country", type: "text", required: true },
      { id: "email", label: "Email", type: "email", required: true }
    ];
  }

  // ---------------------------------------------------------------------
  // Screen 3 → 4: Form submission
  // ---------------------------------------------------------------------
  function handleFormSubmit(e) {
    e.preventDefault();
    const form = document.getElementById("registrationForm");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const job = state.currentJob;
    const fields = job.formFields && job.formFields.length ? job.formFields : defaultFields();
    const data = {};
    fields.forEach((field) => {
      const el = document.getElementById("f_" + field.id);
      data[field.id] = { label: field.label, value: el.value.trim() };
    });

    state.formData = data;
    state.referenceNumber = generateReference(job);

    renderPaymentScreen(job);
    showScreen("screen-payment");
  }

  function generateReference(job) {
    const now = new Date();
    const stamp =
      now.getFullYear().toString().slice(2) +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());
    const rand = Math.floor(100 + Math.random() * 900);
    return job.id + "-" + stamp + "-" + rand;
  }

  function pad(n) {
    return n.toString().padStart(2, "0");
  }

  // ---------------------------------------------------------------------
  // Screen 4: Success + payment (uses job.paymentLink directly)
  // ---------------------------------------------------------------------
  function renderPaymentScreen(job) {
    setText("paymentJobTitle", job.jobTitle);
    setText("paymentFee", job.registrationFee);
    setText("paymentProvider", job.paymentProvider);
    setText("paymentInstructions", state.config.text.paymentInstructions);

    const payBtn = document.getElementById("payNowBtn");
    payBtn.href = job.paymentLink;
    payBtn.textContent = state.config.text.payNowButton + " (" + job.registrationFee + ")";
  }

  // ---------------------------------------------------------------------
  // Screen 5: Final — WhatsApp deep link + PDF download
  // ---------------------------------------------------------------------
  function sendViaWhatsApp() {
    const job = state.currentJob;
    const number = (job.whatsapp || state.config.site.defaultWhatsapp || "").replace(/\D/g, "");
    const message = buildSummaryText(job, state.formData, state.referenceNumber, "\n");
    const url = "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
    window.open(url, "_blank");
  }

  function buildSummaryText(job, formData, ref, newline) {
    const lines = [];
    lines.push("New Job Registration");
    lines.push("Job: " + job.jobTitle + " (" + job.id + ")");
    lines.push("Company: " + job.company);
    lines.push("Reference #: " + ref);
    lines.push("");
    Object.values(formData).forEach((entry) => {
      lines.push(entry.label + ": " + (entry.value || "-"));
    });
    lines.push("");
    lines.push("Registration Fee: " + job.registrationFee);
    return lines.join(newline);
  }

  function downloadPDF() {
    const job = state.currentJob;
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      alert("PDF library failed to load. Please check your internet connection and try again.");
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 48;
    let y = 60;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Job Registration Receipt", marginX, y);
    y += 28;

    doc.setDrawColor(200);
    doc.line(marginX, y, 545, y);
    y += 24;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const now = new Date();
    const rows = [
      ["Job Title", job.jobTitle],
      ["Job Code", job.id],
      ["Company", job.company],
      ["Reference Number", state.referenceNumber],
      ["Date & Time", now.toLocaleString()]
    ];

    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label + ":", marginX, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), marginX + 150, y);
      y += 20;
    });

    y += 10;
    doc.setDrawColor(230);
    doc.line(marginX, y, 545, y);
    y += 26;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Applicant Information", marginX, y);
    y += 20;

    doc.setFontSize(11);
    Object.values(state.formData).forEach((entry) => {
      if (y > 760) {
        doc.addPage();
        y = 60;
      }
      doc.setFont("helvetica", "bold");
      doc.text(entry.label + ":", marginX, y);
      doc.setFont("helvetica", "normal");
      const valueLines = doc.splitTextToSize(String(entry.value || "-"), 340);
      doc.text(valueLines, marginX + 170, y);
      y += 18 * valueLines.length;
    });

    y += 10;
    doc.setDrawColor(230);
    doc.line(marginX, y, 545, y);
    y += 24;

    doc.setFont("helvetica", "bold");
    doc.text("Registration Fee: ", marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(job.registrationFee), marginX + 130, y);
    y += 26;

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      "This is a system-generated registration receipt. Keep it for your records.",
      marginX,
      y
    );

    doc.save("Registration-" + job.id + "-" + state.referenceNumber + ".pdf");
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
