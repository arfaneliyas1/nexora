module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (body._honey) return res.status(200).json({ ok: true });

  const name = String(body.name || "").trim().slice(0, 200);
  const email = String(body.email || "").trim().slice(0, 200);
  const pkg = String(body.package || "").trim().slice(0, 200);
  const message = String(body.message || "").trim().slice(0, 5000);

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false });
  }

  const payload = {
    name,
    email,
    package: pkg,
    message,
    _subject: "Himalayan Academy enquiry",
    _template: "table",
    _captcha: "false",
  };

  try {
    const forwarded = await fetch(
      "https://formsubmit.co/ajax/ajune7834@gmail.com",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const text = await forwarded.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({ ok: false });
    }
    if (data.success === false || data.success === "false") {
      return res.status(502).json({ ok: false });
    }
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ ok: false });
  }
};
