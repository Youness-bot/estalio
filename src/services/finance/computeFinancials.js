/**
 * Simple currency rates (à ajuster si besoin)
 */
const CURRENCY_RATES = {
  EUR_TO_MAD: 10.75,
  MAD_TO_EUR: 1 / 10.75,
  USD_TO_MAD: 10.15,
  MAD_TO_USD: 1 / 10.15
};

/**
 * Règles financières OTA / DIRECT
 */
const CHANNEL_RULES = {
  booking: {
    cityTaxPerPersonPerNight: 4,    // EUR
    cityTaxCurrency: 'EUR',
    commissionRate: 0.17,           // 17%
    bankFeeRate: 0.02,              // 2% only for OTA collect
    applyCommissionAfterTax: true
  },
  airbnb: {
    cityTaxPerPersonPerNight: 4,
    cityTaxCurrency: 'EUR',
    commissionRate: 0.15,
    bankFeeRate: 0.03,
    applyCommissionAfterTax: true
  },
  expedia: {
    cityTaxPerPersonPerNight: 4,
    cityTaxCurrency: 'EUR',
    commissionRate: 0.18,
    bankFeeRate: 0.025,
    applyCommissionAfterTax: true
  },
  vrbo: {
    cityTaxPerPersonPerNight: 4,
    cityTaxCurrency: 'EUR',
    commissionRate: 0.10,
    bankFeeRate: 0.02,
    applyCommissionAfterTax: false
  },
  direct: {
    cityTaxPerPersonPerNight: 4,
    cityTaxCurrency: 'EUR',
    commissionRate: 0,          // Aucune OTA commission en direct booking
    bankFeeRate: 0,             // Pas de bank fee OTA
    applyCommissionAfterTax: false
  }
};

/**
 * Convert currency
 */
function convertCurrency(amount, fromCurrency, toCurrency) {
  if (!amount) return 0;
  if (fromCurrency === toCurrency) return amount;

  const key = `${fromCurrency}_TO_${toCurrency}`;
  const rate = CURRENCY_RATES[key];

  if (!rate) {
    console.warn(`Missing FX rate for ${key}, returning original amount`);
    return amount;
  }
  return amount * rate;
}

/**
 * FINANCIAL ENGINE — MAIN LOGIC
 *
 * reservation = {
 *   gross_amount,
 *   booking_channel,
 *   booking_payment_type: "booking_collect" | "property_collect" | "direct_online" | null,
 *   adults, children, nights,
 *   currency
 * }
 */
export function computeFinancials(reservation) {
  if (!reservation || typeof reservation !== "object") {
    throw new Error("Invalid reservation object");
  }

  const {
    gross_amount,
    booking_channel = "direct",
    booking_payment_type = "property_collect",
    adults = 1,
    children = 0,
    nights = 1,
    currency = "MAD"
  } = reservation;

  if (typeof gross_amount !== "number" || gross_amount <= 0) {
    throw new Error("Invalid gross_amount: must be a positive number");
  }

  const channelKey = booking_channel.toLowerCase();
  const rules = CHANNEL_RULES[channelKey] || CHANNEL_RULES.direct;

  const breakdown = [];

  // ----------------------------------------------------
  // 1) City tax
  // ----------------------------------------------------
  const totalGuests = adults + children;

  const cityTaxSource =
    rules.cityTaxPerPersonPerNight * totalGuests * nights;

  const cityTax = convertCurrency(
    cityTaxSource,
    rules.cityTaxCurrency,
    currency
  );

  breakdown.push({
    step: "City Tax",
    amount: parseFloat(cityTax.toFixed(2)),
    currency
  });

  // ----------------------------------------------------
  // 2) Taxable base
  // ----------------------------------------------------
  const taxableBase = rules.applyCommissionAfterTax
    ? gross_amount - cityTax
    : gross_amount;

  breakdown.push({
    step: "Taxable Base",
    amount: parseFloat(taxableBase.toFixed(2)),
    currency
  });

  // ----------------------------------------------------
  // 3) OTA Commission (toujours appliquée pour OTA, même en property_collect)
  // ----------------------------------------------------
  const commission =
    channelKey !== "direct"
      ? taxableBase * rules.commissionRate
      : 0;

  breakdown.push({
    step: "OTA Commission",
    amount: parseFloat(commission.toFixed(2)),
    applied: commission > 0,
    currency
  });

  // ----------------------------------------------------
  // 4) Bank Fee
  // Conditions :
  // - UNIQUEMENT pour OTA collect (booking_collect)
  // - Direct online = PAS de bank fee OTA
  // ----------------------------------------------------
  const bankFee =
    booking_payment_type === "booking_collect"
      ? gross_amount * rules.bankFeeRate
      : 0;

  breakdown.push({
    step: "Bank Fee",
    amount: parseFloat(bankFee.toFixed(2)),
    applied: bankFee > 0,
    currency
  });

  // ----------------------------------------------------
  // 5) Net revenue
  // ----------------------------------------------------
  const net = gross_amount - cityTax - commission - bankFee;

  breakdown.push({
    step: "Net Revenue",
    amount: parseFloat(net.toFixed(2)),
    currency
  });

  // ----------------------------------------------------
  // RETURN
  // ----------------------------------------------------
  return {
    gross: parseFloat(gross_amount.toFixed(2)),
    commission: parseFloat(commission.toFixed(2)),
    bankFee: parseFloat(bankFee.toFixed(2)),
    cityTax: parseFloat(cityTax.toFixed(2)),
    taxableBase: parseFloat(taxableBase.toFixed(2)),
    net: parseFloat(net.toFixed(2)),
    breakdown,
    meta: {
      channel: booking_channel,
      booking_payment_type,
      currency,
      rules: {
        commissionRate: rules.commissionRate,
        bankFeeRate: rules.bankFeeRate,
        cityTaxPerPersonPerNight: rules.cityTaxPerPersonPerNight,
        cityTaxCurrency: rules.cityTaxCurrency
      }
    }
  };
}

/**
 * Helpers
 */
export function getChannelRules() {
  return { ...CHANNEL_RULES };
}

export function getChannelRulesByName(channel) {
  const key = channel?.toLowerCase();
  return CHANNEL_RULES[key] || null;
}

export function updateCurrencyRates(newRates) {
  Object.assign(CURRENCY_RATES, newRates);
}

export function addChannelRules(channelName, rules) {
  CHANNEL_RULES[channelName.toLowerCase()] = rules;
}

export default computeFinancials;
