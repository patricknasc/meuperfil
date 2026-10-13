function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export async function sendBetaWelcomeEmail(input: {
  name: string;
  email: string;
  company?: string;
  goal?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "MeuPerfil <login@meuperfil.me>";

  if (!apiKey) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: "Welcome to the MeuPerfil beta",
      html: `
        <h2>Welcome, ${escapeHtml(input.name)}!</h2>
        <p>Thanks for joining the MeuPerfil beta.</p>
        <p><strong>Company:</strong> ${escapeHtml(input.company || "—")}</p>
        <p><strong>Goal:</strong> ${escapeHtml(input.goal || "—")}</p>
        <p>We will contact you with the next onboarding steps.</p>
      `,
    }),
  });

  if (!response.ok) {
    return false;
  }

  return true;
}
