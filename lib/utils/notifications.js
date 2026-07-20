const sendNotification = async (email, type, data) => {};

const sendSMSNotification = async (phone, type, data) => {};

const sendPushNotification = async (userId, type, data) => {};

const sendBatchNotifications = async (notifications) => {};

module.exports = {
  sendNotification,
  sendSMSNotification,
  sendPushNotification,
  sendBatchNotifications,
};
