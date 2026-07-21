"""
queries.py
----------
Reusable functions that pull data out of solar_platform.db into pandas
DataFrames. Import these in a notebook or in visualize.py rather than
writing raw SQL every time.
"""
import sqlite3
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "db" / "solar_platform.db"


def get_connection():
    return sqlite3.connect(DB_PATH)


def generation_by_region_month(year: int) -> pd.DataFrame:
    """Region x Month matrix of total kWh generated, for heatmaps."""
    q = """
        SELECT r.region_name, g.month, SUM(g.kwh_generated) AS total_kwh
        FROM generation_monthly g
        JOIN panels p ON p.panel_id = g.panel_id
        JOIN regions r ON r.region_id = p.region_id
        WHERE g.year = ?
        GROUP BY r.region_name, g.month
        ORDER BY r.region_name, g.month
    """
    with get_connection() as conn:
        df = pd.read_sql_query(q, conn, params=(year,))
    pivot = df.pivot(index="region_name", columns="month", values="total_kwh").fillna(0)
    pivot.columns = [pd.to_datetime(str(m), format="%m").strftime("%b") for m in pivot.columns]
    return pivot


def net_yield_pct_by_region_year() -> pd.DataFrame:
    """Region x Year matrix of average net-distributable yield as % of capex."""
    q = """
        SELECT r.region_name, f.year,
               SUM(f.net_distributable_rand) AS net_distributable,
               SUM(p_capex.capex_installed_rand) / 12.0 AS capex_month_equiv
        FROM financials_monthly f
        JOIN panels p ON p.panel_id = f.panel_id
        JOIN regions r ON r.region_id = p.region_id
        JOIN panels p_capex ON p_capex.panel_id = f.panel_id
        GROUP BY r.region_name, f.year
    """
    with get_connection() as conn:
        raw = pd.read_sql_query(q, conn)
        capex_by_region = pd.read_sql_query(
            """SELECT r.region_name, SUM(p.capex_installed_rand) AS total_capex
               FROM panels p JOIN regions r ON r.region_id = p.region_id
               GROUP BY r.region_name""",
            conn,
        )
    merged = raw.groupby(["region_name", "year"], as_index=False)["net_distributable"].sum()
    merged = merged.merge(capex_by_region, on="region_name")
    merged["yield_pct"] = (merged["net_distributable"] / merged["total_capex"]) * 100
    pivot = merged.pivot(index="region_name", columns="year", values="yield_pct").fillna(0)
    return pivot


def portfolio_kpis_by_year() -> pd.DataFrame:
    """Year-over-year platform KPIs: capacity, panels, generation, revenue, savings."""
    q = """
        SELECT
            f.year,
            COUNT(DISTINCT f.panel_id)                    AS active_panels,
            SUM(g.kwh_generated)                           AS total_kwh_generated,
            SUM(f.gross_revenue_rand)                      AS total_gross_revenue_rand,
            SUM(f.net_distributable_rand)                  AS total_net_distributable_rand,
            SUM(f.household_bill_saved_rand)                AS total_household_savings_rand
        FROM financials_monthly f
        JOIN generation_monthly g
          ON g.panel_id = f.panel_id AND g.year = f.year AND g.month = f.month
        GROUP BY f.year
        ORDER BY f.year
    """
    with get_connection() as conn:
        df = pd.read_sql_query(q, conn)

    cumulative_capex_q = """
        SELECT install_year AS year, SUM(capex_installed_rand) AS new_capex_rand,
               COUNT(*) AS new_panels
        FROM panels GROUP BY install_year ORDER BY install_year
    """
    with get_connection() as conn:
        capex_df = pd.read_sql_query(cumulative_capex_q, conn)
    capex_df["cumulative_capex_rand"] = capex_df["new_capex_rand"].cumsum()
    capex_df["cumulative_panels"] = capex_df["new_panels"].cumsum()

    df = df.merge(capex_df[["year", "cumulative_capex_rand", "cumulative_panels"]],
                   on="year", how="left")
    df["cumulative_capex_rand"] = df["cumulative_capex_rand"].ffill()
    df["cumulative_panels"] = df["cumulative_panels"].ffill()
    df["portfolio_yield_pct"] = (df["total_net_distributable_rand"] /
                                  df["cumulative_capex_rand"]) * 100
    return df


def seasonal_generation_curve(region_names=None) -> pd.DataFrame:
    """Average monthly kWh/panel by region, across all years -- shows the
    seasonal curve per region (line chart: month on x-axis, one line per region)."""
    q = """
        SELECT r.region_name, g.month, AVG(g.kwh_generated) AS avg_kwh_per_panel
        FROM generation_monthly g
        JOIN panels p ON p.panel_id = g.panel_id
        JOIN regions r ON r.region_id = p.region_id
        GROUP BY r.region_name, g.month
        ORDER BY r.region_name, g.month
    """
    with get_connection() as conn:
        df = pd.read_sql_query(q, conn)
    if region_names:
        df = df[df["region_name"].isin(region_names)]
    return df.pivot(index="month", columns="region_name", values="avg_kwh_per_panel")


def segment_comparison() -> pd.DataFrame:
    """Household-segment level comparison: avg monthly savings, yield, panel counts."""
    q = """
        SELECT
            hs.segment_name,
            COUNT(DISTINCT p.panel_id)                       AS panel_count,
            AVG(f.household_bill_saved_rand)                  AS avg_monthly_household_saving,
            AVG(f.net_distributable_rand)                     AS avg_monthly_net_distributable,
            AVG(p.capex_installed_rand)                       AS avg_capex_rand
        FROM financials_monthly f
        JOIN panels p ON p.panel_id = f.panel_id
        JOIN household_segments hs ON hs.segment_id = p.segment_id
        WHERE f.year = (SELECT MAX(year) FROM financials_monthly)
        GROUP BY hs.segment_name
    """
    with get_connection() as conn:
        return pd.read_sql_query(q, conn)


def region_summary_table() -> pd.DataFrame:
    """One row per region: sourced psh baseline, panel count, total capacity, total capex."""
    q = """
        SELECT
            r.region_name, r.climate_zone, r.annual_avg_psh, r.is_sourced_endpoint,
            COUNT(p.panel_id)                              AS panel_count,
            SUM(p.wattage_w) / 1000.0                       AS total_capacity_kw,
            SUM(p.capex_installed_rand)                     AS total_capex_rand
        FROM regions r
        LEFT JOIN panels p ON p.region_id = r.region_id
        GROUP BY r.region_name
        ORDER BY r.annual_avg_psh DESC
    """
    with get_connection() as conn:
        return pd.read_sql_query(q, conn)


if __name__ == "__main__":
    # Quick smoke test when run directly
    print(portfolio_kpis_by_year())
