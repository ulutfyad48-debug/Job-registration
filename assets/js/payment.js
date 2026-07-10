/* ==========================================================================
   payment.js — powers payment.html
   Reads ?job=CODE from the URL, looks up that job in jobs.json, and shows
   the matching payment account from config.json's "paymentAccounts".
   Editing account numbers/names is done in config.json only.
   ========================================================================== */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    setupTheme();
    bindThemeToggle();

    const params = new URLSearchParams(window.location.search);
    const jobCode = (params.get("job") || "").toUpperCase();

    let config, jobs;
    try {
      [config, jobs] = await Promise.all([
        fetch("config.json", { cache: "no-store" }).then((r) => r.json()),
        fetch("jobs.json", { cache: "no-store" }).then((r) => r.json())
      ]);
    } catch (err) {
      console.error(err);
      return;
    }

    applyBranding(config);

    const job = jobs.find((j) => String(j.id).toUpperCase() === jobCode) || jobs[0];
    if (!job) return;

    const account = (config.paymentAccounts && config.paymentAccounts[job.paymentProvider]) || {};

    setText("payJobTitle", job.jobTitle);
    setText("payFee", job.registrationFee);
    setText("payMethod", job.paymentProvider);

    if (account.bankName) {
      document.getElementById("bankNameRow").style.display = "flex";
      setText("bankName", account.bankName);
    }

    setText("accountName", account.accountTitle || account.accountName || "—");
    setText("payInstructions", account.instructions || job.paymentNote || "");

    const numberInput = document.getElementById("accountNumber");
    numberInput.value = account.accountNumber || "Contact us on WhatsApp for details";

    const ibanRow = document.getElementById("ibanRow");
    if (account.iban) {
      ibanRow.classList.remove("hidden");
      document.getElementById("ibanNumber").value = account.iban;
      document.getElementById("copyIbanBtn").addEventListener("click", () => copyField("ibanNumber", config));
    } else {
      ibanRow.classList.add("hidden");
    }

    document.getElementById("copyBtn").addEventListener("click", () => copyField("accountNumber", config));

    document.getElementById("paidBtn").addEventListener("click", () => {
      const number = (job.whatsapp || config.site.defaultWhatsapp || "").replace(/\D/g, "");
      const message =
        "I have paid the registration fee for: " +
        job.jobTitle +
        " (" + job.id + ")\n" +
        "Amount: " + job.registrationFee + "\n" +
        "Please confirm my registration. I am attaching my payment screenshot.";
      window.open("https://wa.me/" + number + "?text=" + encodeURIComponent(message), "_blank");
    });
  }

  function applyBranding(config) {
    setText("brandName", config.site.shortName);
    setText("brandTagline", config.site.tagline);
    setText("brandMark", config.site.logoText);
    setText("footerText", config.site.footerText);
    setText("payHeading", config.text.payPageHeading);
    setText("paySubtext", config.text.payPageSubtext);
    document.getElementById("copyBtn").textContent = config.text.copyButton;
    document.getElementById("paidBtn").lastChild.textContent = " " + config.text.iHavePaidButton;
    setText("backBtn", config.text.backToSiteButton);
    document.title = config.text.payPageHeading + " — " + config.site.shortName;
  }

  function copyField(inputId, config) {
    const input = document.getElementById(inputId);
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value).then(() => {
      const btn = inputId === "ibanNumber" ? document.getElementById("copyIbanBtn") : document.getElementById("copyBtn");
      const original = btn.textContent;
      btn.textContent = config.text.copiedButton;
      setTimeout(() => (btn.textContent = original), 1500);
    });
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined) el.textContent = value;
  }

  function setupTheme() {
    const saved = localStorage.getItem("jp-theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
  }

  function bindThemeToggle() {
    document.getElementById("themeToggle").addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("jp-theme", next);
    });
  }
})();
