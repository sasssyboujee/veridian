"""
simulate_portfolio.py
----------------------
Generates a synthetic but formula-driven portfolio of tokenized panels
rolling out across regions/segments/years, then computes monthly
generation and financials for every panel using the exact formulas
from the research annex:

  kWh_month = wattage_kW * psh(region, month) * 0.80 (derate)
              * degradation_factor(years since install) * days_in_month

  gross_revenue   = kWh_month * offtake_rate * grid_tariff(year)
  champions_fee    = 1.0% of gross_revenue
  core_fee         = 2.0% of gross_revenue
  opportunity_fee  = 4.5% of gross_revenue
  net_yield        = 92.5% of gross_revenue
  om_cost          = 1.5%/yr of capex, pro-rated monthly
  insurance_cost   = 1.0%/yr of capex, pro-rated monthly
  sinking_fund     = capex / (25 years * 12 months)   [straight-line]
  net_distributable = net_yield - om_cost - insurance_cost - sinking_fund

  household_bill_saved = kWh_month * self_consumption_rate * grid_tariff(year)

Run after build_database.py:  python scripts/simulate_portfolio.py
"""
import sqlite3
import calendar
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "db" / "solar_platform.db"

random.seed(42)  # reproducible synthetic rollout

# ---- Simulation configuration -----------------------------------------
PANEL_WATTAGE_W = 450
DERATE_FACTOR = 0.80
ANNUAL_DEGRADATION_RATE = 0.0065        # midpoint of 0.5-0.8%/yr
CAPEX_PER_PANEL_RAND = 6750             # installed cost, proportional share
OM_RATE_ANNUAL = 0.015                  # 1.5% of capex/yr
INSURANCE_RATE_ANNUAL = 0.010           # 1.0% of capex/yr
PANEL_LIFESPAN_YEARS = 25

ROLLOUT_START_YEAR = 2024
ROLLOUT_END_YEAR = 2029          # last year new panels are installed
SIMULATION_END_YEAR = 2030       # generation/financials computed through this year

# Portfolio growth curve: number of NEW panels installed each rollout year
# (illustrative platform growth -- adjust freely to match your pitch's
# fundraising targets)
NEW_PANELS_PER_YEAR = {
    2024: 40,
    2025: 90,
    2026: 160,
    2027: 260,
    2028: 380,
    2029: 500,
}


def month_seasonal_multiplier(month: int, amplitude: float) -> float:
    """
    Sinusoidal seasonal model for the southern hemisphere:
    peak irradiance around January (month 1), trough around July (month 7).
    amplitude=0.10 means +/-10% swing around the annual average.
    """
    import math
    # shift so month 1 (Jan, summer) is at the peak of the cosine
    phase = (month - 1) / 12 * 2 * math.pi
    return 1 + amplitude * math.cos(phase)


def get_psh(annual_avg_psh: float, amplitude: float, month: int) -> float:
    return annual_avg_psh * month_seasonal_multiplier(month, amplitude)


