/**
 * A thin, optional email adapter. Like safeTrigger in lib/pusher-server.ts, it
 * degrades to a logged no-op when unconfigured — no code path may depend on mail
 * succeeding. Configure with RESEND_API_KEY (+ MAIL_FROM), otherwise it warns.
 */

type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let warned = false;
function warnDisabled() {
  if (warned) return;
  warned = true;
  console.warn("[mailer] RESEND_API_KEY not set — email notifications are logged, not sent.");
}

export function isMailerConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Best-effort send. Never throws; returns whether it actually dispatched. */
export async function sendMail(input: MailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "Capacity Connect <no-reply@capacity-connect.gov.in>";
  if (!apiKey) {
    warnDisabled();
    console.info(`[mailer] (disabled) would send "${input.subject}" → ${input.to}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    if (!res.ok) {
      console.error(`[mailer] send failed (${res.status}) for "${input.subject}"`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[mailer] send threw", err);
    return false;
  }
}
