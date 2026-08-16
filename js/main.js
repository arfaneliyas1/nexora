const btn = document.querySelector(".menu-btn");
const menu = document.querySelector("#menu");

const reveals = document.querySelectorAll(".reveal");
reveals.forEach((el) => {
  if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
    el.classList.add("in");
  }
});
document.documentElement.classList.add("js");

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

btn?.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  btn.setAttribute("aria-expanded", String(open));
});

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menu.classList.remove("open");
    btn?.setAttribute("aria-expanded", "false");
  });
});

const legal = document.querySelector("#disclaimer");
const legalKey = "ha-disclaimer";

function openLegal() {
  if (legal && !legal.open) legal.showModal();
}

document.querySelectorAll('a[href="#disclaimer"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openLegal();
  });
});

legal?.addEventListener("click", (event) => {
  if (event.target === legal) legal.close();
});

legal?.addEventListener("close", () => {
  sessionStorage.setItem(legalKey, "1");
  if (location.hash === "#disclaimer") {
    history.replaceState(null, "", location.pathname + location.search);
  }
});

if (location.hash === "#disclaimer") {
  openLegal();
} else if (!sessionStorage.getItem(legalKey)) {
  const delay = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 800;
  setTimeout(openLegal, delay);
}

function fetchJson(url, ms = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function loadFx() {
  const line = document.querySelector("#fx-line");
  try {
    const res = await fetchJson("https://open.er-api.com/v6/latest/GBP");
    const data = await res.json();
    const usd = data.rates?.USD;
    const eur = data.rates?.EUR;
    if (!usd || !eur) throw new Error("no rates");
    line.textContent = `All prices in GBP · 1 GBP ≈ $${usd.toFixed(2)} / €${eur.toFixed(2)}`;
    document.querySelectorAll(".fx").forEach((el) => {
      const gbp = Number(el.dataset.gbp);
      el.textContent = `≈ $${Math.round(gbp * usd)} · €${Math.round(gbp * eur)}`;
    });
  } catch {
    line.textContent = "All prices in GBP";
  }
}

async function loadPlace() {
  try {
    const res = await fetchJson("https://ipwho.is/");
    const data = await res.json();
    if (!data?.success) return;
    const local = document.querySelector("#local");
    const tz = typeof data.timezone === "string" ? data.timezone : data.timezone?.id;
    if (tz) {
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: tz,
      });
      local.textContent = `Your local time: ${time} · reply within 24 hours`;
    }
  } catch {
    /* defaults stay */
  }
}

const form = document.querySelector("#form");
const noteOk = form?.querySelector(".note:not(.err)");
const noteErr = form?.querySelector(".note.err");
const submitBtn = form?.querySelector('[type="submit"]');

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (noteOk) noteOk.hidden = true;
  if (noteErr) noteErr.hidden = true;

  if (form.elements._honey?.value) {
    if (noteOk) noteOk.hidden = false;
    form.reset();
    return;
  }

  const payload = Object.fromEntries(new FormData(form));
  delete payload._honey;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
  }

  try {
    if (!payload.access_key) throw new Error("missing key");
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) throw new Error(data.message || "send failed");
    form.reset();
    if (noteOk) noteOk.hidden = false;
  } catch {
    if (noteErr) noteErr.hidden = false;
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
    }
  }
});

loadFx();
loadPlace();

function initMap() {
  const el = document.querySelector("#map");
  if (!el || !window.L || el._leaflet_id) return;

  const scotland = [56.4907, -4.2026];
  const map = L.map(el, {
    scrollWheelZoom: false,
    zoomControl: false,
    attributionControl: true,
  }).setView(scotland, 5);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    subdomains: "abcd",
    maxZoom: 18,
  }).addTo(map);

  const pin = L.divIcon({
    className: "map-pin",
    html: '<span class="map-dot"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  L.marker(scotland, { icon: pin })
    .addTo(map)
    .bindPopup("Himalayan Academy · Scotland");

  const refresh = () => map.invalidateSize();
  setTimeout(refresh, 300);
  el.closest(".reveal")?.addEventListener("transitionend", refresh);
}

initMap();
