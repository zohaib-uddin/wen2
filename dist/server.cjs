var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/lib/email.ts
var email_exports = {};
__export(email_exports, {
  sendAdminNewUserNotification: () => sendAdminNewUserNotification,
  sendAdminReplyEmail: () => sendAdminReplyEmail,
  sendInvoiceEmail: () => sendInvoiceEmail,
  sendOrderConfirmationEmail: () => sendOrderConfirmationEmail
});
async function sendOrderConfirmationEmail(order, user) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Resend Email Service] Missing RESEND_API_KEY environment variable. Skipping email transmission.");
    return { success: false, error: "Missing Resend API Key" };
  }
  try {
    const resend = new import_resend.Resend(apiKey);
    const customerEmail = user?.email || "";
    if (!customerEmail) {
      console.warn("[Resend Email Service] No email coordinates found for user. Skipping.");
      return { success: false, error: "Missing customer email" };
    }
    const customerName = user?.fullName || user?.name || "Valued Client";
    const orderNumber = order.order_number;
    const totalAmount = Number(order.total_amount).toLocaleString();
    const address = order.shipping_address;
    const city = order.city;
    let itemsHtml = "";
    if (order.order_items && Array.isArray(order.order_items)) {
      itemsHtml = order.order_items.map((item) => `
        <tr style="border-bottom: 1px solid #EAEAEA;">
          <td style="padding: 10px 0; font-family: sans-serif; font-size: 14px; color: #333333;">
            ${item.products?.name || "Premium Formulations Recipe"}
          </td>
          <td style="padding: 10px 0; font-family: sans-serif; font-size: 14px; text-align: center; color: #666666;">
            ${item.quantity}
          </td>
          <td style="padding: 10px 0; font-family: sans-serif; font-size: 14px; text-align: right; color: #333333; font-weight: bold;">
            Rs. ${Number(item.price).toLocaleString()}
          </td>
        </tr>
      `).join("");
    }
    const emailContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Order Confirmation - Wen Hair & Skin Secret</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #FBFBEE; font-family: sans-serif; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #FBFBEE;">
          <tr>
            <td align="center" style="padding: 30px 10px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #E1DEC5; overflow: hidden; box-shadow: 0 4px 15px rgba(31, 77, 58, 0.04);">
                
                <!-- luxury Header Banner -->
                <tr style="background-color: #1F4D3A; text-align: center;">
                  <td style="padding: 35px 20px;">
                    <h1 style="color: #C9A227; font-family: sans-serif; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 3px; text-transform: uppercase;">
                      Wen Hair & Skin Secret
                    </h1>
                    <p style="color: #ffffff; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 4px 0 0 0; opacity: 0.9;">
                      Royal Botanical Archives
                    </p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <span style="font-family: sans-serif; font-size: 11px; font-weight: bold; color: #C9A227; text-transform: uppercase; letter-spacing: 2px;">Order Secured</span>
                    <h2 style="font-family: serif; font-size: 22px; color: #1F4D3A; margin: 5px 0 15px 0; font-weight: bold;">
                      Order Confirmed, ${customerName}!
                    </h2>
                    <p style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #555555; margin: 0 0 30px 0;">
                      Thank you for choosing Wen Hair & Skin Secret. We have received your order details and our botanists are actively preparing your high-potency formulations.
                    </p>

                    <!-- Receipt Details Box -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px; border-bottom: 2px solid #1F4D3A; padding-bottom: 12px;">
                      <tr>
                        <td style="font-family: sans-serif; font-size: 11px; color: #888888; text-transform: uppercase; font-weight: bold; padding-bottom: 4px;">
                          Order Number
                        </td>
                        <td style="font-family: sans-serif; font-size: 11px; color: #888888; text-transform: uppercase; font-weight: bold; text-align: right; padding-bottom: 4px;">
                          Payment Method
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family: monospace; font-size: 16px; color: #1F4D3A; font-weight: bold;">
                          ${orderNumber}
                        </td>
                        <td style="font-family: sans-serif; font-size: 14px; color: #333333; text-align: right; font-weight: bold; text-transform: uppercase;">
                          ${order.payment_method || "COD"}
                        </td>
                      </tr>
                    </table>

                    <!-- Dynamic Item lines if present -->
                    ${itemsHtml ? `
                    <h3 style="font-family: sans-serif; font-size: 14px; color: #1F4D3A; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #1F4D3A; padding-bottom: 8px; margin: 25px 0 10px 0;">
                      Itemized Lineup
                    </h3>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px;">
                      <thead>
                        <tr>
                          <th align="left" style="font-family: sans-serif; font-size: 12px; color: #666666; padding-bottom: 8px;">Product</th>
                          <th align="center" style="font-family: sans-serif; font-size: 12px; color: #666666; padding-bottom: 8px;">Qty</th>
                          <th align="right" style="font-family: sans-serif; font-size: 12px; color: #666666; padding-bottom: 8px;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>
                    ` : ""}

                    <!-- Grand Summary -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F7F0; border-radius: 8px; padding: 15px; margin-bottom: 30px;">
                      <tr>
                        <td style="font-family: sans-serif; font-size: 14px; color: #555555; font-weight: bold;">
                          Total Order Flow:
                        </td>
                        <td style="font-family: sans-serif; font-size: 18px; color: #1F4D3A; text-align: right; font-weight: bold;">
                          Rs. ${totalAmount}
                        </td>
                      </tr>
                    </table>

                    <!-- Delivery Coordinates -->
                    <div style="border: 1px solid #E1DEC5; border-radius: 8px; padding: 15px; margin-bottom: 30px;">
                      <h4 style="font-family: sans-serif; font-size: 12px; color: #1F4D3A; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 1px;">
                        Delivery Destination
                      </h4>
                      <p style="font-family: sans-serif; font-size: 13px; color: #555555; margin: 0 0 4px 0;">
                        <strong>Address:</strong> ${address}, ${city}
                      </p>
                      <p style="font-family: sans-serif; font-size: 13px; color: #555555; margin: 0;">
                        <strong>Contact Phone:</strong> ${order.phone}
                      </p>
                    </div>

                    <!-- Luxury CTA Button -->
                    <div style="text-align: center; margin-top: 20px;">
                      <a href="https://wenhairandskin.com/track-order?order=${orderNumber}" style="display: inline-block; background-color: #1F4D3A; color: #C9A227; font-family: sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 30px; border-radius: 6px; letter-spacing: 1px; text-transform: uppercase; border: 1px solid #C9A227; transition: background-color 0.2s ease;">
                        Track Your Order
                      </a>
                    </div>

                  </td>
                </tr>

                <!-- luxury Brand Footer -->
                <tr style="background-color: #F5F4EA; border-top: 1px solid #E1DEC5; text-align: center;">
                  <td style="padding: 25px 20px; font-family: sans-serif; font-size: 11px; color: #8C9992; line-height: 1.5;">
                    <strong style="color: #1F4D3A; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">
                      Wen Hair & Skin Secret Pakistan
                    </strong>
                    This message is a certified purchase confirmation dispatch receipt. If you have any inquiries, easily connect with our beauty consultants team via WhatsApp Helpline.
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    const { data, error } = await resend.emails.send({
      from: "Wen Hair & Skin <zohaibuddin376@gmail.com>",
      // Or verified custom sender on production
      to: [customerEmail],
      subject: `Order Confirmation: ${orderNumber} - Wen Hair & Skin Secret`,
      html: emailContent
    });
    if (error) {
      console.error("[Resend Email Service] API Error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("[Resend Email Service] Exception:", err);
    return { success: false, error: err.message };
  }
}
async function sendAdminReplyEmail(inquiry, replyContent) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Resend Email Service] Missing RESEND_API_KEY environment variable. Skipping email transmission.");
    return { success: false, error: "Missing Resend API Key" };
  }
  try {
    const resend = new import_resend.Resend(apiKey);
    const customerEmail = inquiry.email;
    if (!customerEmail) {
      console.warn("[Resend Email Service] No email coordinates found for user. Skipping.");
      return { success: false, error: "Missing customer email" };
    }
    const emailContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Response from Wen Hair & Skin Secret</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #FBFBEE; font-family: sans-serif; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #FBFBEE;">
          <tr>
            <td align="center" style="padding: 30px 10px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #E1DEC5; overflow: hidden; box-shadow: 0 4px 15px rgba(31, 77, 58, 0.04);">
                
                <!-- luxury Header Banner -->
                <tr style="background-color: #1F4D3A; text-align: center;">
                  <td style="padding: 35px 20px;">
                    <h1 style="color: #C9A227; font-family: sans-serif; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 3px; text-transform: uppercase;">
                      Wen Hair & Skin Secret
                    </h1>
                    <p style="color: #ffffff; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 4px 0 0 0; opacity: 0.9;">
                      Royal Botanical Archives
                    </p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <span style="font-family: sans-serif; font-size: 11px; font-weight: bold; color: #C9A227; text-transform: uppercase; letter-spacing: 2px;">Inquiry Response</span>
                    <h2 style="font-family: serif; font-size: 22px; color: #1F4D3A; margin: 5px 0 15px 0; font-weight: bold;">
                      Hello ${inquiry.name},
                    </h2>
                    
                    <p style="color: #555555; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
                      Thank you for contacting Wen Hair &amp; Skin Secret. Please see the response to your inquiry regarding <strong>"${inquiry.subject}"</strong> below.
                    </p>

                    <!-- Reply Content Box -->
                    <div style="background-color: #F5F7F5; border-left: 3px solid #1F4D3A; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                      <p style="color: #333333; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${replyContent}</p>
                    </div>

                    <!-- Original Message Box -->
                    <div style="background-color: #FAFAFA; border: 1px solid #EAEAEA; padding: 15px; border-radius: 4px; margin-bottom: 30px;">
                      <h4 style="color: #666666; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Your Original Message</h4>
                      <p style="color: #777777; font-size: 13px; line-height: 1.5; margin: 0; font-style: italic;">"${inquiry.message}"</p>
                    </div>

                    <!-- Footer Details -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" style="padding-top: 20px; border-top: 1px solid #EAEAEA;">
                          <p style="color: #888888; font-size: 12px; line-height: 1.5; margin: 0;">
                            If you require any further assistance, you may reply directly to this email.<br>
                            Warmest regards,<br>
                            <strong>Wen Customer Support Team</strong>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- luxury Brand Footer -->
                <tr style="background-color: #F5F4EA; border-top: 1px solid #E1DEC5; text-align: center;">
                  <td style="padding: 25px 20px; font-family: sans-serif; font-size: 11px; color: #8C9992; line-height: 1.5;">
                    <strong style="color: #1F4D3A; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">
                      Wen Hair & Skin Secret Pakistan
                    </strong>
                    This message is a certified dispatch from our beauty consultants team.
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    const { data, error } = await resend.emails.send({
      from: "Wen Hair & Skin <zohaibuddin376@gmail.com>",
      // Or verified custom sender on production
      to: [customerEmail],
      subject: `Re: ${inquiry.subject}`,
      html: emailContent
    });
    if (error) {
      console.error("[Resend API Error]:", error);
      return { success: false, error: error.message };
    }
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("[Resend Email Service] Exception:", err);
    return { success: false, error: err.message };
  }
}
async function sendAdminNewUserNotification(user) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "Missing API Key" };
  try {
    const resend = new import_resend.Resend(apiKey);
    const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
    const emailContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2>New Customer Sign Up</h2>
        <p>A new customer has registered on the platform.</p>
        <ul>
          <li><strong>Name:</strong> ${user.fullName}</li>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Phone:</strong> ${user.phone || "N/A"}</li>
          <li><strong>Date:</strong> ${new Date(user.createdAt).toLocaleString()}</li>
        </ul>
      </div>
    `;
    const { data, error } = await resend.emails.send({
      from: "Wen Hair & Skin <zohaibuddin376@gmail.com>",
      to: [adminEmail],
      subject: "Alert: New Customer Registration",
      html: emailContent
    });
    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
async function sendInvoiceEmail(order, user) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Resend Email Service] Missing RESEND_API_KEY environment variable. Skipping invoice.");
    return { success: false, error: "Missing Resend API Key" };
  }
  try {
    const resend = new import_resend.Resend(apiKey);
    const customerEmail = user?.email || "";
    if (!customerEmail) {
      console.warn("[Resend Email Service] No email for invoice.");
      return { success: false, error: "Missing customer email" };
    }
    const customerName = user?.fullName || user?.name || "Valued Client";
    let subtotal = 0;
    let itemsHtml = "";
    if (order.order_items && Array.isArray(order.order_items)) {
      itemsHtml = order.order_items.map((item) => {
        const lineTotal = item.quantity * item.price;
        subtotal += lineTotal;
        return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #EAEAEA;">${item.products?.name || "Product"}</td>
          <td style="padding: 10px; border-bottom: 1px solid #EAEAEA; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #EAEAEA; text-align: right;">Rs. ${Number(item.price).toLocaleString()}</td>
        </tr>
      `;
      }).join("");
    }
    const emailContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #1F4D3A; text-align: center;">WEN SECRETS - OFFICIAL INVOICE</h2>
        <p>Dear ${customerName},</p>
        <p>Your order <strong>${order.order_number}</strong> has been delivered successfully. Here is your invoice:</p>
        
        <table width="100%" style="border-collapse: collapse; margin-top: 20px;">
          <tr style="background: #f8f9fa;">
            <th style="padding: 10px; text-align: left;">Item</th>
            <th style="padding: 10px;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
          </tr>
          ${itemsHtml}
          <tr>
            <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
            <td style="padding: 10px; text-align: right;">Rs. ${subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px; color: #1F4D3A;">Total Paid:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px; color: #1F4D3A;">Rs. ${Number(order.total_amount).toLocaleString()}</td>
          </tr>
        </table>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          Thank you for trusting Wen Secrets.<br>
          For any questions, reply to this email.
        </p>
      </div>
    `;
    const { data, error } = await resend.emails.send({
      from: "Wen Hair & Skin Invoices <zohaibuddin376@gmail.com>",
      to: [customerEmail],
      subject: `Invoice for Order ${order.order_number}`,
      html: emailContent
    });
    if (error) return { success: false, error: error.message };
    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
var import_resend;
var init_email = __esm({
  "src/lib/email.ts"() {
    import_resend = require("resend");
  }
});

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_svix = require("svix");
var import_supabase_js = require("@supabase/supabase-js");
init_email();
async function safeProfileInsert(supabaseAdmin, payload) {
  const { data, error } = await supabaseAdmin.from("profiles").insert(payload).select("*");
  if (error && (error.code === "PGRST204" || error.message?.includes("column") || error.message?.includes("address") || error.message?.includes("city"))) {
    console.warn("Retrying profile insert without address/city columns due to schema limitation:", error.message);
    const cleanedPayload = { ...payload };
    delete cleanedPayload.address;
    delete cleanedPayload.city;
    return await supabaseAdmin.from("profiles").insert(cleanedPayload).select("*");
  }
  return { data, error };
}
async function safeProfileUpdate(supabaseAdmin, payload, matchColumn, matchValue) {
  const { data, error } = await supabaseAdmin.from("profiles").update(payload).eq(matchColumn, matchValue).select("*");
  if (error && (error.code === "PGRST204" || error.message?.includes("column") || error.message?.includes("address") || error.message?.includes("city"))) {
    console.warn("Retrying profile update without address/city columns due to schema limitation:", error.message);
    const cleanedPayload = { ...payload };
    delete cleanedPayload.address;
    delete cleanedPayload.city;
    return await supabaseAdmin.from("profiles").update(cleanedPayload).eq(matchColumn, matchValue).select("*");
  }
  return { data, error };
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.post("/api/webhooks/clerk", import_express.default.raw({ type: "application/json" }), async (req, res) => {
    const payload = req.body.toString();
    const headers = req.headers;
    const svix_id = headers["svix-id"];
    const svix_timestamp = headers["svix-timestamp"];
    const svix_signature = headers["svix-signature"];
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("Missing svix headers for webhook authentication.");
      return res.status(400).send("Verification error: Missing svix headers");
    }
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "";
    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET is missing in the environment.");
      return res.status(500).send("Webhook Secret Error");
    }
    const wh = new import_svix.Webhook(webhookSecret);
    let evt;
    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature
      });
    } catch (err) {
      console.error("Clerk Webhook verification failed:", err.message);
      return res.status(400).send("Verification error: Invalid signature");
    }
    const eventType = evt.type;
    const userData = evt.data;
    console.log(`Successfully verified Clerk Webhook event: ${eventType} for clerk_id: ${userData.id}`);
    const clerk_id = userData.id;
    const email = userData.email_addresses?.[0]?.email_address || "";
    const first = userData.first_name || "";
    const last = userData.last_name || "";
    const full_name = [first, last].filter(Boolean).join(" ") || "Valued Patron";
    const phone = userData.phone_numbers?.[0]?.phone_number || "";
    const avatar_url = userData.image_url || "";
    let role = "customer";
    if (userData.public_metadata && typeof userData.public_metadata === "object") {
      const rawRole = userData.public_metadata.role;
      if (rawRole === "admin" || rawRole === "customer") {
        role = rawRole;
      }
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials missing in backend environment.");
      return res.status(500).send("Supabase Configuration Error");
    }
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    try {
      if (eventType === "user.created") {
        const deterministicUuid = crypto.randomUUID();
        let targetProfileId = deterministicUuid;
        try {
          const { data: authCreated, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { clerk_id }
          });
          if (authCreated?.user) {
            targetProfileId = authCreated.user.id;
          } else {
            console.warn("auth.admin.createUser did not return a user. Try fallback check.", authCreateError);
          }
        } catch (authErr) {
          console.warn("Non-blocking auth.admin.createUser error:", authErr);
        }
        const { error: insertError } = await supabaseAdmin.from("profiles").insert({
          id: targetProfileId,
          clerk_id,
          email,
          full_name,
          phone,
          role,
          avatar_url
        });
        if (insertError) {
          console.error("Error inserting clerk user profile record:", insertError);
          return res.status(500).json({ error: insertError.message });
        }
        try {
          await supabaseAdmin.from("notifications").insert({
            type: "new_customer",
            title: "New Customer Registered",
            message: `A new customer, ${full_name || email}, has created an account.`,
            data: { clerk_id, email, full_name }
          });
          Promise.resolve().then(() => (init_email(), email_exports)).then(({ sendAdminNewUserNotification: sendAdminNewUserNotification2 }) => {
            sendAdminNewUserNotification2({
              email: email || "unknown@email",
              fullName: full_name || "Unknown",
              phone: phone || "N/A",
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            }).catch(console.error);
          });
        } catch (notifErr) {
          console.error("Non-blocking notification insertion error:", notifErr);
        }
        console.log(`Clerk synced profile created perfectly for ID: ${targetProfileId}`);
        return res.json({ success: true, message: "Profile registered successfully" });
      }
      if (eventType === "user.updated") {
        const { error: updateError } = await supabaseAdmin.from("profiles").update({
          email,
          full_name,
          phone,
          role,
          avatar_url
        }).eq("clerk_id", clerk_id);
        if (updateError) {
          console.error("Error updating Clerk user profile record:", updateError);
          return res.status(500).json({ error: updateError.message });
        }
        console.log(`Clerk profile details synchronized successfully for clerk_id: ${clerk_id}`);
        return res.json({ success: true, message: "Profile synchronized successfully" });
      }
      if (eventType === "user.deleted") {
        const { error: deleteError } = await supabaseAdmin.from("profiles").delete().eq("clerk_id", clerk_id);
        if (deleteError) {
          console.error("Error deleting Clerk user profile record:", deleteError);
          return res.status(500).json({ error: deleteError.message });
        }
        console.log(`Clerk profile removed successfully for clerk_id: ${clerk_id}`);
        return res.json({ success: true, message: "Profile removed successfully" });
      }
      return res.json({ received: true });
    } catch (err) {
      console.error("Exception caught in Clerk webhook handler:", err);
      return res.status(500).send(`Internal Webhook Error: ${err.message}`);
    }
  });
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
  app.post("/api/sync-profile", async (req, res) => {
    const { clerk_id, email, full_name, phone, avatar_url, address, city, is_manual, role } = req.body;
    if (!clerk_id) {
      return res.status(400).json({ error: "clerk_id is required" });
    }
    const emailLower = (email || "").toLowerCase();
    const isEmailAdmin = emailLower.includes("admin") || emailLower === "zohaibuddin376@gmail.com" || emailLower === "admin@wenhairskin.com";
    const resolvedRole = isEmailAdmin || role === "admin" ? "admin" : role || "customer";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials missing in backend environment.");
      return res.status(500).json({ error: "Supabase Configuration Error" });
    }
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    try {
      const { data: existingProfile, error: fetchErr } = await supabaseAdmin.from("profiles").select("*").eq("clerk_id", clerk_id).maybeSingle();
      if (existingProfile) {
        const updatePayload = {
          email: email || existingProfile.email,
          avatar_url: avatar_url || existingProfile.avatar_url
        };
        if (resolvedRole) {
          updatePayload.role = resolvedRole;
        }
        if (is_manual) {
          if (full_name !== void 0) updatePayload.full_name = full_name;
          if (phone !== void 0) updatePayload.phone = phone || "";
          if (address !== void 0) updatePayload.address = address || "";
          if (city !== void 0) updatePayload.city = city || "";
        } else {
          const isPlaceholderName = !existingProfile.full_name || existingProfile.full_name === "Valued Patron" || existingProfile.full_name === "WEN Member";
          if (isPlaceholderName && full_name) updatePayload.full_name = full_name;
          if (!existingProfile.phone && phone) updatePayload.phone = phone || "";
          if (!existingProfile.address && address) updatePayload.address = address || "";
          if (!existingProfile.city && city) updatePayload.city = city || "";
        }
        const { data: updated, error: updateErr } = await safeProfileUpdate(
          supabaseAdmin,
          updatePayload,
          "clerk_id",
          clerk_id
        );
        if (updateErr) {
          console.error("Error updating profile in api route:", updateErr);
          return res.status(500).json({ error: updateErr.message });
        }
        const updatedRow = updated && updated.length > 0 ? updated[0] : null;
        return res.json({ success: true, profile: updatedRow });
      }
      if (email) {
        const { data: existingProfByEmail } = await supabaseAdmin.from("profiles").select("*").eq("email", email).maybeSingle();
        if (existingProfByEmail) {
          const updatePayload = {
            clerk_id,
            avatar_url: avatar_url || existingProfByEmail.avatar_url
          };
          if (resolvedRole) {
            updatePayload.role = resolvedRole;
          }
          if (is_manual) {
            if (full_name !== void 0) updatePayload.full_name = full_name;
            if (phone !== void 0) updatePayload.phone = phone || "";
            if (address !== void 0) updatePayload.address = address || "";
            if (city !== void 0) updatePayload.city = city || "";
          } else {
            const isPlaceholderName = !existingProfByEmail.full_name || existingProfByEmail.full_name === "Valued Patron" || existingProfByEmail.full_name === "WEN Member";
            if (isPlaceholderName && full_name) updatePayload.full_name = full_name;
            if (!existingProfByEmail.phone && phone) updatePayload.phone = phone || "";
            if (!existingProfByEmail.address && address) updatePayload.address = address || "";
            if (!existingProfByEmail.city && city) updatePayload.city = city || "";
          }
          const { data: updated, error: updateErr } = await safeProfileUpdate(
            supabaseAdmin,
            updatePayload,
            "id",
            existingProfByEmail.id
          );
          if (updateErr) {
            console.error("Error updating profile by email in api route:", updateErr);
            return res.status(500).json({ error: updateErr.message });
          }
          const updatedRow = updated && updated.length > 0 ? updated[0] : null;
          return res.json({ success: true, profile: updatedRow });
        }
      }
      let targetProfileId = crypto.randomUUID();
      let createdSuccessfully = false;
      try {
        const { data: authCreated, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
          email: email || `${clerk_id}@clerk.local`,
          email_confirm: true,
          user_metadata: { clerk_id }
        });
        if (authCreated?.user) {
          targetProfileId = authCreated.user.id;
          createdSuccessfully = true;
        } else {
          console.warn("auth.admin.createUser did not return a user. Attempting to look up existing user:", authCreateError);
        }
      } catch (authErr) {
        console.warn("Non-blocking auth create in api route:", authErr);
      }
      if (!createdSuccessfully && email) {
        try {
          const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          if (!listError && listData?.users) {
            const foundUser = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
            if (foundUser) {
              targetProfileId = foundUser.id;
              console.log("Successfully found existing Supabase auth user ID to link to profile:", targetProfileId);
            }
          }
        } catch (listErr) {
          console.error("Error listing Supabase auth users in sync-profile fallback:", listErr);
        }
      }
      const { data: inserted, error: insertError } = await safeProfileInsert(supabaseAdmin, {
        id: targetProfileId,
        clerk_id,
        email: email || "",
        full_name: full_name || "",
        phone: phone || "",
        role: resolvedRole || "customer",
        avatar_url: avatar_url || "",
        address: address || "",
        city: city || "Lahore"
      });
      if (insertError) {
        console.error("Error inserting profile in api route:", insertError);
        return res.status(500).json({ error: insertError.message });
      }
      try {
        await supabaseAdmin.from("notifications").insert({
          type: "new_user",
          title: "New User Registered",
          message: `New customer ${full_name || email || "Patron"} has joined Wen Secret Apothecary.`,
          data: { clerk_id, email, full_name, city }
        });
        Promise.resolve().then(() => (init_email(), email_exports)).then(({ sendAdminNewUserNotification: sendAdminNewUserNotification2 }) => {
          sendAdminNewUserNotification2({
            email: email || "unknown@email",
            fullName: full_name || "Unknown",
            phone: phone || "N/A",
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          }).catch(console.error);
        });
      } catch (notifErr) {
        console.error("Non-blocking new user notification error:", notifErr);
      }
      const insertedRow = inserted && inserted.length > 0 ? inserted[0] : null;
      return res.json({ success: true, profile: insertedRow });
    } catch (err) {
      console.error("Sync profile api error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/admin/register", async (req, res) => {
    const { email, password, fullName, phone, securityCode } = req.body;
    if (securityCode !== "WEN-ADMIN-2026") {
      return res.status(400).json({ error: "Invalid administrative security bypass code." });
    }
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const clerkSecretKey = process.env.CLERK_SECRET_KEY || "";
    if (!clerkSecretKey) {
      console.error("CLERK_SECRET_KEY is missing in the environment.");
      return res.status(500).json({ error: "Clerk Configuration Error" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials missing in backend environment.");
      return res.status(500).json({ error: "Supabase Configuration Error" });
    }
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    try {
      const names = (fullName || "").trim().split(" ");
      const firstName = names[0] || "WEN";
      const lastName = names.slice(1).join(" ") || "Admin";
      let clerkUserId = "";
      console.log(`Attempting to register admin user in Clerk: ${email}`);
      const clerkRes = await fetch("https://api.clerk.com/v1/users", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${clerkSecretKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email_addresses: [email],
          verified_email_addresses: [email],
          password,
          skip_password_checks: true,
          first_name: firstName,
          last_name: lastName,
          public_metadata: {
            role: "admin"
          }
        })
      });
      if (clerkRes.ok) {
        const clerkUserData = await clerkRes.json();
        clerkUserId = clerkUserData.id;
        console.log(`Successfully created verified Clerk user: ${clerkUserId}`);
      } else {
        const errorBody = await clerkRes.json().catch(() => ({}));
        console.warn("Clerk user creation response error details:", errorBody);
        const isAlreadyInUse = errorBody.errors?.some(
          (e) => e.message?.includes("already exists") || e.message?.includes("in use") || e.code === "form_identifier_exists"
        );
        if (isAlreadyInUse) {
          console.log(`Clerk user already exists. Querying Clerk API to retrieve existing user ID for clean recreation: ${email}`);
          const lookupRes = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
            headers: {
              "Authorization": `Bearer ${clerkSecretKey}`
            }
          });
          if (lookupRes.ok) {
            const lookupUsers = await lookupRes.json();
            if (lookupUsers && lookupUsers.length > 0) {
              const existingClerkUserId = lookupUsers[0].id;
              console.log(`Retrieved existing Clerk user ID: ${existingClerkUserId}. Deleting to allow clean verified recreation...`);
              const deleteRes = await fetch(`https://api.clerk.com/v1/users/${existingClerkUserId}`, {
                method: "DELETE",
                headers: {
                  "Authorization": `Bearer ${clerkSecretKey}`
                }
              });
              if (deleteRes.ok) {
                console.log(`Successfully deleted existing unverified Clerk user. Re-attempting creation...`);
                const reCreateRes = await fetch("https://api.clerk.com/v1/users", {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${clerkSecretKey}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    email_addresses: [email],
                    verified_email_addresses: [email],
                    password,
                    skip_password_checks: true,
                    first_name: firstName,
                    last_name: lastName,
                    public_metadata: {
                      role: "admin"
                    }
                  })
                });
                if (reCreateRes.ok) {
                  const reCreateData = await reCreateRes.json();
                  clerkUserId = reCreateData.id;
                  console.log(`Successfully recreated verified Clerk user: ${clerkUserId}`);
                }
              }
            }
          }
        }
        if (!clerkUserId) {
          const errMsg = errorBody.errors?.[0]?.message || "Failed to create administrative user in Clerk.";
          return res.status(400).json({ error: errMsg });
        }
      }
      let targetProfileId = crypto.randomUUID();
      let supabaseCreated = false;
      try {
        const { data: authCreated, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { clerk_id: clerkUserId }
        });
        if (authCreated?.user) {
          targetProfileId = authCreated.user.id;
          supabaseCreated = true;
          console.log(`Created matching Supabase auth user with ID: ${targetProfileId}`);
        } else {
          console.warn("Supabase auth user creation returned empty user:", authCreateError);
        }
      } catch (authErr) {
        console.warn("Non-blocking Supabase auth creation exception:", authErr);
      }
      if (!supabaseCreated) {
        try {
          const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          if (!listError && listData?.users) {
            const foundUser = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
            if (foundUser) {
              targetProfileId = foundUser.id;
              supabaseCreated = true;
              console.log(`Matched existing Supabase auth user with ID: ${targetProfileId}`);
            }
          }
        } catch (listErr) {
          console.error("Error looking up existing Supabase user ID:", listErr);
        }
      }
      const { data: existingProf } = await supabaseAdmin.from("profiles").select("*").eq("email", email).maybeSingle();
      let profileRow;
      if (existingProf) {
        const { data: updated, error: updateErr } = await supabaseAdmin.from("profiles").update({
          clerk_id: clerkUserId,
          full_name: fullName || existingProf.full_name,
          phone: phone || existingProf.phone,
          role: "admin"
        }).eq("id", existingProf.id).select("*");
        if (updateErr) {
          console.error("Supabase admin profile update error:", updateErr);
          return res.status(400).json({ error: updateErr.message });
        }
        profileRow = updated && updated.length > 0 ? updated[0] : null;
        console.log("Updated existing admin profile with role 'admin' successfully");
      } else {
        const { data: inserted, error: insertErr } = await safeProfileInsert(supabaseAdmin, {
          id: targetProfileId,
          clerk_id: clerkUserId,
          email,
          full_name: fullName || "WEN Admin",
          phone: phone || "N/A",
          role: "admin",
          city: "Lahore",
          address: "WEN HQ"
        });
        if (insertErr) {
          console.error("Supabase admin profile insertion error:", insertErr);
          return res.status(400).json({ error: insertErr.message });
        }
        profileRow = inserted && inserted.length > 0 ? inserted[0] : null;
        console.log("Inserted new admin profile with role 'admin' successfully");
      }
      return res.json({ success: true, clerk_id: clerkUserId, profile: profileRow });
    } catch (err) {
      console.error("Admin signup endpoint exception error:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app.get("/api/user-data/:clerk_id", async (req, res) => {
    const { clerk_id } = req.params;
    if (!clerk_id) {
      return res.status(400).json({ error: "clerk_id is required" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Supabase configuration missing" });
    }
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: profile, error: pErr } = await supabaseAdmin.from("profiles").select("*").eq("clerk_id", clerk_id).maybeSingle();
      if (!profile) {
        return res.json({ success: true, profile: null, wishlist: [], cart: [] });
      }
      const { data: wishlist, error: wErr } = await supabaseAdmin.from("wishlist").select("product_id").eq("user_id", profile.id);
      const { data: cart, error: cErr } = await supabaseAdmin.from("cart_items").select("product_id, quantity").eq("user_id", profile.id);
      return res.json({
        success: true,
        profile,
        wishlist: wishlist ? wishlist.map((w) => w.product_id) : [],
        cart: cart || []
      });
    } catch (err) {
      console.error("Error fetching user data from API:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/wishlist/toggle", async (req, res) => {
    const { clerk_id, product_id, shouldAdd } = req.body;
    if (!clerk_id || !product_id) {
      return res.status(400).json({ error: "clerk_id and product_id are required" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("clerk_id", clerk_id).maybeSingle();
      if (!profile) {
        return res.status(404).json({ error: "User profile not found" });
      }
      if (shouldAdd) {
        const { data: existing } = await supabaseAdmin.from("wishlist").select("id").eq("user_id", profile.id).eq("product_id", product_id).maybeSingle();
        if (!existing) {
          await supabaseAdmin.from("wishlist").insert({
            user_id: profile.id,
            product_id
          });
        }
      } else {
        await supabaseAdmin.from("wishlist").delete().eq("user_id", profile.id).eq("product_id", product_id);
      }
      return res.json({ success: true });
    } catch (err) {
      console.error("Wishlist sync API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/cart/sync", async (req, res) => {
    const { clerk_id, product_id, quantity } = req.body;
    if (!clerk_id || !product_id) {
      return res.status(400).json({ error: "clerk_id and product_id are required" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("clerk_id", clerk_id).maybeSingle();
      if (!profile) {
        return res.status(404).json({ error: "User profile not found" });
      }
      const { data: existing } = await supabaseAdmin.from("cart_items").select("id").eq("user_id", profile.id).eq("product_id", product_id).maybeSingle();
      if (existing) {
        await supabaseAdmin.from("cart_items").update({ quantity }).eq("id", existing.id);
      } else {
        await supabaseAdmin.from("cart_items").insert({
          user_id: profile.id,
          product_id,
          quantity
        });
      }
      return res.json({ success: true });
    } catch (err) {
      console.error("Cart sync API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/cart/delete", async (req, res) => {
    const { clerk_id, product_id } = req.body;
    if (!clerk_id || !product_id) {
      return res.status(400).json({ error: "clerk_id and product_id are required" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("clerk_id", clerk_id).maybeSingle();
      if (!profile) {
        return res.status(404).json({ error: "User profile not found" });
      }
      await supabaseAdmin.from("cart_items").delete().eq("user_id", profile.id).eq("product_id", product_id);
      return res.json({ success: true });
    } catch (err) {
      console.error("Cart delete API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/cart/clear", async (req, res) => {
    const { clerk_id } = req.body;
    if (!clerk_id) {
      return res.status(400).json({ error: "clerk_id is required" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("clerk_id", clerk_id).maybeSingle();
      if (!profile) {
        return res.status(404).json({ error: "User profile not found" });
      }
      await supabaseAdmin.from("cart_items").delete().eq("user_id", profile.id);
      return res.json({ success: true });
    } catch (err) {
      console.error("Cart clear API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/user/profile", async (req, res) => {
    const clerk_id = req.query.clerk_id;
    if (!clerk_id) {
      return res.status(400).json({ error: "clerk_id query parameter is required" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: profile, error } = await supabaseAdmin.from("profiles").select("id, full_name, email, phone, address, city").eq("clerk_id", clerk_id).maybeSingle();
      if (error) {
        console.error("Error querying profile:", error);
        return res.status(500).json({ error: error.message });
      }
      if (!profile) {
        return res.json({ success: true, profile: null });
      }
      return res.json({ success: true, profile });
    } catch (err) {
      console.error("Profile query API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/coupons/validate", async (req, res) => {
    const { code, cart_total } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Coupon code is required." });
    }
    const cleanCode = code.trim().toUpperCase();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: dbCoupon, error } = await supabaseAdmin.from("coupons").select("*").ilike("code", cleanCode).maybeSingle();
      if (error) {
        console.error("Error fetching coupon:", error);
        return res.status(500).json({ error: "Database error validating coupon." });
      }
      if (!dbCoupon) {
        if (cleanCode === "WENSECRET" || cleanCode === "LUXURY20") {
          const discountVal2 = 20;
          const amt2 = Math.round(cart_total * discountVal2 / 100);
          return res.json({
            success: true,
            code: cleanCode,
            discount_type: "percentage",
            discount_value: discountVal2,
            discount_amount: amt2,
            coupon_id: "static-coupon-luxury20"
          });
        } else if (cleanCode === "FREE2026" || cleanCode === "WENSECRET10") {
          const discountVal2 = 10;
          const amt2 = Math.round(cart_total * discountVal2 / 100);
          return res.json({
            success: true,
            code: cleanCode,
            discount_type: "percentage",
            discount_value: discountVal2,
            discount_amount: amt2,
            coupon_id: "static-coupon-wensecret10"
          });
        } else if (cleanCode === "WENSECRET15") {
          const discountVal2 = 15;
          const amt2 = Math.round(cart_total * discountVal2 / 100);
          return res.json({
            success: true,
            code: cleanCode,
            discount_type: "percentage",
            discount_value: discountVal2,
            discount_amount: amt2,
            coupon_id: "static-coupon-wensecret15"
          });
        }
        return res.status(404).json({ error: "Invalid botanical voucher code." });
      }
      if (!dbCoupon.is_active) {
        return res.status(400).json({ error: "This botanical voucher has been deactivated." });
      }
      const now = /* @__PURE__ */ new Date();
      if (dbCoupon.start_date && new Date(dbCoupon.start_date) > now) {
        return res.status(400).json({ error: "This botanical voucher is not active yet." });
      }
      if (dbCoupon.end_date && new Date(dbCoupon.end_date) < now) {
        return res.status(400).json({ error: "This botanical voucher has expired." });
      }
      const discountVal = dbCoupon.discount_percentage;
      const amt = Math.round(cart_total * discountVal / 100);
      return res.json({
        success: true,
        code: dbCoupon.code,
        discount_type: "percentage",
        discount_value: discountVal,
        discount_amount: amt,
        coupon_id: dbCoupon.id
      });
    } catch (err) {
      console.error("Coupon validation API exception error:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app.post("/api/orders", async (req, res) => {
    const { clerk_id, details, cart_items } = req.body;
    if (!details || !cart_items || !Array.isArray(cart_items)) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      let profileId = null;
      if (clerk_id) {
        const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("clerk_id", clerk_id).maybeSingle();
        if (profile) {
          profileId = profile.id;
        } else if (details.email) {
          const { data: existingProfByEmail } = await supabaseAdmin.from("profiles").select("id").eq("email", details.email).maybeSingle();
          if (existingProfByEmail) {
            profileId = existingProfByEmail.id;
            await supabaseAdmin.from("profiles").update({
              clerk_id
            }).eq("id", existingProfByEmail.id);
          } else {
            let targetProfileId = crypto.randomUUID();
            try {
              const { data: authCreated } = await supabaseAdmin.auth.admin.createUser({
                email: details.email,
                email_confirm: true,
                user_metadata: { clerk_id }
              });
              if (authCreated?.user) {
                targetProfileId = authCreated.user.id;
              }
            } catch (err) {
              console.warn("Non-blocking auth create during order:", err);
            }
            const { data: newProf } = await supabaseAdmin.from("profiles").insert({
              id: targetProfileId,
              clerk_id,
              email: details.email,
              full_name: details.fullName,
              phone: details.phone,
              address: details.address,
              city: details.city,
              role: "customer"
            }).select("id").maybeSingle();
            if (newProf) {
              profileId = newProf.id;
            }
          }
        }
      }
      if (!profileId) {
        const lookupEmail = details.email || "guest@wen.com";
        const { data: activeProfile } = await supabaseAdmin.from("profiles").select("id").eq("email", lookupEmail).maybeSingle();
        if (activeProfile) {
          profileId = activeProfile.id;
        } else {
          const generatedId = crypto.randomUUID();
          const { data: newProf, error: newProfErr } = await supabaseAdmin.from("profiles").insert({
            id: generatedId,
            clerk_id: `guest-${generatedId}`,
            email: lookupEmail,
            full_name: details.fullName,
            phone: details.phone,
            address: details.address,
            city: details.city,
            role: "customer"
          }).select("id").maybeSingle();
          if (newProf) {
            profileId = newProf.id;
          } else {
            console.error("Error creating guest profile:", newProfErr);
          }
        }
      }
      const newOrderNumber = `WEN-${Math.floor(1e5 + Math.random() * 9e5)}`;
      const subtotal = cart_items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
      let discountAmount = 0;
      const couponCode = details.couponCode || null;
      let discountPercentage = details.discountPercentage || 0;
      if (couponCode) {
        const cleanCode = couponCode.trim().toUpperCase();
        try {
          const { data: dbCoupon } = await supabaseAdmin.from("coupons").select("*").eq("code", cleanCode).eq("is_active", true).maybeSingle();
          if (dbCoupon) {
            const now = /* @__PURE__ */ new Date();
            let valid = true;
            if (dbCoupon.start_date && new Date(dbCoupon.start_date) > now) valid = false;
            if (dbCoupon.end_date && new Date(dbCoupon.end_date) < now) valid = false;
            if (valid) {
              discountPercentage = dbCoupon.discount_percentage;
            } else {
              discountPercentage = 0;
            }
          } else {
            if (cleanCode === "WENSECRET" || cleanCode === "LUXURY20") {
              discountPercentage = 20;
            } else if (cleanCode === "FREE2026" || cleanCode === "WENSECRET10") {
              discountPercentage = 10;
            } else {
              discountPercentage = 0;
            }
          }
        } catch (couponErr) {
          console.error("Backend coupon validation error:", couponErr);
          if (cleanCode === "WENSECRET" || cleanCode === "LUXURY20") {
            discountPercentage = 20;
          } else if (cleanCode === "FREE2026" || cleanCode === "WENSECRET10") {
            discountPercentage = 10;
          } else {
            discountPercentage = 0;
          }
        }
        discountAmount = Math.round(subtotal * (discountPercentage / 100));
      }
      const estTotal = subtotal + (subtotal >= 2e3 ? 0 : 250) - discountAmount;
      let finalNotes = details.specialInstructions || details.notes || "";
      if (couponCode && discountPercentage > 0) {
        const promoLabel = `[Promo: ${couponCode.toUpperCase()} (${discountPercentage}% Off)]`;
        if (finalNotes) {
          finalNotes = `${promoLabel} ${finalNotes}`;
        } else {
          finalNotes = promoLabel;
        }
      }
      const { data: orderData, error: orderErr } = await supabaseAdmin.from("orders").insert({
        order_number: newOrderNumber,
        user_id: profileId,
        status: "pending",
        total_amount: estTotal,
        shipping_address: details.address,
        city: details.city,
        phone: details.phone,
        shipping_name: details.fullName,
        shipping_phone: details.phone,
        postal_code: details.postalCode || null,
        special_instructions: details.specialInstructions || null,
        payment_method: details.paymentMethod.toLowerCase(),
        payment_status: details.paymentMethod.toLowerCase() === "cod" ? "unpaid" : "paid",
        tracking_id: `LP-${Math.floor(1e5 + Math.random() * 9e5)}`,
        notes: finalNotes || null,
        coupon_code: couponCode || null,
        discount_percentage: discountPercentage || null,
        confirmation_email: details.email || null,
        confirmation_phone: details.phone || null
      }).select().maybeSingle();
      if (orderErr || !orderData) {
        throw new Error(orderErr?.message || "Failed to insert order");
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const orderItemsToInsert = cart_items.map((item) => ({
        order_id: orderData.id,
        product_id: uuidRegex.test(item.product.id) ? item.product.id : null,
        // Ensure valid UUID or null
        quantity: item.quantity,
        price: item.product.price,
        variant: item.selectedVariant || null,
        product_name: item.product.name,
        product_image: item.product.image || item.product.images?.[0] || item.product.image_url || null,
        category: item.product.category || item.product.categories?.name || null,
        concern: item.product.concern || item.product.target_skin_hair_concern || null,
        confirmation_email: details.email || null,
        confirmation_phone: details.phone || null
      }));
      const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(orderItemsToInsert);
      if (itemsErr) {
        console.error("Order items insert failed:", itemsErr);
      }
      try {
        for (const item of cart_items) {
          const prodId = item.product.id;
          const qtyPurchased = item.quantity;
          const { data: prod } = await supabaseAdmin.from("products").select("name, stock_quantity").eq("id", prodId).maybeSingle();
          if (prod) {
            const currentStock = prod.stock_quantity ?? 10;
            const newStock = Math.max(0, currentStock - qtyPurchased);
            await supabaseAdmin.from("products").update({ stock_quantity: newStock }).eq("id", prodId);
            if (newStock < 5) {
              await supabaseAdmin.from("notifications").insert({
                type: "low_stock",
                title: "Low Stock Alert",
                message: `Stock for "${prod.name}" has run low (${newStock} items left).`,
                data: { product_id: prodId, stock_left: newStock }
              });
            }
          }
        }
        await supabaseAdmin.from("notifications").insert({
          type: "new_order",
          title: "New Order Received",
          message: `Order #${orderData.order_number} was successfully placed by ${details.fullName} for Rs. ${orderData.total_amount.toLocaleString()}`,
          data: { order_id: orderData.id, order_number: orderData.order_number, total: orderData.total_amount }
        });
        try {
          const { data: fullOrderForEmail } = await supabaseAdmin.from("orders").select("*, order_items(*, products(*, categories(name)))").eq("id", orderData.id).maybeSingle();
          if (fullOrderForEmail) {
            await sendOrderConfirmationEmail(fullOrderForEmail, {
              email: details.email,
              fullName: details.fullName
            });
            console.log(`[Resend Email Service] Dispatched confirmation receipt for Order #${orderData.order_number} to ${details.email}`);
          }
        } catch (emailErr) {
          console.error("[Resend Email Service] Non-blocking email dispatch failed:", emailErr);
        }
      } catch (notifErr) {
        console.error("Non-blocking order finalization task error:", notifErr);
      }
      return res.json({ success: true, order: orderData });
    } catch (err) {
      console.error("Place order API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/user/orders", async (req, res) => {
    const clerk_id = req.query.clerk_id || req.query.clerkId;
    if (!clerk_id) {
      return res.status(400).json({ error: "clerk_id is required" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: profile } = await supabaseAdmin.from("profiles").select("id, email").eq("clerk_id", clerk_id).maybeSingle();
      if (!profile) {
        return res.json({ success: true, orders: [] });
      }
      let userIdsToFetch = [profile.id];
      if (profile.email) {
        const { data: linkedProfiles } = await supabaseAdmin.from("profiles").select("id").eq("email", profile.email);
        if (linkedProfiles && linkedProfiles.length > 0) {
          userIdsToFetch = linkedProfiles.map((p) => p.id);
        }
      }
      const { data: orders, error } = await supabaseAdmin.from("orders").select("*, order_items(*, products(*, categories(name)))").in("user_id", userIdsToFetch).order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching user orders from DB:", error);
        return res.status(500).json({ error: error.message });
      }
      return res.json({ success: true, orders: orders || [] });
    } catch (err) {
      console.error("Fetch user orders API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get(["/api/track-order", "/api/user/track-order"], async (req, res) => {
    const orderQuery = req.query.orderId || req.query.order_number || req.query.query;
    const clerk_id = req.query.clerk_id;
    if (!orderQuery) {
      return res.status(400).json({ error: "Order Number/ID is required" });
    }
    if (!clerk_id) {
      return res.status(401).json({ error: "Please log in first. Tracking orders is a secure feature available only for registered accounts." });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: profile, error: profError } = await supabaseAdmin.from("profiles").select("id, email, full_name, phone, role").eq("clerk_id", clerk_id).maybeSingle();
      if (profError || !profile) {
        return res.status(404).json({ error: "Authorized user session profile not found. Please log in again." });
      }
      const queryClean = orderQuery.trim().toUpperCase();
      const { data: order, error: orderError } = await supabaseAdmin.from("orders").select("*, order_items(*, products(*, categories(name)))").or(`order_number.ilike.${queryClean},tracking_id.eq.${queryClean}`).maybeSingle();
      if (orderError) {
        console.error("Supabase tracking query error:", orderError);
        return res.status(500).json({ error: "Database error during tracking lookup." });
      }
      if (!order) {
        return res.status(404).json({ error: `No active order found matching tracking query: "${orderQuery}"` });
      }
      if (profile.role !== "admin" && order.user_id !== profile.id) {
        return res.status(403).json({
          error: "Access Denied: Security Policy limits order tracking exclusively to the customer who initiated the transaction."
        });
      }
      const statusSequence = {
        pending: "Placed",
        processing: "Processing",
        shipped: "Shipped",
        out_for_delivery: "OutForDelivery",
        outfordelivery: "OutForDelivery",
        delivered: "Delivered",
        cancelled: "Cancelled"
      };
      const displayStatus = statusSequence[order.status.toLowerCase()] || "Placed";
      const orderDate = new Date(order.created_at);
      const estDate = new Date(orderDate.getTime() + 4 * 24 * 60 * 60 * 1e3);
      let customerProfile = profile;
      if (order.user_id && order.user_id !== profile.id) {
        const { data: custProf } = await supabaseAdmin.from("profiles").select("id, email, full_name, phone, role").eq("id", order.user_id).maybeSingle();
        if (custProf) {
          customerProfile = custProf;
        }
      }
      const itemsMapped = (order.order_items || []).map((item) => ({
        name: item.products?.name || "Premium Formulations Product",
        quantity: item.quantity,
        variant: "Standard Size",
        price: Number(item.price)
      }));
      const trackResult = {
        orderId: order.order_number,
        fullName: customerProfile.full_name || "Valued Customer",
        email: customerProfile.email,
        phone: order.phone || customerProfile.phone || "N/A",
        address: order.shipping_address,
        items: itemsMapped,
        totalPrice: Number(order.total_amount),
        status: displayStatus,
        date: orderDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        estimatedDelivery: estDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        courier: "Leopards Express Courier",
        consignmentNo: order.tracking_id || `LP-${order.order_number.replace("WEN-", "")}-PK`
      };
      return res.json({ success: true, trackResult });
    } catch (err) {
      console.error("Track order API exception error:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app.get("/api/addresses/:clerk_id", async (req, res) => {
    const { clerk_id } = req.params;
    if (!clerk_id) {
      return res.status(400).json({ error: "clerk_id is required" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("clerk_id", clerk_id).maybeSingle();
      if (!profile) {
        return res.json({ success: true, addresses: [], fallback: false });
      }
      const { data: addresses, error } = await supabaseAdmin.from("shipping_addresses").select("*").eq("user_id", profile.id).order("is_primary", { ascending: false }).order("created_at", { ascending: false });
      if (error) {
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          return res.json({ success: false, fallback: true, error: "shipping_addresses table does not exist in DB yet" });
        }
        throw error;
      }
      return res.json({ success: true, addresses: addresses || [], fallback: false });
    } catch (err) {
      console.error("Fetch addresses API error:", err);
      if (err.code === "42P01" || err.message?.includes("does not exist")) {
        return res.json({ success: false, fallback: true, error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/addresses", async (req, res) => {
    const { clerk_id, id, full_name, phone, address, city, country, postal_code, special_instructions, is_primary } = req.body;
    if (!clerk_id || !full_name || !phone || !address || !city) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("clerk_id", clerk_id).maybeSingle();
      if (!profile) {
        return res.status(404).json({ error: "User profile not found" });
      }
      let result;
      const isUuid = id && id.length === 36;
      if (id && isUuid) {
        const { data, error } = await supabaseAdmin.from("shipping_addresses").update({
          full_name,
          phone,
          address,
          city,
          country: country || "Pakistan",
          postal_code: postal_code || null,
          special_instructions: special_instructions || "",
          is_primary: !!is_primary
        }).eq("id", id).eq("user_id", profile.id).select().maybeSingle();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabaseAdmin.from("shipping_addresses").insert({
          user_id: profile.id,
          full_name,
          phone,
          address,
          city,
          country: country || "Pakistan",
          postal_code: postal_code || null,
          special_instructions: special_instructions || "",
          is_primary: !!is_primary
        }).select().maybeSingle();
        if (error) throw error;
        result = data;
      }
      if (result && is_primary) {
        await supabaseAdmin.from("shipping_addresses").update({ is_primary: false }).eq("user_id", profile.id).not("id", "eq", result.id);
      }
      return res.json({ success: true, address: result });
    } catch (err) {
      console.error("Save address API error:", err);
      if (err.code === "42P01" || err.message?.includes("does not exist")) {
        return res.json({ success: false, fallback: true, error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/addresses/:id", async (req, res) => {
    const { id } = req.params;
    const { clerk_id } = req.query;
    if (!id || !clerk_id) {
      return res.status(400).json({ error: "Missing required params" });
    }
    const isUuid = id && id.length === 36;
    if (!isUuid) {
      return res.json({ success: true, message: "Local fallback deleted" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("clerk_id", clerk_id).maybeSingle();
      if (!profile) {
        return res.status(404).json({ error: "User profile not found" });
      }
      const { error } = await supabaseAdmin.from("shipping_addresses").delete().eq("id", id).eq("user_id", profile.id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (err) {
      console.error("Delete address API error:", err);
      if (err.code === "42P01" || err.message?.includes("does not exist")) {
        return res.json({ success: false, fallback: true, error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/addresses/set-primary", async (req, res) => {
    const { id, clerk_id } = req.body;
    if (!id || !clerk_id) {
      return res.status(400).json({ error: "Missing required params" });
    }
    const isUuid = id && id.length === 36;
    if (!isUuid) {
      return res.json({ success: true, fallback: true, message: "Local primary state updated" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("clerk_id", clerk_id).maybeSingle();
      if (!profile) {
        return res.status(404).json({ error: "User profile not found" });
      }
      const { error: err1 } = await supabaseAdmin.from("shipping_addresses").update({ is_primary: true }).eq("id", id).eq("user_id", profile.id);
      if (err1) throw err1;
      await supabaseAdmin.from("shipping_addresses").update({ is_primary: false }).eq("user_id", profile.id).not("id", "eq", id);
      return res.json({ success: true });
    } catch (err) {
      console.error("Set primary address API error:", err);
      if (err.code === "42P01" || err.message?.includes("does not exist")) {
        return res.json({ success: false, fallback: true, error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/orders", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized: Missing clerk ID" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: Administrative credentials required." });
      }
      const { data: dbOrders, error: ordersError } = await supabaseAdmin.from("orders").select(`
          *,
          profiles (*),
          order_items (
            *,
            products (
              *,
              categories (name)
            )
          )
        `).order("created_at", { ascending: false });
      if (ordersError) throw ordersError;
      const mappedOrders = (dbOrders || []).map((o) => {
        const items = (o.order_items || []).map((im) => ({
          name: im.product_name || im.products?.name || "Premium Botanical Formulation",
          quantity: im.quantity,
          variant: im.variant || "Standard Form",
          price: Number(im.price),
          image: im.product_image || im.products?.images?.[0] || null,
          category: im.category || im.products?.categories?.name || "General formulation",
          concern: im.concern || im.products?.concern || "All Skins"
        }));
        const profile = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles;
        let parsedCoupon = o.coupon_code || "";
        let parsedDiscountAmount = 0;
        let parsedDiscountPercentage = o.discount_percentage || 0;
        if (!parsedCoupon && o.notes) {
          const promoMatch = o.notes.match(/\[Promo:\s+([^\s]+)\s+\((\d+)%\s+Off\)/i);
          if (promoMatch && promoMatch[1]) {
            parsedCoupon = promoMatch[1];
            parsedDiscountPercentage = Number(promoMatch[2]);
          }
        }
        if (parsedDiscountPercentage > 0) {
          const subtotal = items.reduce((acc, cur) => acc + cur.price * cur.quantity, 0);
          parsedDiscountAmount = Math.round(subtotal * (parsedDiscountPercentage / 100));
        }
        return {
          id: o.id,
          orderId: o.order_number,
          fullName: profile?.full_name || "Guest Patron",
          email: profile?.email || "guest@wenhairskin.com",
          phone: profile?.phone || o.phone || "N/A",
          shippingName: o.shipping_name || profile?.full_name || "Guest Patron",
          shippingPhone: o.shipping_phone || profile?.phone || o.phone || "N/A",
          address: o.shipping_address || "N/A",
          city: o.city || "Pakistan",
          postalCode: o.postal_code || "N/A",
          specialInstructions: o.special_instructions || "N/A",
          paymentMethod: o.payment_method || "COD",
          paymentStatus: (o.payment_status || "unpaid").toUpperCase(),
          confirmationEmail: o.confirmation_email || null,
          confirmationPhone: o.confirmation_phone || null,
          items,
          totalPrice: Number(o.total_amount),
          status: o.status.charAt(0).toUpperCase() + o.status.slice(1),
          couponCode: o.coupon_code || parsedCoupon,
          discountPercentage: o.discount_percentage || parsedDiscountPercentage,
          discount_amount: parsedDiscountAmount,
          date: new Date(o.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          estimatedDelivery: new Date(new Date(o.created_at).getTime() + 3 * 24 * 60 * 60 * 1e3).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        };
      });
      return res.json({ success: true, orders: mappedOrders });
    } catch (err) {
      console.error("Admin Fetch Orders REST API error:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch orders." });
    }
  });
  app.put("/api/admin/orders/:id", async (req, res) => {
    const { id } = req.params;
    const clerkId = req.headers["x-clerk-id"];
    const { status, tracking_id, payment_status } = req.body;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized: Missing clerk ID" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const updateFields = {};
      if (status) updateFields.status = status.toLowerCase();
      if (payment_status) updateFields.payment_status = payment_status.toLowerCase();
      if (tracking_id !== void 0) updateFields.tracking_id = tracking_id;
      const { data: existingOrder } = await supabaseAdmin.from("orders").select(`
          *,
          profiles (*),
          order_items (
            quantity,
            price,
            products (name)
          )
        `).eq("order_number", id).maybeSingle();
      const { data, error } = await supabaseAdmin.from("orders").update(updateFields).eq("order_number", id).select(`
          *,
          profiles (*),
          order_items (
            quantity,
            price,
            products (name)
          )
        `).maybeSingle();
      if (error) throw error;
      const wasInvoiceReady = existingOrder?.status === "delivered" && existingOrder?.payment_status === "paid";
      const isInvoiceReady = data?.status === "delivered" && data?.payment_status === "paid";
      if (!wasInvoiceReady && isInvoiceReady) {
        Promise.resolve().then(() => (init_email(), email_exports)).then(({ sendInvoiceEmail: sendInvoiceEmail2 }) => {
          let emailToUse = existingOrder?.confirmation_email || "";
          let fullName = existingOrder?.shipping_name || "Customer";
          if (!emailToUse && existingOrder?.profiles) {
            const profile = Array.isArray(existingOrder.profiles) ? existingOrder.profiles[0] : existingOrder.profiles;
            emailToUse = profile?.email || "";
            if (fullName === "Customer") fullName = profile?.full_name || "Customer";
          }
          if (!emailToUse) emailToUse = "customer@example.com";
          sendInvoiceEmail2(data, {
            email: emailToUse,
            fullName
          }).catch((err) => {
            console.error("Failed to send invoice email:", err);
          });
        });
      }
      return res.json({ success: true, order: data });
    } catch (err) {
      console.error("Admin Update Order API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/admin/orders/:id", async (req, res) => {
    const { id } = req.params;
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized: Missing clerk ID" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { data: dbOrder } = await supabaseAdmin.from("orders").select("id").eq("order_number", id).maybeSingle();
      if (dbOrder) {
        await supabaseAdmin.from("order_items").delete().eq("order_id", dbOrder.id);
      }
      const { error } = await supabaseAdmin.from("orders").delete().eq("order_number", id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (err) {
      console.error("Admin Delete Order API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/customers", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { data: customers, error } = await supabaseAdmin.from("profiles").select("*").eq("role", "customer").order("created_at", { ascending: false });
      if (error) throw error;
      return res.json({ success: true, customers: customers || [] });
    } catch (err) {
      console.error("Admin Fetch Customers API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/messages", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized: Missing clerk ID" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { data: messages, error } = await supabaseAdmin.from("messages").select("*").order("created_at", { ascending: false });
      if (error) {
        return res.json({ success: true, messages: [] });
      }
      return res.json({ success: true, messages });
    } catch (err) {
      console.error("Messages fetch error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/admin/messages/:id", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    const { id } = req.params;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { error } = await supabaseAdmin.from("messages").delete().eq("id", id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (err) {
      console.error("Delete message error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/categories", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { data: categories, error } = await supabaseAdmin.from("categories").select("*").order("display_order", { ascending: true });
      if (error) throw error;
      return res.json({ success: true, categories: categories || [] });
    } catch (err) {
      console.error("Admin Fetch Categories API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/admin/categories", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { name, slug, display_order } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Category name is required" });
      }
      const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
      const { data: newCategory, error } = await supabaseAdmin.from("categories").insert({
        name,
        slug: generatedSlug,
        display_order: display_order || 1
      }).select().maybeSingle();
      if (error) throw error;
      return res.json({ success: true, category: newCategory });
    } catch (err) {
      console.error("Admin Create Category API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/admin/categories/:id", async (req, res) => {
    const { id } = req.params;
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { name, slug, display_order } = req.body;
      const { data: updatedCategory, error } = await supabaseAdmin.from("categories").update({
        name,
        slug,
        display_order: display_order || 1
      }).eq("id", id).select().maybeSingle();
      if (error) throw error;
      return res.json({ success: true, category: updatedCategory });
    } catch (err) {
      console.error("Admin Update Category API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/admin/categories/:id", async (req, res) => {
    const { id } = req.params;
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { error: updateProdsError } = await supabaseAdmin.from("products").update({ category_id: null }).eq("category_id", id);
      if (updateProdsError) throw updateProdsError;
      const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (err) {
      console.error("Admin Delete Category API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/coupons", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { data: coupons, error } = await supabaseAdmin.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return res.json({ success: true, coupons: coupons || [] });
    } catch (err) {
      console.error("Admin Fetch Coupons API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/admin/coupons", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { code, discount_percentage, is_active, start_date, end_date } = req.body;
      if (!code || !discount_percentage) {
        return res.status(400).json({ error: "Coupon code and discount percentage are required" });
      }
      const { data: newCoupon, error } = await supabaseAdmin.from("coupons").insert({
        code: code.trim().toUpperCase(),
        discount_percentage: Number(discount_percentage),
        is_active: is_active ?? true,
        start_date: start_date || null,
        end_date: end_date || null
      }).select().maybeSingle();
      if (error) throw error;
      return res.json({ success: true, coupon: newCoupon });
    } catch (err) {
      console.error("Admin Create Coupon API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/admin/coupons/:id", async (req, res) => {
    const { id } = req.params;
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { code, discount_percentage, is_active, start_date, end_date } = req.body;
      const { data: updatedCoupon, error } = await supabaseAdmin.from("coupons").update({
        code: code ? code.trim().toUpperCase() : void 0,
        discount_percentage: discount_percentage ? Number(discount_percentage) : void 0,
        is_active,
        start_date: start_date || null,
        end_date: end_date || null
      }).eq("id", id).select().maybeSingle();
      if (error) throw error;
      return res.json({ success: true, coupon: updatedCoupon });
    } catch (err) {
      console.error("Admin Update Coupon API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/admin/coupons/:id", async (req, res) => {
    const { id } = req.params;
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { error } = await supabaseAdmin.from("coupons").delete().eq("id", id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (err) {
      console.error("Admin Delete Coupon API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/product-targets", async (req, res) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: targets, error } = await supabaseAdmin.from("product_targets").select("*").order("name", { ascending: true });
      if (error) {
        if (error.code === "42P01") {
          return res.json({ success: true, targets: [
            { id: "1", name: "Acne & Pore Control", type: "skin" },
            { id: "2", name: "Hair Thinning & Fall", type: "hair" },
            { id: "3", name: "Pigmentation & Dark Spots", type: "skin" },
            { id: "4", name: "Dullness & Glow", type: "skin" },
            { id: "5", name: "Dehydration & Dryness", type: "skin" }
          ] });
        }
        throw error;
      }
      return res.json({ success: true, targets: targets || [] });
    } catch (err) {
      console.error("Fetch Targets API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/admin/product-targets", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { name, type } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "Name and Type (skin/hair) are required" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: Admins only" });
      }
      const { data: newTarget, error } = await supabaseAdmin.from("product_targets").insert({ name: name.trim(), type }).select().maybeSingle();
      if (error) throw error;
      return res.json({ success: true, target: newTarget });
    } catch (err) {
      console.error("Create Target API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/admin/product-targets/:id", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { id } = req.params;
    const { name, type } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "Name and Type (skin/hair) are required" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: Admins only" });
      }
      const { data: updatedTarget, error } = await supabaseAdmin.from("product_targets").update({ name: name.trim(), type }).eq("id", id).select().maybeSingle();
      if (error) throw error;
      return res.json({ success: true, target: updatedTarget });
    } catch (err) {
      console.error("Update Target API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/admin/product-targets/:id", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { id } = req.params;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: Admins only" });
      }
      const { error } = await supabaseAdmin.from("product_targets").delete().eq("id", id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (err) {
      console.error("Delete Target API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/notifications", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: Admins only" });
      }
      try {
        await supabaseAdmin.from("notifications").delete().or(`is_read.eq.true,expires_at.lt.${(/* @__PURE__ */ new Date()).toISOString()},created_at.lt.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString()}`);
      } catch (cleanErr) {
        console.warn("Non-blocking expired notifications cleanup warning:", cleanErr);
      }
      const { data: list, error } = await supabaseAdmin.from("notifications").select("*").order("created_at", { ascending: false });
      if (error) {
        if (error.code === "42P01") {
          return res.json({ success: true, notifications: [
            { id: "n1", type: "new_order", title: "New high-value order received", message: "Order WEN-98741 has been placed for Rs. 4,500.", created_at: new Date(Date.now() - 5 * 60 * 1e3).toISOString(), is_read: false },
            { id: "n2", type: "new_message", title: "Customer inquiry logged", message: "Amna Malik sent a message: Formula Selection Advice.", created_at: new Date(Date.now() - 2 * 60 * 60 * 1e3).toISOString(), is_read: false },
            { id: "n3", type: "low_stock", title: "Stock Alert", message: "Stock for 'Saffron Growth Oil' is critically low (4 items left).", created_at: new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString(), is_read: true }
          ] });
        }
        throw error;
      }
      return res.json({ success: true, notifications: list || [] });
    } catch (err) {
      console.error("Fetch Notifications API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/notifications/unread-count", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: Admins only" });
      }
      const { count, error } = await supabaseAdmin.from("notifications").select("*", { count: "exact", head: true }).eq("is_read", false);
      if (error) {
        if (error.code === "42P01") {
          return res.json({ success: true, count: 2 });
        }
        throw error;
      }
      return res.json({ success: true, count: count || 0 });
    } catch (err) {
      console.error("Notifications unread-count error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/admin/notifications/mark-read", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { id, all } = req.body;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (all === true) {
        const { error } = await supabaseAdmin.from("notifications").update({ is_read: true }).eq("is_read", false);
        if (error && error.code !== "42P01") throw error;
      } else if (id) {
        const { error } = await supabaseAdmin.from("notifications").update({ is_read: true }).eq("id", id);
        if (error && error.code !== "42P01") throw error;
      }
      return res.json({ success: true });
    } catch (err) {
      console.error("Mark notifications read error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/messages", async (req, res) => {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required contact fields" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: dbMsg, error: insertError } = await supabaseAdmin.from("messages").insert({
        name,
        email,
        phone: phone || null,
        subject: subject || "Product Query",
        message,
        is_read: false
      }).select().maybeSingle();
      if (insertError) throw insertError;
      try {
        await supabaseAdmin.from("notifications").insert({
          type: "new_message",
          title: "New Customer Inquiry",
          message: `A new inquiry from ${name} on "${subject || "General"}" has been logged.`,
          data: { message_id: dbMsg?.id, name, email, subject }
        });
      } catch (notifErr) {
        console.error("Non-blocking message notification trigger error:", notifErr);
      }
      return res.json({ success: true, message: dbMsg });
    } catch (err) {
      console.error("Submit Message API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/user/addresses/:id", async (req, res) => {
    const { id } = req.params;
    const { clerk_id } = req.query;
    if (!id || !clerk_id) {
      return res.status(400).json({ error: "Address ID and clerk_id are required" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("clerk_id", clerk_id).maybeSingle();
      if (!profile) {
        return res.status(404).json({ error: "User profile not found" });
      }
      const { error: deleteError } = await supabaseAdmin.from("shipping_addresses").delete().eq("id", id).eq("user_id", profile.id);
      if (deleteError) throw deleteError;
      return res.json({ success: true });
    } catch (err) {
      console.error("Address delete API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/admin/reply-message", async (req, res) => {
    const clerkId = req.headers["x-clerk-id"];
    const { messageId, name, email, subject, originalMessage, date, replyContent } = req.body;
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!messageId || !email || !replyContent) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: Administrative credentials required." });
      }
      const emailResult = await Promise.resolve().then(() => (init_email(), email_exports)).then(
        (m) => m.sendAdminReplyEmail(
          { name, email, subject, message: originalMessage, date },
          replyContent
        )
      );
      if (!emailResult.success) {
        throw new Error(emailResult.error || "Failed to send email via Resend");
      }
      await supabaseAdmin.from("messages").update({ is_read: true }).eq("id", messageId);
      return res.json({ success: true, message: "Reply sent successfully!" });
    } catch (err) {
      console.error("Admin Reply Message API error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admin/orders/:id", async (req, res) => {
    const { id } = req.params;
    const clerkId = req.headers["x-clerk-id"];
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const supabaseAdmin = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
    try {
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("role").eq("clerk_id", clerkId).maybeSingle();
      if (!adminProfile || adminProfile.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: Admins only" });
      }
      const { data: order, error } = await supabaseAdmin.from("orders").select("*, order_items(*, products(*, categories(name)))").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      let customerProfile = null;
      if (order.user_id) {
        const { data: custProf } = await supabaseAdmin.from("profiles").select("*").eq("id", order.user_id).maybeSingle();
        customerProfile = custProf;
      }
      return res.json({
        success: true,
        order: {
          ...order,
          customer: customerProfile
        }
      });
    } catch (err) {
      console.error("Admin order details error:", err);
      return res.status(500).json({ error: err.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = __dirname.endsWith("dist") ? __dirname : import_path.default.join(__dirname, "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[WEN Server] Running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
