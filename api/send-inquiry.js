const nodemailer = require("nodemailer");

const esc = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const user = process.env.GMAIL_USER || "ajaypro123456@gmail.com";
  const pass = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

  if (!pass) {
    return res.status(200).json({ ok: false, fallback: true, reason: "GMAIL_APP_PASSWORD not configured" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const {
      name = "",
      email = "",
      mobile = "",
      packageType = "Website",
      websiteType = "",
      apkType = "",
      description = "",
      referenceUrl = "",
      pageUrl = ""
    } = body;

    if (!name || !email || !description) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass }
    });

    const subject = `New ${packageType} Inquiry from ${name} — AJ Developers`;
    const text = [
      `New Project Inquiry — AJ Developers`,
      ``,
      `Name: ${name}`,
      `Email: ${email}`,
      `Mobile Number: ${mobile || "Not provided"}`,
      `Service Package: ${packageType}`,
      `Website Type: ${websiteType}`,
      `APK Type: ${apkType || "N/A (Website only)"}`,
      `Reference URL: ${referenceUrl || "Not provided"}`,
      ``,
      `Product Description:`,
      description,
      ``,
      `Submitted From: ${pageUrl}`
    ].join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111827;">
        <div style="background:#080912;color:#ffffff;padding:20px 24px;border-radius:12px 12px 0 0;">
          <h2 style="margin:0;font-size:20px;">AJ Developers — New Project Inquiry</h2>
          <p style="margin:6px 0 0;color:#a5b4fc;font-size:13px;">${esc(packageType)} · ${esc(websiteType)}${apkType ? " (" + esc(apkType) + ")" : ""}</p>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:0;padding:20px 24px;border-radius:0 0 12px 12px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#6b7280;width:150px;"><strong>Name</strong></td><td style="padding:8px 0;">${esc(name)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;"><strong>Email</strong></td><td style="padding:8px 0;"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;"><strong>Mobile Number</strong></td><td style="padding:8px 0;"><a href="tel:${esc(mobile)}">${esc(mobile || "Not provided")}</a></td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;"><strong>Service Package</strong></td><td style="padding:8px 0;">${esc(packageType)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;"><strong>Website Type</strong></td><td style="padding:8px 0;">${esc(websiteType)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;"><strong>APK Type</strong></td><td style="padding:8px 0;">${esc(apkType || "N/A (Website only)")}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;"><strong>Reference URL</strong></td><td style="padding:8px 0;">${referenceUrl ? `<a href="${esc(referenceUrl)}">${esc(referenceUrl)}</a>` : "Not provided"}</td></tr>
          </table>
          <div style="margin-top:16px;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px;"><strong>Product Description</strong></div>
            <div style="font-size:14px;white-space:pre-wrap;line-height:1.5;">${esc(description)}</div>
          </div>
          <p style="margin-top:16px;font-size:12px;color:#9ca3af;">Submitted from: ${esc(pageUrl)}</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"AJ Developers" <${user}>`,
      to: user,
      replyTo: email,
      subject,
      text,
      html
    });

    return res.status(200).json({ ok: true, provider: "gmail-smtp" });
  } catch (err) {
    console.error("Gmail SMTP send error:", err);
    return res.status(500).json({ ok: false, fallback: true, error: err.message });
  }
};
