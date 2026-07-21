"""
visualize.py
------------
Generates the full visualization set into visualizations/output/:
  1. region_month_heatmap_<year>.png   -- generation heatmap (region x month)
  2. yield_pct_heatmap.png              -- net yield % (region x year)
  3. kpi_dashboard.png                  -- 2x2 KPI panel (capacity, generation,
                                            revenue/savings, yield trend)
  4. seasonal_curve.png                 -- monthly generation curve per region
  5. segment_comparison.png             -- household segment bar comparison
  6. interactive_dashboard.html         -- bonus Plotly interactive version

Run after simulate_portfolio.py:  python scripts/visualize.py
"""
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns
import pandas as pd

import queries as q

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "visualizations" / "output"
OUT_DIR.mkdir(parents=True, exist_ok=True)

sns.set_theme(style="whitegrid", context="talk")
PALETTE = "YlOrRd"


def rand(x, pos=None):
    if x >= 1_000_000:
        return f"R{x/1_000_000:.1f}M"
    if x >= 1_000:
        return f"R{x/1_000:.0f}k"
    return f"R{x:.0f}"


def fig_region_month_heatmap(year: int):
    df = q.generation_by_region_month(year)
    fig, ax = plt.subplots(figsize=(12, 6))
    sns.heatmap(df, cmap=PALETTE, annot=False, cbar_kws={"label": "kWh generated"}, ax=ax)
    ax.set_title(f"Portfolio Generation by Region & Month — {year}\n"
                  f"(total kWh generated across all active panels)")
    ax.set_xlabel("Month")
    ax.set_ylabel("Region")
    fig.tight_layout()
    out = OUT_DIR / f"region_month_heatmap_{year}.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    print(f"Saved {out}")


def fig_yield_heatmap():
    df = q.net_yield_pct_by_region_year()
    fig, ax = plt.subplots(figsize=(11, 6))
    sns.heatmap(df, cmap="RdYlGn", annot=True, fmt=".1f",
                cbar_kws={"label": "Net distributable yield (% of capex)"}, ax=ax)
    ax.set_title("Investor Net Yield (%) by Region & Year")
    ax.set_xlabel("Year")
    ax.set_ylabel("Region")
    fig.tight_layout()
    out = OUT_DIR / "yield_pct_heatmap.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    print(f"Saved {out}")


def fig_kpi_dashboard():
    df = q.portfolio_kpis_by_year()
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))

    # Panel A: cumulative capacity / panels installed
    ax = axes[0, 0]
    ax.bar(df["year"], df["cumulative_panels"], color="#2b6cb0")
    ax.set_title("Cumulative Panels Financed")
    ax.set_ylabel("Panels")
    ax.set_xlabel("Year")

    # Panel B: total generation per year
    ax = axes[0, 1]
    ax.plot(df["year"], df["total_kwh_generated"], marker="o", color="#dd6b20", linewidth=2.5)
    ax.set_title("Total Annual Generation")
    ax.set_ylabel("kWh")
    ax.set_xlabel("Year")

    # Panel C: revenue vs household savings
    ax = axes[1, 0]
    width = 0.35
    x = df["year"]
    ax.bar(x - width/2, df["total_gross_revenue_rand"], width, label="Gross platform revenue", color="#2f855a")
    ax.bar(x + width/2, df["total_household_savings_rand"], width, label="Household bill savings", color="#3182ce")
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(rand))
    ax.set_title("Platform Revenue vs. Household Savings")
    ax.set_xlabel("Year")
    ax.legend(fontsize=10)

    # Panel D: portfolio yield trend
    ax = axes[1, 1]
    ax.plot(df["year"], df["portfolio_yield_pct"], marker="s", color="#c53030", linewidth=2.5)
    ax.axhline(20.7, linestyle="--", color="gray", linewidth=1,
               label="Modeled steady-state net yield (20.7%)")
    ax.set_title("Portfolio Net Distributable Yield (%)")
    ax.set_ylabel("% of cumulative capex")
    ax.set_xlabel("Year")
    ax.legend(fontsize=9)

    fig.suptitle("Solar RWA Platform — KPI Dashboard", fontsize=20, fontweight="bold")
    fig.tight_layout(rect=[0, 0, 1, 0.96])
    out = OUT_DIR / "kpi_dashboard.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    print(f"Saved {out}")


