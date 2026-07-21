# South Africa Solar Tokenization — Research & Financing Math Annex
*Supporting data for the Fractionalized RWA Escrow & Yield Distribution Platform (DDiB '26)*

> **How to use this doc:** every section gives you (1) the sourced figures, (2) the assumption I picked when sources disagreed, and (3) the resulting calculation. Swap any assumption for your own and the downstream math updates the same way — this is meant to slot straight into `docs/DDIB.tex` Section 3 (Economic & Allocation Model) and the pitch script's opening hook.

---

## 1. How much power does a solar panel generate?

- Standard residential panels in 2026 sit in the **400–460 W** range (mono­crystalline), with premium models pushing higher.
- Panel efficiency (17–23%) means two panels of the same wattage can differ in physical size — efficiency, not just wattage, drives footprint.
- Real-world output is **not** the nameplate rating. A widely used derate factor (NREL PVWatts) is **~0.77–0.80** to account for temperature, soiling, wiring, and inverter losses.

**Assumption used throughout this doc:** a **450 W monocrystalline panel** (the common size quoted by SA installers) with a **0.80 derate factor**.

---

## 2. South African solar availability (peak sun hours) by region and season

South Africa averages **1,543–2,264 kWh/m²/year**, i.e. **4.1–6.3 peak sun hours/day** — among the best solar resources in the world.
- **Northern Cape**: high end (~6.3 psh) — best resource in the country.
- **KwaZulu-Natal**: low end (~4.1 psh) — still solid by global standards.
- A ground-truthed study in Alice, Eastern Cape measured average daily GHI of **4.98 kWh/m²** (6.13 on clear-sky days), confirming the modeled ranges.
- Seasonal note: winter (June–Aug) irradiance drops meaningfully in the southern regions (Western/Eastern Cape), while the interior (Free State, Northern Cape, Gauteng) stays comparatively strong year-round — worth a seasonal derate if you model month-by-month cash flow.

**Assumption used:** national blended baseline of **5.5 peak sun hours/day**, with a **low case of 4.1 (KZN)** and **high case of 6.3 (Northern Cape)** for sensitivity.

### Panel output — daily and annual (per 450 W panel)

| Scenario | Formula | Daily output | Annual output |
|---|---|---|---|
| KZN (low, 4.1 psh) | 450W × 4.1h × 0.80 | 1.48 kWh | **539 kWh/yr** |
| National blended (5.5 psh) | 450W × 5.5h × 0.80 | 1.98 kWh | **723 kWh/yr** |
| Northern Cape (high, 6.3 psh) | 450W × 6.3h × 0.80 | 2.27 kWh | **828 kWh/yr** |

---

## 3. Average household power needs, bills, and the data problem you should flag to your TA

This is the messiest number in the whole model, and worth naming explicitly in your report — there are two very different "average households" being cited in the SA solar market:

- **Eskom's own planning assumption**: 30 kWh/day (≈900 kWh/month) — independent analyses (using EIA per-capita consumption data and residential-sector share) suggest this is **overstated**; the implied real figure is closer to **5.7–6.6 kWh/day (≈170–200 kWh/month)** once you back residential-only consumption out of total national sales.
- **Solar installer estimates for existing (already electrified, appliance-heavy) homes**: **800–2,000 kWh/month**, skewed toward urban, middle-income households already targeted by the private residential solar market.

**Why this matters for your pitch:** the "financing gap" hook is strongest if you frame two distinct customer segments rather than one blended household:
1. **Underserved/off-grid or under-electrified households** (closer to the 170–200 kWh/month figure) — this is the socially significant segment and matches your Requirement 3 (democratizing access) narrative.
2. **Grid-connected, bill-paying households** already spending R2,000–R5,000+/month on Eskom/municipal power — this is the segment with an existing bill to displace and therefore the clearer near-term unit economics.

**Tariffs:** Municipal average was **R2.40/kWh** as of 2022; by 2025 many areas exceed **R3.00/kWh**, and Eskom implemented a further **12.7% hike in April 2026**. Historically, tariffs have risen 12–15%/year for over a decade (vs ~5% CPI).

**Assumption used:** **R3.50/kWh** as the blended 2026 reference tariff (flat, no further escalation) for base-case math; note that using a flat tariff *understates* future household savings given the historical escalation trend — you can build an "escalating tariff" upside case for the pitch.

---

## 4. Cost to install one panel

Two different "per panel" numbers matter for the model — keep them distinct in your deck:

| Cost basis | Range | Notes |
|---|---|---|
| **Panel hardware only** | R1,500–R5,500/panel (R2.50–R5.00/W) | Just the module; what you'd pay buying panels alone |
| **Fully installed, per kW** | R12,000–R18,000/kWp (avg ~R15,000/kWp) | Includes inverter, mounting, cabling, labour, Certificate of Compliance |
| **Fully installed, per 450 W panel (proportional share)** | 0.45 kW × R15,000/kWp = **~R6,750/panel** | This is the number to use for investor capital-cost modeling, since a bare panel can't generate income without balance-of-system components |
| **Reference full system (5 kW, ~10–11 panels)** | R75,000–R100,000 installed | Cross-check: R100,000 / 11 panels ≈ R9,000/panel — consistent with the range above once battery/labour variance is included |

**Assumption used:** **R6,750 per panel**, fully installed, proportional share of a grid-tied system (no battery — batteries add R25,000–R75,000 and are a separate model if your platform finances storage too).

---

## 5. Roof area vs panel surface area

- **Panel footprint:** a 450 W panel corresponds to roughly **2.0–2.1 m²** (using the ~20 W/ft² benchmark: 450 W ÷ 215 W/m² ≈ 2.1 m²). Physically, standard panels run **~1.9–2.1 m × 1.0–1.1 m**, weighing 22–27 kg.
- **RDP / low-cost housing roof:** South Africa's ~3.5 million RDP houses have roofs of roughly **40–50 m² total**. After deducting for orientation, obstructions, and the ~75% usable-area rule-of-thumb (fire clearance, ridge/edge setbacks, shading), usable optimally-oriented roof area is closer to **20–30 m²**.
- **Implication:** an RDP roof can physically fit **~10–14 panels** (20–30 m² ÷ 2.1 m²) — meaning **roof space is not the binding constraint** for a low-income household; a baseline system only needs 3–5 panels (see §6). The binding constraint is capital, which is exactly the case your tokenization model is designed to solve.
- **Middle-income home:** average new-build footprint is 120–150 m² (roof area typically larger with pitch), giving ample room for a full 5–10 kW system (10–20 panels, ~40 m²).

---

## 6. How much would this reduce a household's bill?

Worked example, **underserved-household segment** (target consumption ≈180 kWh/month ≈ 6 kWh/day):

- 3 panels × 1.98 kWh/day (national blended) = **5.94 kWh/day ≈ 178 kWh/month** — closely matches baseline need.
- **If 100% self-consumed** (best case, unrealistic without a battery since solar generates midday and usage peaks morning/evening):
 178 kWh × R3.50/kWh = **R623/month** in avoided Eskom/municipal spend.
- **More realistic self-consumption ratio without storage (~70%, based on typical daytime/evening usage mismatch):**
 178 × 0.70 × R3.50 = **~R436/month** in avoided spend.
- Cross-reference: an independent Cape Town-based RDP rooftop-solar + rainwater-harvesting study found combined monthly savings of **~R395** for a household with income around R1,268/month — i.e., **potentially ~25–30% of household income** freed up. This is close to (and validates) the range above.

**Takeaway for the pitch:** a 3–4 panel system (R20,000–R27,000 installed capital) can plausibly offset **R400–R600/month**, a very strong "months to payback the platform's fee load" story for the underserved segment — and directly supports your Requirement 3 (social significance) narrative.

---

## 7. Panel lifecycle, cost, monetary value generated, and depreciation

**Lifecycle inputs (sourced):**
- Lifespan: **25–30 years**
- Degradation: **0.5–0.8%/year**
- Retained output at year 25: **~80–85%** of original rating
- Industry-observed payback for a full residential system in SA today: **4–7 years** (useful as a sanity check against the model below)

### 7.1 Lifetime value generated per panel (avoided-cost basis)

Using the national blended case (723 kWh/yr in year 1), a mid-degradation assumption (~0.65%/yr), and a **flat** R3.50/kWh tariff (conservative — ignores the historical 12–15%/yr tariff escalation):

- Average output over 25 years ≈ 92% of year-1 output (accounting for gradual degradation)
- Lifetime generation ≈ 723 kWh × 25 yrs × 0.92 ≈ **16,630 kWh**
- Lifetime value at flat tariff ≈ 16,630 × R3.50 ≈ **~R58,200 per panel** over 25 years (undiscounted)
- Against an installed cost of R6,750/panel, **simple payback ≈ 2.7 years** on a pure avoided-cost basis (this is faster than the 4–7 year industry figure because that figure includes batteries/inverters/labour on the buyer's side already netted into the "installed system" cost — use the 4–7 year figure as your headline, and the panel-only figure as the underlying driver of it).

### 7.2 Illustrative investor-yield model (EaaS structure, mapped onto your existing 7.5% fee split)

This directly extends the fee structure already in your `yield_engine.py` (1.0% Champions / 2.0% Core / 4.5% Opportunity / 92.5% Net Yield). Treat this as a **starting template, not a final number** — see caveats below.

**Setup:** Platform charges households a discounted rate vs Eskom (household still saves immediately), and passes the revenue through the yield engine to token holders.

| Step | Value |
|---|---|
| Capital cost (installed, per panel) | R6,750 |
| Year-1 generation | 723 kWh |
| EaaS rate charged to household (80% of R3.50 grid tariff — household still saves 20% vs grid) | R2.80/kWh |
| Gross revenue, Year 1 | 723 × R2.80 = **R2,024** |
| Champions Fee (1.0%) | R20 |
| Core Fee (2.0%) | R40 |
| Opportunity Fee (4.5%, reinvested) | R91 |
| **Net Yield to token holders (92.5%)** | **R1,873** |
| Gross yield on capital | R2,024 / R6,750 = **30.0%** |
| **Net yield on capital (before O&M/insurance/reserve — see caveat)** | R1,873 / R6,750 = **27.7%** |

**Caveat — this is too clean.** A defensible model for your report needs to net out at least:
- **O&M**: ~1–2% of capex/year → R68–R135
- **Insurance / asset protection**: ~1% of capex/year → R68 (relevant given your report's own "physical destruction" risk flag)
- **Replacement sinking fund** (straight-line depreciation over 25 yrs): R6,750 / 25 = **R270/year**
- **Non-payment / operator risk buffer**: model a % (your report's "Operator Staking" mechanism is the right tool here, but it needs a modeled default rate, not zero)

Netting O&M + insurance + sinking fund only (excluding default risk, which needs a scenario assumption from your team):
R1,873 − R135 − R68 − R270 ≈ **R1,400/year → 20.7% net yield on capital**

Over the panel's life (25 yrs, average 92% output factor): R1,400 × 25 × 0.92 ≈ **R32,200 cumulative net distribution per R6,750 invested** (~4.8× total, undiscounted — **not an IRR**; you should run a proper discounted cash flow with your Opportunity Fund reinvestment schedule for the pitch, since undiscounted multiples overstate attractiveness to anyone in Q&A who knows finance).

**Honest flag for your TA/Q&A prep:** a 20–30% headline yield will draw skepticism from any judge with finance background — South African grid tariffs are unusually high (hence the fast payback), but you should show the sensitivity table (low/base/high psh scenario × low/base/high self-consumption or off-take-rate scenario) rather than a single number, and be ready to explain why SA's yield profile differs from lower-tariff markets.

---

## 8. Soulbound tokens (SBTs) for long-term investor incentives

**Concept:** SBTs are non-transferable tokens ("bound" to a wallet, the concept borrowed from World of Warcraft's bind-on-pickup items and formalized in Web3 by Vitalik Buterin, E. Glen Weyl and Puja Ohlhaver's 2022 "Decentralized Society" work). Because they can't be sold or transferred, they're suited to representing **reputation, credentials, and loyalty status** rather than tradeable financial claims.

**How this maps onto your platform (design sketch, not existing literature — this is original to your project):**

- Your **RWAToken (ERC-3643)** stays the transferable, liquid economic instrument (the actual yield-bearing fractional ownership).
- A **separate SBT** is minted to a wallet when it holds an RWAToken position **continuously past a defined threshold** (e.g., 12/24/36 months), and is burned/reset if the position is sold before maturity.
- The SBT unlocks **tiered benefits** rather than being the yield instrument itself — this avoids the problem the sources above flag: non-transferable tokens are a poor fit for representing financial claims directly (you can't collateralize or trade what you can't move), so keep the money on the transferable ERC-3643 token and use the SBT purely as a **status/multiplier gate**. Concretely:
 - **Tier 1 (0–12 mo):** base 92.5% net yield split, as modeled above.
 - **Tier 2 (12–24 mo, SBT-gated):** slightly improved yield split (e.g., a portion of the Opportunity Fee redirected to long-term holders) or priority allocation on new asset issuances.
 - **Tier 3 (24+ mo, SBT-gated):** governance weight in the Maintenance Council quorum-fallback mechanism your report already describes, plus first-look rights on secondary real estate/agriculture pool issuances.
- This is directly analogous to documented SBT "tiered pricing/access" patterns already used for DAO membership and loyalty programs, and sidesteps the "stranded capital" critique of financializing SBTs directly by keeping the *value* on a liquid token and the *loyalty signal* on the non-transferable one.
- **Trade-off to state honestly in Q&A:** SBTs add smart-contract and UX complexity, and — as the general SBT literature notes — face open scalability and revocation-governance questions; for a hackathon-scope MVP, a simpler on-chain "holding duration" attribute checked at claim-time can approximate the same incentive without deploying a second token standard, and you can frame full SBT implementation as a documented roadmap item rather than a shipped feature.

---

## 9. Reference list (for your bibliography / footnotes)

1. Peak sun hours & GHI ranges by SA province — Climatebiz, "Average Peak Sun Hours (South Africa)": https://climatebiz.com/average-peak-sun-hours-south-africa/
2. Ground-truthed GHI/DNI measurements, Alice, Eastern Cape — Overen & Meyer, *Energies* 2022, 15(13), 4646: https://doi.org/10.3390/en15134646
3. World Bank / Global Solar Atlas SA irradiation & PV potential dataset: https://globalsolaratlas.info/download/south-africa
4. Household consumption discrepancy analysis (Eskom's 30 kWh/day claim vs measured data): https://www.joburgetc.com/news/411/south-africa-electricity-consumption/
5. Household consumption range (800–2,000 kWh/month, existing electrified homes) — PowerNSun: https://powernsun.co.za/how-many-kw-is-a-normal-house-in-south-africa/
6. Eskom Residential Calculator (municipal tariff baseline, R2.40/kWh 2022): https://www.eskom.co.za/distribution/residential-calculator/
7. Electricity tariff trend/history (2007–2025, 10x increase): https://www.alternative-energy-sources.co.za/electricity-cost-south-africa/
8. Solar panel prices SA 2026 (R1,500–R5,500/panel): https://energybee.co.za/guides/solar-panel-prices-south-africa-2026 and https://www.solarcost.co.za/solar-panel-prices-south-africa/
9. Installed cost per kW & payback period (2026, R12,000–R18,000/kWp, 4–7 yr payback): https://energybee.co.za/guides/rooftop-solar-installation-cost-south-africa-2026
10. Panel degradation/lifespan (25–30 yrs, 0.5–0.8%/yr, 80–85% retained at yr 25): https://solarza.co.za/panels/prices
11. Panel dimensions & watts/m² benchmark: https://www.thegreenwatt.com/solar-panel-watts-per-square-foot/ and https://www.thegreenwatt.com/standard-solar-panel-sizes-and-wattages-dimensions/
12. RDP house size (~40–50 m², 3.5M+ nationally) & combined rooftop solar/rainwater savings case study (Cape Town): https://allafrica.com/stories/202606180037.html
13. Average new-build house/roof footprint trend (146 m² avg by 2010): https://www.housecheck.co.za/sa-homes-getting-smaller/
14. Soulbound tokens — general concept, use cases, tiered access patterns: https://www.cube.exchange/what-is/soulbound-token and https://devtechnosys.com/insights/soulbound-token-development/
15. Note: South Africa's national infrastructure and energy financing-gap statistics (R2–4 trillion infrastructure gap, R3.6–4.2 trillion energy sector gap by 2050) were supplied by your TA per the project thread and are not independently re-verified in this annex — recommend sourcing the primary report (likely National Treasury / DBSA infrastructure reports) before citing in the final academic paper, since secondary citations of these figures vary in wording.

---

## 10. Suggested next step for the team

Build a single spreadsheet (one tab per scenario: low/base/high psh × underserved/middle-income segment) that takes Sections 1–7's formulas as live inputs, so Josephine can flex the "R4 trillion gap" hook against a bottom-up per-panel/per-household model live in Q&A if a judge pushes on the numbers — that combination (top-down macro stat + bottom-up unit economics that reconcile) is usually what separates a strong pitch from a hand-wavy one.
