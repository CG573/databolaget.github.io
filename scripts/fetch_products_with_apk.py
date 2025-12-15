#!/usr/bin/env python3
import json
from systembolaget_apk_wrapper import SystembolagetClient

OUTPUT_FILE = "data/products_with_apk.json"


def main():
    client = SystembolagetClient()

    print("Fetching full product assortment…")
    products = client.get_full_assortment()

    print("Calculating APK (ethanol ml per SEK)…")
    for product in products:
        apk = client.ethanol_ml_per_sek(product)
        product["apk"] = apk  # None if calculation failed

    print(f"Saving {len(products)} products to {OUTPUT_FILE}")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print("Done.")


if __name__ == "__main__":
    main()
