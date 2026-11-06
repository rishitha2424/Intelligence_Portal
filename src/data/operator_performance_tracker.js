/**
 * Telecom Operator 3-Year Performance Tracker Data & Utility Functions
 * Source: Bharti Airtel Section 1: Performance at a Glance (Consolidated Investor Report)
 * 
 * STEP 6 - REUSABILITY:
 * To add a new operator (e.g. Jio, Vodafone Idea, Mobily, STC):
 * Simply add a new object to OPERATOR_TRACKER_DATA array with 2022, 2023, 2024 metric values!
 */

// Helper to calculate YoY 3-year performance trend (Step 4)
export function calculateTrend(v2022, v2023, v2024) {
  const change1 = v2023 - v2022; // 2022 -> 2023
  const change2 = v2024 - v2023; // 2023 -> 2024

  if (change1 > 0 && change2 > 0) {
    return {
      label: "Growing",
      color: "#10b981", // Green
      bgColor: "rgba(16, 185, 129, 0.12)",
      borderColor: "rgba(16, 185, 129, 0.3)",
      arrow: "↗",
      icon: "🟢"
    };
  } else if (change1 < 0 && change2 < 0) {
    return {
      label: "Declining",
      color: "#ef4444", // Red
      bgColor: "rgba(239, 68, 68, 0.12)",
      borderColor: "rgba(239, 68, 68, 0.3)",
      arrow: "↘",
      icon: "🔴"
    };
  } else {
    return {
      label: "Mixed",
      color: "#d97706", // Amber / Yellow
      bgColor: "rgba(245, 158, 11, 0.15)",
      borderColor: "rgba(245, 158, 11, 0.3)",
      arrow: "🔀",
      icon: "🟡"
    };
  }
}

export const OPERATOR_TRACKER_DATA = [
  {
    operator_id: "bharti-airtel",
    operator_name: "Bharti Airtel",
    country: "India & Global",
    logo_letter: "A",
    logo_color: "#ef4444",
    investor_url: "https://investor.airtel.in",
    report_title: "Section 1: Performance at a Glance (Consolidated)",
    metrics: [
      {
        metric_key: "customer_base",
        metric_name: "Total Customer Base",
        unit: "000's (M subs)",
        v2022: 489729,
        v2023: 518446,
        v2024: 561970,
        display_2022: "489.7M",
        display_2023: "518.4M",
        display_2024: "562.0M",
        description: "Total mobile and broadband subscribers"
      },
      {
        metric_key: "total_revenue",
        metric_name: "Total Revenue",
        unit: "Rs Mn (₹ Cr)",
        v2022: 1165469,
        v2023: 1391448,
        v2024: 1499824,
        display_2022: "₹1,16,547 Cr",
        display_2023: "₹1,39,145 Cr",
        display_2024: "₹1,49,982 Cr",
        description: "Consolidated gross annual revenue"
      },
      {
        metric_key: "ebitda",
        metric_name: "EBITDA",
        unit: "Rs Mn (₹ Cr)",
        v2022: 581103,
        v2023: 717330,
        v2024: 790458,
        display_2022: "₹58,110 Cr",
        display_2023: "₹71,733 Cr",
        display_2024: "₹79,046 Cr",
        description: "Earnings Before Interest, Taxes, Depreciation & Amortization"
      },
      {
        metric_key: "ebitda_margin",
        metric_name: "EBITDA Margin (%)",
        unit: "%",
        v2022: 49.9,
        v2023: 51.6,
        v2024: 52.7,
        display_2022: "49.9%",
        display_2023: "51.6%",
        display_2024: "52.7%",
        description: "Operating profitability ratio"
      },
      {
        metric_key: "net_income",
        metric_name: "Net Income (Profit)",
        unit: "Rs Mn (₹ Cr)",
        v2022: 42549,
        v2023: 83459,
        v2024: 74670,
        display_2022: "₹4,255 Cr",
        display_2023: "₹8,346 Cr",
        display_2024: "₹7,467 Cr",
        description: "Net profit attributable to equity holders"
      },
      {
        metric_key: "net_debt",
        metric_name: "Net Debt",
        unit: "Rs Mn (₹ Cr)",
        v2022: 1603073,
        v2023: 2131264,
        v2024: 2046461,
        display_2022: "₹1,60,307 Cr",
        display_2023: "₹2,13,126 Cr",
        display_2024: "₹2,04,646 Cr",
        description: "Total borrowings minus cash & liquid investments"
      }
    ]
  },
  {
    operator_id: "reliance-jio",
    operator_name: "Reliance Jio Infocomm",
    country: "India",
    logo_letter: "J",
    logo_color: "#0284c7",
    investor_url: "https://www.jio.com/en-in/investor-relations",
    report_title: "Financial Performance Disclosures (Consolidated)",
    metrics: [
      {
        metric_key: "customer_base",
        metric_name: "Total Customer Base",
        unit: "M subs",
        v2022: 410.2,
        v2023: 439.3,
        v2024: 481.8,
        display_2022: "410.2M",
        display_2023: "439.3M",
        display_2024: "481.8M",
        description: "Total 4G/5G subscribers"
      },
      {
        metric_key: "total_revenue",
        metric_name: "Total Revenue",
        unit: "₹ Cr",
        v2022: 77356,
        v2023: 90786,
        v2024: 100119,
        display_2022: "₹77,356 Cr",
        display_2023: "₹90,786 Cr",
        display_2024: "₹1,00,119 Cr",
        description: "Consolidated revenue from operations"
      },
      {
        metric_key: "ebitda",
        metric_name: "EBITDA",
        unit: "₹ Cr",
        v2022: 37968,
        v2023: 46672,
        v2024: 53248,
        display_2022: "₹37,968 Cr",
        display_2023: "₹46,672 Cr",
        display_2024: "₹53,248 Cr",
        description: "Operating EBITDA"
      },
      {
        metric_key: "ebitda_margin",
        metric_name: "EBITDA Margin (%)",
        unit: "%",
        v2022: 49.1,
        v2023: 51.4,
        v2024: 53.2,
        display_2022: "49.1%",
        display_2023: "51.4%",
        display_2024: "53.2%",
        description: "EBITDA margin percentage"
      },
      {
        metric_key: "net_income",
        metric_name: "Net Income (Profit)",
        unit: "₹ Cr",
        v2022: 14854,
        v2023: 18207,
        v2024: 20607,
        display_2022: "₹14,854 Cr",
        display_2023: "₹18,207 Cr",
        display_2024: "₹20,607 Cr",
        description: "Net profit after tax"
      },
      {
        metric_key: "net_debt",
        metric_name: "Net Debt",
        unit: "₹ Cr",
        v2022: 42100,
        v2023: 48500,
        v2024: 51200,
        display_2022: "₹42,100 Cr",
        display_2023: "₹48,500 Cr",
        display_2024: "₹51,200 Cr",
        description: "Net leverage"
      }
    ]
  }
];
