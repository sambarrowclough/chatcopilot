/**
 * Sends an email using the Postmark API
 */
const sendEmail = async ({
  to,
  from,
  subject,
  html,
  messageStream,
}: {
  to: string;
  from: string;
  subject: string;
  html: string;
  messageStream: "broadcast" | "outbound";
}) => {
  return fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": process.env.POSTMARK_API_TOKEN as string,
    },
    body: JSON.stringify({
      From: from,
      To: to,
      Subject: subject,
      HtmlBody: html,
      MessageStream: messageStream,
    }),
  }).then(async (r) => {
    if (r.status === 200) {
      return { data: await r.json() };
    } else {
      const message = (await r.json())?.Message;
      return {
        error: { message },
      };
    }
  });
};

export default sendEmail;
