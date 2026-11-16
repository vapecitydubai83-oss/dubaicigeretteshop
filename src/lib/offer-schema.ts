// Shared schema.org pieces for every Product offer (product pages + home page list).
// Delivery times as the site states them: express 45–75 min in Dubai/Sharjah/Ajman (same day),
// next-day courier to the other Emirates. Orders are handled the same day.
export const DELIVERY_TIME = {
  "@type": "ShippingDeliveryTime",
  handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
  transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
};

// Owner (2026-11-06): unopened items can be returned within 7 days. Owner 2026-11-16: returns
// are free and our rider collects them.
export const RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "AE",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 7,
  itemCondition: "https://schema.org/NewCondition",
  returnFees: "https://schema.org/FreeReturn",
  returnMethod: "https://schema.org/ReturnByMail", // closest schema value: our rider collects the item (client 2026-11-16)
};