def fig_seasonal_curve():
    df = q.seasonal_generation_curve()
    fig, ax = plt.subplots(figsize=(12, 6))
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for region in df.columns:
        ax.plot(months, df[region].values, marker="o", label=region, linewidth=2)
    ax.set_title("Seasonal Generation Curve — Avg kWh per Panel by Region\n"
                  "(southern hemisphere: summer peak Dec-Feb, winter trough Jun-Jul)")
    ax.set_ylabel("Avg kWh / panel / month")
    ax.set_xlabel("Month")
    ax.legend(bbox_to_anchor=(1.02, 1), loc="upper left", fontsize=10)
    fig.tight_layout()
    out = OUT_DIR / "seasonal_curve.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    print(f"Saved {out}")


def fig_segment_comparison():
    df = q.segment_comparison()
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    ax = axes[0]
    ax.bar(df["segment_name"], df["avg_monthly_household_saving"], color="#3182ce")
    ax.set_title("Avg Monthly Household Bill Savings")
    ax.set_ylabel("Rand / month")
    ax.tick_params(axis="x", rotation=15)

    ax = axes[1]
    ax.bar(df["segment_name"], df["panel_count"], color="#dd6b20")
    ax.set_title("Panels Financed per Segment")
    ax.set_ylabel("Panel count")
    ax.tick_params(axis="x", rotation=15)

    fig.suptitle("Household Segment Comparison (latest year)", fontsize=16, fontweight="bold")
    fig.tight_layout(rect=[0, 0, 1, 0.94])
    out = OUT_DIR / "segment_comparison.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    print(f"Saved {out}")


def build_interactive_dashboard():
    """Bonus: a single interactive HTML dashboard using Plotly, in case
    you want something clickable for a live demo instead of static PNGs."""
    try:
        import plotly.graph_objects as go
        from plotly.subplots import make_subplots
    except ImportError:
        print("Plotly not installed -- skipping interactive dashboard "
              "(pip install plotly to enable).")
        return

    kpi_df = q.portfolio_kpis_by_year()
    heat_df = q.net_yield_pct_by_region_year()
    seasonal_df = q.seasonal_generation_curve()

    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=("Cumulative Panels Financed", "Total Annual Generation (kWh)",
                         "Net Yield % by Region & Year", "Seasonal Generation Curve"),
        specs=[[{"type": "bar"}, {"type": "scatter"}],
               [{"type": "heatmap"}, {"type": "scatter"}]],
    )

    fig.add_trace(go.Bar(x=kpi_df["year"], y=kpi_df["cumulative_panels"],
                          name="Cumulative panels", marker_color="#2b6cb0"), row=1, col=1)
    fig.add_trace(go.Scatter(x=kpi_df["year"], y=kpi_df["total_kwh_generated"],
                              mode="lines+markers", name="kWh generated",
                              line=dict(color="#dd6b20", width=3)), row=1, col=2)
    fig.add_trace(go.Heatmap(z=heat_df.values, x=heat_df.columns, y=heat_df.index,
                              colorscale="RdYlGn", colorbar=dict(title="Yield %")),
                  row=2, col=1)
    for region in seasonal_df.columns:
        fig.add_trace(go.Scatter(x=list(range(1, 13)), y=seasonal_df[region],
                                  mode="lines+markers", name=region), row=2, col=2)

    fig.update_layout(height=850, width=1200, title_text="Solar RWA Platform — Interactive Dashboard",
                       title_font_size=22, showlegend=True)
    out = OUT_DIR / "interactive_dashboard.html"
    fig.write_html(out)
    print(f"Saved {out}")


def main():
    latest_year = q.portfolio_kpis_by_year()["year"].max()
    fig_region_month_heatmap(int(latest_year))
    fig_yield_heatmap()
    fig_kpi_dashboard()
    fig_seasonal_curve()
    fig_segment_comparison()
    build_interactive_dashboard()
    print(f"\nAll visuals written to {OUT_DIR}")


if __name__ == "__main__":
    main()
