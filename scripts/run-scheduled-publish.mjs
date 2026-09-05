const host = process.env.TITLI_WEB_HOST;
const secret = process.env.CRON_SECRET;

if (!host || !secret) {
  throw new Error("TITLI_WEB_HOST and CRON_SECRET are required.");
}

const response = await fetch(`http://${host}/api/internal/publish-scheduled`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` },
});

const body = await response.text();
if (!response.ok) {
  throw new Error(`Scheduled publication failed (${response.status}): ${body}`);
}

console.log(body);
