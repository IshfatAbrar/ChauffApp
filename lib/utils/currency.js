export function formatCurrency(amount, currency = "USD", locale = "en-US") {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return "";
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(numericAmount);
  } catch (error) {
    return `${numericAmount.toFixed(2)} ${currency}`;
  }
}
