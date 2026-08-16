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
    const serving = document.querySelector("#serving");
    const local = document.querySelector("#local");
    if (data.city && data.country) {
      serving.textContent = `Viewing from ${data.city}, ${data.country}`;
    }
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
const note = form?.querySelector(".note");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (note) note.hidden = false;
  form.reset();
});

loadFx();
loadPlace();
