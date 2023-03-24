import mjml2html from "mjml";

export const verifyEmail = ({ href }: { href: string }) => {
  return mjml2html(`<mjml>
  <mj-head>
    <mj-style inline="inline">
      .verify-button { color: #fff; text-decoration: none; background-color: #555fff; padding: 10px 24px; border-radius: 6px; font-size: 18px; }
      .footer-button { color: #bbb; text-decoration: none; font-size: 14px; }
    </mj-style>
    <mj-style inline="inline">.separate > table { border-collapse: separate; </mj-style>
  </mj-head>
  <mj-body background-color="#ffffff">
    <mj-section padding="40px">
      <mj-column padding="25px" background-color="#fff" css-class="separate" border-radius="10px" border="1px solid #eee" padding-top="20px">
        <mj-image align="left" src="https://www.chatcopilot.app/message-circle.png" width="32px" height="32px" />
        <mj-spacer height="24px" />

        <mj-text font-size="22px" font-weight="500" color="#222">Verify your email with Chatcopilot</mj-text>

        <mj-spacer height="24px" />

        <mj-text font-size="20px" color="#F45e46" font-family="helvetica">
          <a clicktracking="off" href="${href}" class="verify-button">Verify</a>
        </mj-text>

        <mj-spacer height="24px" />

        <mj-text font-size="14px" font-weight="400" line-height="18px" color="#666">This link and code will only be valid for the next 24 hours
        </mj-text>
        <mj-spacer height="25px" />

        <mj-divider border-width="1px" border-color="#f3f3f3" padding="0 20px" />
        <mj-spacer height="25px" />

        <mj-text font-size="20px" color="#F45e46" font-family="helvetica">
          <a clicktracking="off" href="https://www.chatcopilot.app" class="footer-button">Chatcopilot</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`).html;
};
