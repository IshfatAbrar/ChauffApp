const nodemailer = require("nodemailer");

// Configure email transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Notification templates
const templates = {
  payment_success: {
    subject: "Payment Confirmation - Chauff",
    template: (data) => `
      <h2>Payment Successful!</h2>
      <p>Your payment for booking #${
        data.bookingId
      } has been processed successfully.</p>
      <p><strong>Amount:</strong> $${data.amount}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      ${
        data.receiptUrl
          ? `<p><a href="${data.receiptUrl}">View Receipt</a></p>`
          : ""
      }
      <p>Thank you for choosing Chauff!</p>
    `,
  },

  payment_failed: {
    subject: "Payment Failed - Chauff",
    template: (data) => `
      <h2>Payment Failed</h2>
      <p>We were unable to process your payment for booking #${data.bookingId}.</p>
      <p><strong>Amount:</strong> $${data.amount}</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p>Please update your payment method or contact support.</p>
      <p><a href="${process.env.FRONTEND_URL}/payment">Update Payment Method</a></p>
    `,
  },

  payment_received: {
    subject: "Payment Received - Chauff Driver",
    template: (data) => `
      <h2>Payment Received!</h2>
      <p>You have received payment for booking #${data.bookingId}.</p>
      <p><strong>Amount:</strong> $${data.amount}</p>
      <p>The funds will be transferred to your account shortly.</p>
      <p><a href="${process.env.FRONTEND_URL}/driver/earnings">View Earnings</a></p>
    `,
  },

  payment_failed_driver: {
    subject: "Payment Issue - Chauff Driver",
    template: (data) => `
      <h2>Payment Processing Issue</h2>
      <p>There was an issue processing payment for booking #${data.bookingId}.</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p>Please contact support if this continues.</p>
    `,
  },

  transfer_completed: {
    subject: "Transfer Completed - Chauff Driver",
    template: (data) => `
      <h2>Transfer Completed!</h2>
      <p>$${data.amount} has been transferred to your Stripe account.</p>
      <p><strong>Available Balance:</strong> $${data.availableBalance}</p>
      <p><a href="${process.env.FRONTEND_URL}/driver/earnings">View Earnings</a></p>
    `,
  },

  transfer_failed: {
    subject: "Transfer Failed - Chauff Driver",
    template: (data) => `
      <h2>Transfer Failed</h2>
      <p>Unable to transfer $${data.amount} to your account.</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p>Please check your bank account details or contact support.</p>
    `,
  },

  account_verified: {
    subject: "Account Verified - Chauff Driver",
    template: (data) => `
      <h2>Account Verified!</h2>
      <p>Your Stripe account has been verified successfully.</p>
      <p><strong>Can Receive Payments:</strong> ${
        data.canReceivePayments ? "Yes" : "Pending"
      }</p>
      <p>You can now receive payments from completed rides.</p>
    `,
  },

  payout_initiated: {
    subject: "Payout Initiated - Chauff Driver",
    template: (data) => `
      <h2>Payout Initiated</h2>
      <p>A payout of $${
        data.amount
      } has been initiated to your bank account.</p>
      <p><strong>Expected Arrival:</strong> ${data.arrivalDate.toLocaleDateString()}</p>
      <p>You'll receive another notification when the payout is completed.</p>
    `,
  },

  payout_completed: {
    subject: "Payout Completed - Chauff Driver",
    template: (data) => `
      <h2>Payout Completed!</h2>
      <p>$${data.amount} has been successfully sent to your bank account.</p>
      ${
        data.bankLast4
          ? `<p><strong>Bank Account:</strong> ****${data.bankLast4}</p>`
          : ""
      }
      <p>The funds should appear in your account within 1-2 business days.</p>
    `,
  },

  payout_failed: {
    subject: "Payout Failed - Chauff Driver",
    template: (data) => `
      <h2>Payout Failed</h2>
      <p>Unable to send $${data.amount} to your bank account.</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p>The funds have been returned to your Stripe balance.</p>
      <p>Please update your bank account details or contact support.</p>
    `,
  },
};

// Send notification function
const sendNotification = async (email, type, data) => {
  try {
    const template = templates[type];
    if (!template) {
      console.error(`Unknown notification type: ${type}`);
      return;
    }

    const mailOptions = {
      from: `"Chauff" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: template.subject,
      html: template.template(data),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Notification sent: ${type} to ${email}`);
  } catch (error) {
    console.error(`Error sending notification: ${type} to ${email}`, error);
  }
};

// Send SMS notification (optional - requires SMS service)
const sendSMSNotification = async (phone, type, data) => {
  // Implementation depends on SMS service provider (Twilio, AWS SNS, etc.)
  console.log(`SMS notification: ${type} to ${phone}`);
};

// Send push notification (optional - requires push service)
const sendPushNotification = async (userId, type, data) => {
  // Implementation depends on push service provider (Firebase, OneSignal, etc.)
  console.log(`Push notification: ${type} to user ${userId}`);
};

// Batch notification sending
const sendBatchNotifications = async (notifications) => {
  const promises = notifications.map(({ email, type, data }) =>
    sendNotification(email, type, data)
  );

  try {
    await Promise.all(promises);
    console.log(`Sent ${notifications.length} notifications successfully`);
  } catch (error) {
    console.error("Error sending batch notifications:", error);
  }
};

module.exports = {
  sendNotification,
  sendSMSNotification,
  sendPushNotification,
  sendBatchNotifications,
};
