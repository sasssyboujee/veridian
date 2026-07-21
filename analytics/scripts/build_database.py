"""
build_database.py
------------------
Creates db/solar_platform.db from schema.sql and seeds the reference
tables (regions, household_segments, tariffs) with the figures from
the research annex.

Run this first:  python scripts/build_database.py
"""
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "db" / "solar_platform.db"
SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


# Regions: annual_avg_psh and seasonal_amplitude.
# Northern Cape (high, sourced) and KwaZulu-Natal (low, sourced) anchor
# the range; the rest are interpolated estimates -- see schema.sql note.
REGIONS = [
    # name,            climate_zone, annual_avg_psh, seasonal_amplitude, is_sourced_endpoint
    ("Northern Cape",  "desert",     6.3, 0.10, 1),
    ("Free State",     "interior",   5.9, 0.15, 0),
    ("North West",     "interior",   5.8, 0.15, 0),
    ("Limpopo",        "interior",   5.7, 0.14, 0),
    ("Mpumalanga",     "interior",   5.5, 0.16, 0),
    ("Gauteng",        "interior",   5.5, 0.16, 0),
    ("Western Cape",   "coastal",    5.0, 0.22, 0),
    ("Eastern Cape",   "coastal",    4.9, 0.18, 1),   # ~4.98 measured, Alice EC
    ("KwaZulu-Natal",  "coastal",    4.1, 0.20, 1),
]

HOUSEHOLD_SEGMENTS = [
    # name,                            avg_monthly_kwh_need, self_consumption_rate
    ("Underserved / off-grid target",   180,  0.70),
    ("Grid-connected middle-income",    1000, 0.55),
]

# National tariff by year. 2026 baseline R3.50/kWh, escalated at 10%/yr
# (conservative vs the historically observed 12-15%/yr) for projection years.
def build_tariff_schedule(base_year=2026, base_rate=3.50, escalation=0.10,
                           start_year=2023, end_year=2035):
    schedule = {}
    for year in range(start_year, end_year + 1):
        years_from_base = year - base_year
        schedule[year] = round(base_rate * ((1 + escalation) ** years_from_base), 4)
    return schedule


def main():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()
        print(f"Removed existing database at {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    with open(SCHEMA_PATH, "r") as f:
        cur.executescript(f.read())
    print("Schema created.")

    cur.executemany(
        """INSERT INTO regions (region_name, climate_zone, annual_avg_psh,
                                 seasonal_amplitude, is_sourced_endpoint)
           VALUES (?, ?, ?, ?, ?)""",
        REGIONS,
    )
    print(f"Seeded {len(REGIONS)} regions.")

    cur.executemany(
        """INSERT INTO household_segments (segment_name, avg_monthly_kwh_need,
                                            self_consumption_rate)
           VALUES (?, ?, ?)""",
        HOUSEHOLD_SEGMENTS,
    )
    print(f"Seeded {len(HOUSEHOLD_SEGMENTS)} household segments.")

    tariffs = build_tariff_schedule()
    cur.executemany(
        "INSERT INTO tariffs (year, rate_rand_per_kwh) VALUES (?, ?)",
        list(tariffs.items()),
    )
    print(f"Seeded tariff schedule for {len(tariffs)} years "
          f"({min(tariffs)}-{max(tariffs)}).")

    conn.commit()
    conn.close()
    print(f"\nDatabase ready at {DB_PATH}")


if __name__ == "__main__":
    main()
