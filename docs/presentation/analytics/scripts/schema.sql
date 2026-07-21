-- =====================================================================
-- Solar RWA Tokenization Platform — Analytics Database Schema
-- SQLite. Source figures documented in README.md / research annex.
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- Reference: South African regions with annual peak-sun-hour baselines
-- and a seasonal-swing amplitude used to model monthly variation.
-- Sourced endpoints: national range 4.1-6.3 psh/day; Northern Cape = high
-- end, KwaZulu-Natal = low end (Climatebiz / Global Solar Atlas).
-- Other provinces are INTERPOLATED for modeling purposes -- swap in
-- Global Solar Atlas per-province GHI data for production use.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS regions (
    region_id           INTEGER PRIMARY KEY,
    region_name         TEXT NOT NULL UNIQUE,
    climate_zone        TEXT NOT NULL,          -- 'interior', 'coastal', 'desert'
    annual_avg_psh       REAL NOT NULL,          -- peak sun hours/day, annual average
    seasonal_amplitude   REAL NOT NULL,          -- fractional swing +/- around the average (0.10 = ±10%)
    is_sourced_endpoint  INTEGER NOT NULL DEFAULT 0  -- 1 = directly sourced, 0 = interpolated
);

-- ---------------------------------------------------------------------
-- Household segments (see annex Section 3: two distinct customer types)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS household_segments (
    segment_id           INTEGER PRIMARY KEY,
    segment_name         TEXT NOT NULL UNIQUE,
    avg_monthly_kwh_need REAL NOT NULL,
    self_consumption_rate REAL NOT NULL          -- fraction of generation offsetting the bill directly
);

-- ---------------------------------------------------------------------
-- National tariff by year (R/kWh). 2026 baseline R3.50, escalation
-- applied at simulation time (default 10%/yr, historically 12-15%/yr).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tariffs (
    year                 INTEGER PRIMARY KEY,
    rate_rand_per_kwh    REAL NOT NULL
);

-- ---------------------------------------------------------------------
-- Individual financed panels (the "assets" in the RWA sense). Each row
-- is one tokenized 450W panel with an install date, region and segment.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS panels (
    panel_id             INTEGER PRIMARY KEY,
    region_id            INTEGER NOT NULL REFERENCES regions(region_id),
    segment_id           INTEGER NOT NULL REFERENCES household_segments(segment_id),
    wattage_w            REAL NOT NULL DEFAULT 450,
    install_year          INTEGER NOT NULL,
    install_month         INTEGER NOT NULL,       -- 1-12
    capex_installed_rand REAL NOT NULL,           -- installed cost per panel (proportional system share)
    offtake_rate_of_grid REAL NOT NULL DEFAULT 0.80  -- EaaS rate charged to household, as fraction of grid tariff
);

-- ---------------------------------------------------------------------
-- Monthly generation log per panel (kWh). Populated by simulate_portfolio.py
-- using: kWh = wattage_kW * psh(region,month) * derate(0.80) * degradation(age)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS generation_monthly (
    panel_id             INTEGER NOT NULL REFERENCES panels(panel_id),
    year                 INTEGER NOT NULL,
    month                INTEGER NOT NULL,        -- 1-12
    kwh_generated        REAL NOT NULL,
    degradation_factor   REAL NOT NULL,           -- 1.0 = no degradation yet
    PRIMARY KEY (panel_id, year, month)
);

-- ---------------------------------------------------------------------
-- Monthly financials per panel, mirrors the 7.5% tiered fee structure
-- already defined in the platform's yield_engine.py:
--   1.0% Champions / 2.0% Core / 4.5% Opportunity / 92.5% Net Yield
-- plus O&M, insurance, and a straight-line replacement sinking fund.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS financials_monthly (
    panel_id             INTEGER NOT NULL REFERENCES panels(panel_id),
    year                 INTEGER NOT NULL,
    month                INTEGER NOT NULL,
    tariff_rand_per_kwh  REAL NOT NULL,
    gross_revenue_rand   REAL NOT NULL,
    champions_fee_rand   REAL NOT NULL,
    core_fee_rand        REAL NOT NULL,
    opportunity_fee_rand REAL NOT NULL,
    net_yield_rand       REAL NOT NULL,           -- 92.5% of gross, before opex deductions
    om_cost_rand         REAL NOT NULL,
    insurance_cost_rand  REAL NOT NULL,
    sinking_fund_rand    REAL NOT NULL,
    net_distributable_rand REAL NOT NULL,         -- what actually reaches token holders
    household_bill_saved_rand REAL NOT NULL,      -- household-side savings vs full grid tariff
    PRIMARY KEY (panel_id, year, month)
);

-- Helpful indexes for the aggregations the dashboard will run
CREATE INDEX IF NOT EXISTS idx_panels_region ON panels(region_id);
CREATE INDEX IF NOT EXISTS idx_panels_segment ON panels(segment_id);
CREATE INDEX IF NOT EXISTS idx_gen_year_month ON generation_monthly(year, month);
CREATE INDEX IF NOT EXISTS idx_fin_year_month ON financials_monthly(year, month);
