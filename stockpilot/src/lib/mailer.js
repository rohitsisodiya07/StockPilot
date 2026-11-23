import nodemailer from "nodemailer";

/**
 * Send an email via Brevo REST API (https://api.brevo.com/v3/smtp/email)
 */
async function sendViaBrevoApi({ to, name, subject, html, text, fromEmail, apiKey }) {
    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": apiKey,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                sender: {
                    name: "StockPilot ERP",
                    email: fromEmail,
                },
                to: [
                    {
                        email: to,
                        name: name || to.split("@")[0],
                    },
                ],
                subject,
                htmlContent: html,
                textContent: text,
            }),
        });

        const data = await response.json().catch(() => null);

        if (response.ok) {
            console.log(`[Mailer - Brevo API] Email successfully sent to ${to}. MessageId:`, data?.messageId);
            return { success: true, messageId: data?.messageId, provider: "brevo-api" };
        } else {
            console.warn(`[Mailer - Brevo API] API returned status ${response.status}:`, data);
            return { success: false, error: data?.message || "Brevo API Error", code: data?.code };
        }
    } catch (err) {
        console.error("[Mailer - Brevo API] Network Exception:", err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Send an email via Brevo SMTP Relay (smtp-relay.brevo.com:587)
 */
async function sendViaBrevoSmtp({ to, subject, html, text, fromEmail, apiKey }) {
    const smtpLogin = process.env.BREVO_SMTP_LOGIN || fromEmail;
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            secure: false,
            auth: {
                user: smtpLogin,
                pass: apiKey,
            },
        });

        const info = await transporter.sendMail({
            from: `"StockPilot ERP" <${fromEmail}>`,
            to,
            subject,
            text,
            html,
        });

        console.log(`[Mailer - Brevo SMTP] Email successfully sent to ${to}. MessageId:`, info.messageId);
        return { success: true, messageId: info.messageId, provider: "brevo-smtp" };
    } catch (err) {
        console.warn("[Mailer - Brevo SMTP] Relay Error:", err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Universal email dispatch supporting Brevo API, Brevo SMTP, Generic SMTP, and Console Simulator fallback
 */
export async function sendEmail({ to, name = "", subject, html, text }) {
    const brevoApiKey = (process.env.BREVO_API_KEY || "").trim();
    const brevoFromEmail = (process.env.BREVO_FROM_EMAIL || "rohitsisodiya2596@gmail.com").trim();

    // 1. Try Brevo
    if (brevoApiKey) {
        // A. If key starts with xkeysib- (Brevo REST API key), call Brevo REST API
        if (brevoApiKey.startsWith("xkeysib-")) {
            const apiRes = await sendViaBrevoApi({ to, name, subject, html, text, fromEmail: brevoFromEmail, apiKey: brevoApiKey });
            if (apiRes.success) return apiRes;
        }

        // B. If key starts with xsmtpsib- (Brevo SMTP key) or REST API failed, try Brevo SMTP
        const smtpRes = await sendViaBrevoSmtp({ to, subject, html, text, fromEmail: brevoFromEmail, apiKey: brevoApiKey });
        if (smtpRes.success) return smtpRes;

        // C. If key didn't start with xkeysib-, also attempt REST API just in case
        if (!brevoApiKey.startsWith("xkeysib-")) {
            const apiRes = await sendViaBrevoApi({ to, name, subject, html, text, fromEmail: brevoFromEmail, apiKey: brevoApiKey });
            if (apiRes.success) return apiRes;
        }
    }

    // 2. Generic SMTP fallback if configured
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
        try {
            const port = Number(process.env.SMTP_PORT) || 587;
            const transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass },
            });
            const from = process.env.SMTP_FROM || `"StockPilot ERP" <${user}>`;
            const info = await transporter.sendMail({ from, to, subject, text, html });
            console.log(`[Mailer - SMTP] Sent to ${to}: ${info.messageId}`);
            return { success: true, messageId: info.messageId, provider: "smtp" };
        } catch (err) {
            console.warn("[Mailer - SMTP Error]:", err.message);
        }
    }

    // 3. Fallback: Console simulator so application and Admin workflows never crash
    console.log("==================== [STOCKPILOT EMAIL DISPATCH SIMULATOR] ====================");
    console.log(`To: ${to}`);
    console.log(`From: ${brevoFromEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text || "(HTML Email rendered)"}`);
    console.log("===============================================================================");

    return {
        success: true,
        simulated: true,
        message: "Email logged in console simulator.",
    };
}