def degradation_factor(years_since_install: float) -> float:
    return max(0.0, (1 - ANNUAL_DEGRADATION_RATE) ** years_since_install)


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    regions = cur.execute(
        "SELECT region_id, region_name, annual_avg_psh, seasonal_amplitude FROM regions"
    ).fetchall()
    segments = cur.execute(
        "SELECT segment_id, segment_name, self_consumption_rate FROM household_segments"
    ).fetchall()
    tariffs = dict(cur.execute("SELECT year, rate_rand_per_kwh FROM tariffs").fetchall())

    # -------------------------------------------------------------
    # 1) Create panels: stagger installs across regions/segments,
    #    weighted so higher-psh regions and the underserved segment
    #    (lower capex barrier, higher social-impact priority) get a
    #    slightly larger share -- adjust weights to match your model.
    # -------------------------------------------------------------
    region_weights = [1.3 if r[2] >= 5.5 else 1.0 for r in regions]  # favor higher psh slightly
    segment_weights = [0.65, 0.35]  # 65% underserved, 35% middle-income

    panel_rows = []
    panel_id = 1
    for year, count in NEW_PANELS_PER_YEAR.items():
        for _ in range(count):
            region = random.choices(regions, weights=region_weights, k=1)[0]
            segment = random.choices(segments, weights=segment_weights, k=1)[0]
            install_month = random.randint(1, 12)
            panel_rows.append((
                panel_id, region[0], segment[0], PANEL_WATTAGE_W,
                year, install_month, CAPEX_PER_PANEL_RAND, 0.80
            ))
            panel_id += 1

    cur.executemany(
        """INSERT INTO panels (panel_id, region_id, segment_id, wattage_w,
                                install_year, install_month, capex_installed_rand,
                                offtake_rate_of_grid)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        panel_rows,
    )
    conn.commit()
    print(f"Inserted {len(panel_rows)} panels "
          f"({ROLLOUT_START_YEAR}-{ROLLOUT_END_YEAR} rollout).")

    # Lookups for fast access during the monthly loop
    region_lookup = {r[0]: (r[2], r[3]) for r in regions}          # id -> (psh, amplitude)
    segment_lookup = {s[0]: (s[1], s[2]) for s in segments}        # id -> (name, self_consumption)

    # -------------------------------------------------------------
    # 2) Generate monthly generation + financials for every panel,
    #    from its install month through SIMULATION_END_YEAR (Dec).
    # -------------------------------------------------------------
    gen_rows = []
    fin_rows = []

    for (pid, region_id, segment_id, wattage_w, iy, im, capex, offtake_rate) in panel_rows:
        annual_avg_psh, amplitude = region_lookup[region_id]
        _, self_consumption_rate = segment_lookup[segment_id]
        wattage_kw = wattage_w / 1000

        y, m = iy, im
        while (y < SIMULATION_END_YEAR) or (y == SIMULATION_END_YEAR and m <= 12):
            days_in_month = calendar.monthrange(y, m)[1]
            months_since_install = (y - iy) * 12 + (m - im)
            years_since_install = months_since_install / 12

            psh = get_psh(annual_avg_psh, amplitude, m)
            deg = degradation_factor(years_since_install)
            daily_kwh = wattage_kw * psh * DERATE_FACTOR * deg
            month_kwh = round(daily_kwh * days_in_month, 3)

            gen_rows.append((pid, y, m, month_kwh, round(deg, 5)))

            grid_tariff = tariffs.get(y, tariffs[max(tariffs)])
            gross_revenue = month_kwh * offtake_rate * grid_tariff
            champions_fee = gross_revenue * 0.010
            core_fee = gross_revenue * 0.020
            opportunity_fee = gross_revenue * 0.045
            net_yield = gross_revenue * 0.925
            om_cost = capex * OM_RATE_ANNUAL / 12
            insurance_cost = capex * INSURANCE_RATE_ANNUAL / 12
            sinking_fund = capex / (PANEL_LIFESPAN_YEARS * 12)
            net_distributable = net_yield - om_cost - insurance_cost - sinking_fund
            household_bill_saved = month_kwh * self_consumption_rate * grid_tariff

            fin_rows.append((
                pid, y, m, round(grid_tariff, 4), round(gross_revenue, 3),
                round(champions_fee, 3), round(core_fee, 3), round(opportunity_fee, 3),
                round(net_yield, 3), round(om_cost, 3), round(insurance_cost, 3),
                round(sinking_fund, 3), round(net_distributable, 3),
                round(household_bill_saved, 3),
            ))

            m += 1
            if m > 12:
                m = 1
                y += 1

    cur.executemany(
        """INSERT INTO generation_monthly (panel_id, year, month, kwh_generated,
                                            degradation_factor)
           VALUES (?, ?, ?, ?, ?)""",
        gen_rows,
    )
    cur.executemany(
        """INSERT INTO financials_monthly
           (panel_id, year, month, tariff_rand_per_kwh, gross_revenue_rand,
            champions_fee_rand, core_fee_rand, opportunity_fee_rand, net_yield_rand,
            om_cost_rand, insurance_cost_rand, sinking_fund_rand,
            net_distributable_rand, household_bill_saved_rand)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        fin_rows,
    )
    conn.commit()
    print(f"Inserted {len(gen_rows)} generation rows and {len(fin_rows)} financial rows.")

    conn.close()
    print("\nPortfolio simulation complete.")


if __name__ == "__main__":
    main()
