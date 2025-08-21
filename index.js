document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("main form");
  if (!form) return;

  form.setAttribute("novalidate", "");

  const first = document.getElementById("first-name");
  const last = document.getElementById("last-name");
  const email = document.getElementById("email-address");
  const msg = document.querySelector("textarea#message");
  const consent = document.querySelector("input.checkbox");
  const radiosBox = document.querySelector(".form-radio-container");
  const radios = radiosBox
    ? radiosBox.querySelectorAll('input[type="radio"]')
    : [];

  function ensureErrorNode(target, idBase) {
    const id = `${idBase}-error`;
    let node = document.getElementById(id);
    if (!node) {
      node = document.createElement("small");
      node.id = id;
      node.className = "instructions";
      node.hidden = true;
      node.setAttribute("role", "alert");
      const anchor = target.matches?.(
        'input[type="checkbox"], input[type="radio"]'
      )
        ? target.closest(
            ".consent-item, .form-label-field, .form-field, label"
          ) || target
        : target;
      anchor.insertAdjacentElement("afterend", node);
    }

    const current = (target.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter(Boolean);
    if (!current.includes(id)) {
      current.push(id);
      target.setAttribute("aria-describedby", current.join(" "));
    }
    target.setAttribute("aria-errormessage", id);

    return node;
  }

  function showErrorFor(el, message) {
    const base = el.id || el.name || "field";
    const err = ensureErrorNode(el, base);
    if (message) {
      err.textContent = message;
      err.hidden = false;
      el.setAttribute("aria-invalid", "true");
    } else {
      err.textContent = "";
      err.hidden = true;
      el.removeAttribute("aria-invalid");
    }
    if (el === consent);
    return !message;
  }

  function showRadioError(message) {
    if (!radiosBox) return true;
    const err = ensureErrorNode(radiosBox, "query-type");
    if (message) {
      err.textContent = message;
      err.hidden = false;
      radios.forEach((r) => r.setAttribute("aria-invalid", "true"));
    } else {
      err.textContent = "";
      err.hidden = true;
      radios.forEach((r) => r.removeAttribute("aria-invalid"));
    }
    return !message;
  }

  function validateFirst() {
    const v = (first.value || "").trim();
    if (!v) return showErrorFor(first, "First name is required.");
    if (v.length < 2 || v.length > 20)
      return showErrorFor(first, "Use 2–20 characters.");
    return showErrorFor(first, "");
  }

  function validateLast() {
    const v = (last.value || "").trim();
    if (!v) return showErrorFor(last, "Last name is required.");
    if (v.length < 2 || v.length > 20)
      return showErrorFor(last, "Use 2–20 characters.");
    return showErrorFor(last, "");
  }

  function validateEmail() {
    const v = (email.value || "").trim();
    if (!v) return showErrorFor(email, "Email is required.");
    if (!email.checkValidity())
      return showErrorFor(email, "Please enter a valid email address.");
    return showErrorFor(email, "");
  }

  function validateRadios() {
    if (!radios || !radios.length) return true;
    const anyChecked = Array.from(radios).some((r) => r.checked);
    return anyChecked
      ? showRadioError("")
      : showRadioError("Please select a query type.");
  }

  function validateMessage() {
    const v = (msg.value || "").trim();
    if (!v) return showErrorFor(msg, "Message is required.");
    if (v.length < 10)
      return showErrorFor(msg, "Please write at least 10 characters.");
    return showErrorFor(msg, "");
  }

  function validateConsent() {
    if (!consent) return true;
    const ok = !!consent.checked;
    const res = ok
      ? showErrorFor(consent, "")
      : showErrorFor(consent, "Please agree to be contacted.");
    return res;
  }

  [
    [first, validateFirst],
    [last, validateLast],
    [email, validateEmail],
    [msg, validateMessage],
  ].forEach(([el, fn]) => {
    if (!el) return;
    el.addEventListener("blur", fn);
    el.addEventListener("input", () => {
      if (el.getAttribute("aria-invalid") === "true") fn();
    });
  });

  if (consent) {
    consent.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        consent.checked = !consent.checked;
        consent.dispatchEvent(new Event("change", { bubbles: true }));
        if (typeof validateConsent === "function") validateConsent();
      }
    });
  }

  if (radiosBox && radios.length) {
    const group = Array.from(radios);

    function syncTabStops() {
      const idx = group.findIndex((r) => r.checked);
      group.forEach(
        (r, i) => (r.tabIndex = i === (idx >= 0 ? idx : 0) ? 0 : -1)
      );
    }
    syncTabStops();

    function setActive(idx) {
      const r = group[idx];
      if (!r) return;
      r.checked = true;
      r.focus();
      r.dispatchEvent(new Event("change", { bubbles: true }));
      syncTabStops();
    }

    radiosBox.addEventListener("keydown", (e) => {
      const i = group.indexOf(document.activeElement);
      if (e.key === "Enter") {
        if (i > -1) {
          e.preventDefault();
          setActive(i);
        }
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setActive(i === -1 ? 0 : (i + 1) % group.length);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setActive(
          i === -1 ? group.length - 1 : (i - 1 + group.length) % group.length
        );
      }
      if (e.key === " " || e.key === "Spacebar") e.stopPropagation();
    });

    group.forEach((r) => {
      r.addEventListener("change", () => {
        showRadioError("");
        syncTabStops();
      });
    });

    radiosBox.addEventListener("focusout", (e) => {
      if (!radiosBox.contains(e.relatedTarget)) validateRadios();
    });
  }

  form.addEventListener("submit", (e) => {
    const checks = [
      validateFirst(),
      validateLast(),
      validateEmail(),
      validateRadios(),
      validateMessage(),
      validateConsent(),
    ];

    if (checks.includes(false)) {
      e.preventDefault();
      const order = [
        first,
        last,
        email,
        msg,
        consent,
        ...(radios || []),
      ].filter(Boolean);
      const firstBad = order.find(
        (el) => el.getAttribute("aria-invalid") === "true"
      );
      if (firstBad) firstBad.focus();
      return;
    }

    e.preventDefault();

    let success = document.getElementById("success-msg");
    if (!success) {
      success = document.createElement("p");
      success.id = "success-msg";
      success.setAttribute("role", "status");
      success.hidden = true;
      form.appendChild(success);
    }

    form.querySelectorAll('small.instructions[id$="-error"]').forEach((s) => {
      s.hidden = true;
      s.textContent = "";
    });
    [first, last, email, msg, consent].forEach(
      (el) => el && el.removeAttribute("aria-invalid")
    );
    if (radios && radios.length) showRadioError("");

    success.textContent =
      "Thanks for completing the form. We'll be in touch soon!";
    success.hidden = false;

    form.reset();
  });

  form.addEventListener("reset", () => {
    setTimeout(() => {
      [first, last, email, msg, consent].forEach(
        (el) => el && el.removeAttribute("aria-invalid")
      );
      form.querySelectorAll('small.instructions[id$="-error"]').forEach((s) => {
        s.hidden = true;
        s.textContent = "";
      });
      if (radios && radios.length) showRadioError("");
    }, 0);
  });
});