/**
 * Scenario 1: Send approval confirmation email when Admin approves self-registered user
 */
export async function sendAccountApprovedEmail({
    to,
    name,
    roleName = "Warehouse Staff",
    warehouseName = "Main Warehouse",
    loginUrl = "http://localhost:3000",
}) {
    const subject = `Your StockPilot Account is Approved! Warehouse: ${warehouseName}`;
    const text = `Hello ${name},\n\nGreat news! Your StockPilot ERP account has been approved by the Administrator.\n\nRole: ${roleName}\nAssigned Warehouse: ${warehouseName}\n\nYou can now sign in to your workspace here: ${loginUrl}\n\nBest regards,\nStockPilot Operations Team`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <title>Account Approved</title>
        <style>
            * { box-sizing: border-box; }
            body {
                margin: 0;
                padding: 10px;
                background-color: #f1f5f9;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
                color: #1e293b;
                word-break: break-word;
                overflow-wrap: break-word;
            }
            .wrapper {
                width: 100%;
                max-width: 480px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            .header {
                background: #0f172a;
                padding: 22px 16px 18px;
                text-align: center;
                color: #ffffff;
            }
            .badge {
                display: inline-block;
                padding: 3px 10px;
                border-radius: 20px;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                background: rgba(34, 197, 94, 0.18);
                color: #4ade80;
                border: 1px solid rgba(34, 197, 94, 0.35);
                margin-bottom: 8px;
            }
            .header h1 {
                margin: 0;
                font-size: 18px;
                font-weight: 700;
                color: #ffffff;
                line-height: 1.3;
            }
            .header p {
                margin: 4px 0 0;
                font-size: 11px;
                color: #94a3b8;
            }
            .content {
                padding: 18px 16px;
                font-size: 13px;
                line-height: 1.55;
                color: #334155;
            }
            .highlight-card {
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 10px;
                padding: 12px 14px;
                margin: 14px 0;
            }
            .info-row {
                margin-bottom: 8px;
            }
            .info-row:last-child {
                margin-bottom: 0;
            }
            .info-label {
                font-size: 10.5px;
                color: #15803d;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.4px;
                margin-bottom: 2px;
            }
            .info-val {
                font-size: 13px;
                font-weight: 700;
                color: #14532d;
            }
            .btn {
                display: block;
                width: 100%;
                max-width: 250px;
                margin: 18px auto 8px;
                background: #2563eb;
                color: #ffffff !important;
                font-size: 13px;
                font-weight: 700;
                text-decoration: none;
                text-align: center;
                padding: 11px 16px;
                border-radius: 9px;
            }
            .footer {
                padding: 12px 14px;
                text-align: center;
                font-size: 10.5px;
                color: #94a3b8;
                border-top: 1px solid #f1f5f9;
                background: #f8fafc;
            }
            @media only screen and (max-width: 480px) {
                body { padding: 4px; }
                .content { padding: 14px 12px; }
                .header { padding: 18px 12px 14px; }
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="header">
                <span class="badge">Account Approved</span>
                <h1>Welcome to StockPilot</h1>
                <p>Enterprise Inventory & Operations</p>
            </div>
            <div class="content">
                <p style="margin-top: 0; font-size: 13.5px;">Hello <strong>${name}</strong>,</p>
                <p style="margin: 0 0 12px 0;">Your registration request has been approved by the System Administrator.</p>
                
                <div class="highlight-card">
                    <div class="info-row">
                        <div class="info-label">Assigned Role</div>
                        <div class="info-val">${roleName}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Assigned Facility / Warehouse</div>
                        <div class="info-val">${warehouseName}</div>
                    </div>
                </div>

                <p style="font-size: 12.5px; color: #64748b; margin: 12px 0;">
                    You can now sign in with your registered email and password to access your warehouse workspace.
                </p>
                
                <a href="${loginUrl}" class="btn">Sign In to Workspace &rarr;</a>

                <p style="font-size: 11px; color: #94a3b8; margin: 18px 0 0 0; text-align: center;">
                    If you did not request this, please contact your administrator.
                </p>
            </div>
            <div class="footer">
                StockPilot ERP &bull; Automated System Dispatch
            </div>
        </div>
    </body>
    </html>
    `;

    return await sendEmail({ to, name, subject, html, text });
}

/**
 * Scenario 2: Send email with email & password when Admin directly creates a user
 */
export async function sendUserCreatedByAdminEmail({
    to,
    name,
    email,
    password,
    roleName = "Warehouse Staff",
    warehouseName = "Main Warehouse",
    loginUrl = "http://localhost:3000",
}) {
    const subject = `Your StockPilot ERP Account Credentials`;
    const text = `Hello ${name},\n\nYour StockPilot ERP account has been created by the System Administrator.\n\nHere are your sign-in credentials:\nPortal URL: ${loginUrl}\nEmail: ${email}\nPassword: ${password}\nRole: ${roleName}\nAssigned Warehouse: ${warehouseName}\n\nPlease sign in and change your password upon first login.\n\nBest regards,\nStockPilot Operations Team`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <title>Account Credentials</title>
        <style>
            * { box-sizing: border-box; }
            body {
                margin: 0;
                padding: 10px;
                background-color: #f1f5f9;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
                color: #1e293b;
                word-break: break-word;
                overflow-wrap: break-word;
            }
            .wrapper {
                width: 100%;
                max-width: 480px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            .header {
                background: #0f172a;
                padding: 22px 16px 18px;
                text-align: center;
                color: #ffffff;
            }
            .badge {
                display: inline-block;
                padding: 3px 10px;
                border-radius: 20px;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                background: rgba(99, 102, 241, 0.22);
                color: #a5b4fc;
                border: 1px solid rgba(99, 102, 241, 0.4);
                margin-bottom: 8px;
            }
            .header h1 {
                margin: 0;
                font-size: 18px;
                font-weight: 700;
                color: #ffffff;
                line-height: 1.3;
            }
            .header p {
                margin: 4px 0 0;
                font-size: 11px;
                color: #94a3b8;
            }
            .content {
                padding: 18px 16px;
                font-size: 13px;
                line-height: 1.55;
                color: #334155;
            }
            .cred-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 12px 14px;
                margin: 14px 0;
            }
            .cred-item {
                padding: 7px 0;
                border-bottom: 1px solid #f1f5f9;
            }
            .cred-item:last-child {
                border-bottom: none;
                padding-bottom: 2px;
            }
            .cred-label {
                font-size: 10.5px;
                color: #64748b;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                margin-bottom: 2px;
            }
            .cred-val {
                font-size: 13px;
                font-weight: 700;
                color: #0f172a;
                word-break: break-all;
                overflow-wrap: anywhere;
            }
            .cred-val-mono {
                font-family: Consolas, Monaco, 'Courier New', monospace;
                background: #eef2ff;
                color: #4338ca;
                padding: 3px 8px;
                border-radius: 5px;
                border: 1px solid #c7d2fe;
                display: inline-block;
                font-size: 12px;
                font-weight: 700;
                margin-top: 2px;
            }
            .btn {
                display: block;
                width: 100%;
                max-width: 250px;
                margin: 18px auto 8px;
                background: #4f46e5;
                color: #ffffff !important;
                font-size: 13px;
                font-weight: 700;
                text-decoration: none;
                text-align: center;
                padding: 11px 16px;
                border-radius: 9px;
            }
            .warning-box {
                font-size: 11.5px;
                color: #b91c1c;
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 8px 12px;
                margin-top: 14px;
                line-height: 1.4;
            }
            .footer {
                padding: 12px 14px;
                text-align: center;
                font-size: 10.5px;
                color: #94a3b8;
                border-top: 1px solid #f1f5f9;
                background: #f8fafc;
            }
            @media only screen and (max-width: 480px) {
                body { padding: 4px; }
                .content { padding: 14px 12px; }
                .header { padding: 18px 12px 14px; }
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="header">
                <span class="badge">Account Provisioned</span>
                <h1>Welcome to StockPilot ERP</h1>
                <p>Your Workspace Account is Ready</p>
            </div>
            <div class="content">
                <p style="margin-top: 0; font-size: 13.5px;">Hello <strong>${name}</strong>,</p>
                <p style="margin: 0 0 12px 0;">Your official StockPilot ERP account has been created. Here are your credentials:</p>
                
                <div class="cred-card">
                    <div class="cred-item">
                        <div class="cred-label">Sign-In Email</div>
                        <div class="cred-val">${email}</div>
                    </div>
                    <div class="cred-item">
                        <div class="cred-label">Temporary Password</div>
                        <div class="cred-val"><span class="cred-val-mono">${password}</span></div>
                    </div>
                    <div class="cred-item">
                        <div class="cred-label">Assigned Role</div>
                        <div class="cred-val">${roleName}</div>
                    </div>
                    <div class="cred-item">
                        <div class="cred-label">Assigned Facility / Warehouse</div>
                        <div class="cred-val">${warehouseName}</div>
                    </div>
                </div>

                <a href="${loginUrl}" class="btn">Sign In to Your Workspace &rarr;</a>

                <div class="warning-box">
                    <strong>Security Notice:</strong> Please sign in and update your password on first login to secure your account.
                </div>
            </div>
            <div class="footer">
                StockPilot ERP &bull; Automated System Dispatch
            </div>
        </div>
    </body>
    </html>
    `;

    return await sendEmail({ to, name, subject, html, text });
}

/**
 * Scenario 3: Send 6-digit OTP email for password reset
 */
export async function sendPasswordResetOtpEmail({ to, name, otp }) {
    const subject = `Your StockPilot Password Reset OTP: ${otp}`;
    const text = `Hello ${name},\n\nYou requested to reset your password for StockPilot ERP.\n\nYour 6-digit Verification Code (OTP) is: ${otp}\n\nThis OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email or contact security.\n\nBest regards,\nStockPilot Security Team`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <title>Password Reset OTP</title>
        <style>
            * { box-sizing: border-box; }
            body {
                margin: 0;
                padding: 10px;
                background-color: #f1f5f9;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
                color: #1e293b;
                word-break: break-word;
                overflow-wrap: break-word;
            }
            .wrapper {
                width: 100%;
                max-width: 480px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            .header {
                background: #0f172a;
                padding: 22px 16px 18px;
                text-align: center;
                color: #ffffff;
            }
            .badge {
                display: inline-block;
                padding: 3px 10px;
                border-radius: 20px;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                background: rgba(239, 68, 68, 0.2);
                color: #fca5a5;
                border: 1px solid rgba(239, 68, 68, 0.4);
                margin-bottom: 8px;
            }
            .header h1 {
                margin: 0;
                font-size: 18px;
                font-weight: 700;
                color: #ffffff;
                line-height: 1.3;
            }
            .header p {
                margin: 4px 0 0;
                font-size: 11px;
                color: #94a3b8;
            }
            .content {
                padding: 18px 16px;
                font-size: 13px;
                line-height: 1.55;
                color: #334155;
            }
            .otp-container {
                background: #f8fafc;
                border: 2px dashed #cbd5e1;
                border-radius: 12px;
                padding: 18px 12px;
                text-align: center;
                margin: 18px 0;
            }
            .otp-code {
                font-family: Consolas, Monaco, 'Courier New', monospace;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: 8px;
                color: #0f172a;
                margin: 8px 0;
            }
            .otp-exp {
                font-size: 11px;
                color: #64748b;
                font-weight: 600;
            }
            .warning-box {
                font-size: 11.5px;
                color: #64748b;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 10px 12px;
                margin-top: 14px;
                line-height: 1.45;
            }
            .footer {
                padding: 12px 14px;
                text-align: center;
                font-size: 10.5px;
                color: #94a3b8;
                border-top: 1px solid #f1f5f9;
                background: #f8fafc;
            }
            @media only screen and (max-width: 480px) {
                body { padding: 4px; }
                .content { padding: 14px 12px; }
                .header { padding: 18px 12px 14px; }
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="header">
                <span class="badge">Verification Required</span>
                <h1>Password Reset Code</h1>
                <p>StockPilot Security Authentication</p>
            </div>
            <div class="content">
                <p style="margin-top: 0; font-size: 13.5px;">Hello <strong>${name}</strong>,</p>
                <p style="margin: 0 0 12px 0;">We received a request to reset your password. Use the verification code below to proceed:</p>
                
                <div class="otp-container">
                    <div style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700;">Your One-Time Code</div>
                    <div class="otp-code">${otp}</div>
                    <div class="otp-exp">⏱ Valid for 10 minutes</div>
                </div>

                <div class="warning-box">
                    🔒 <strong>Security Warning:</strong> Never share this OTP with anyone. StockPilot support representatives will never ask for your verification code.
                </div>
            </div>
            <div class="footer">
                StockPilot ERP &bull; Automated Security Dispatch
            </div>
        </div>
    </body>
    </html>
    `;

    return await sendEmail({ to, name, subject, html, text });
}
