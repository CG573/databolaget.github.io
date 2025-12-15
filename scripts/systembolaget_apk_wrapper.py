import subprocess
import json
import sys
import time
import threading
import re
import unicodedata

class SystembolagetClient:
    def __init__(self, binary_path="systembolaget"):
        self.binary_path = binary_path

    # -----------------------------------------------------
    # Internal: Simple run (instant output)
    # Adds 'productUrl' to each product if possible
    # -----------------------------------------------------
    def _run(self, *args):
        result = subprocess.run(
            [self.binary_path, *args],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise RuntimeError(
                f"Systembolaget CLI error:\n{result.stderr}"
            )

        data = json.loads(result.stdout)

        # Only modify if it’s a list of products
        if isinstance(data, list):
            for product in data:
                url = self.build_product_url(product)
                if url:
                    product["productUrl"] = url

        return data


    # -----------------------------------------------------
    # Internal: Run with animated spinner
    # -----------------------------------------------------
    def _run_with_spinner(self, *args):
        process = subprocess.Popen(
            [self.binary_path, *args],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        spinner = ["|", "/", "-", "\\"]
        idx = 0
        running = True

        def animate():
            nonlocal idx
            while running and process.poll() is None:
                sys.stdout.write(f"\rFetching full assortment… {spinner[idx % 4]}")
                sys.stdout.flush()
                idx += 1
                time.sleep(0.15)

        t = threading.Thread(target=animate)
        t.start()

        stdout, stderr = process.communicate()
        running = False
        t.join()

        sys.stdout.write("\rDone fetching full assortment.     \n")
        sys.stdout.flush()

        if process.returncode != 0:
            raise RuntimeError(stderr)

        data = json.loads(stdout)

        # -----------------------------------------------------
        # ADD URL GENERATION HERE
        # -----------------------------------------------------
        if isinstance(data, list):
            for product in data:
                url = self.build_product_url(product)
                if url:
                    product["productUrl"] = url
    
        return data


    # -----------------------------------------------------
    # Public API
    # -----------------------------------------------------
    def get_full_assortment(self):
        """
        Fetch every product available from Systembolaget,
        with an animated single-line spinner.
        """
        return self._run_with_spinner(
            "assortment",
            "--sort-by", "Name",
            "--sort", "ascending"
        )

    @staticmethod
    def build_product_url(product):
        """
        Construct a Systembolaget product URL using known fields.
        """

        # Category
        cat = product.get("categoryLevel1", "")
        if not cat:
            return None
        cat = (
            unicodedata.normalize("NFKD", cat)
            .encode("ascii", "ignore")
            .decode()
            .lower()
        )

        # Product name (bold + thin)
        name = (
            (product.get("productNameBold") or "") + " " +
            (product.get("productNameThin") or "")
        ).strip()

        # Slugify the name
        name = unicodedata.normalize("NFKD", name)
        name = name.encode("ascii", "ignore").decode()
        name = name.lower()
        name = re.sub(r"[^a-z0-9]+", "-", name).strip("-")

        # Product number
        number = product.get("productNumber")
        if not number:
            return None

        return f"https://www.systembolaget.se/produkt/{cat}/{name}-{number}/"


    @staticmethod
    def ethanol_ml_per_sek(product):
        """
        Calculate ethanol content (ml) per SEK cost.
        """
        try:
            volume_ml = float(product["volume"])
            abv = float(product["alcoholPercentage"])
            price = float(product["price"])

            ethanol_ml = volume_ml * (abv / 100)
            return ethanol_ml / price

        except (KeyError, ValueError, TypeError):
            return None
