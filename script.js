// 1. Global variable to store the data once it's loaded
let allProducts = [];
const tableBody = document.querySelector('#products-table tbody');

// 2. Function to apply all controls and trigger the re-render
function applyFiltersAndSort() {
    let filteredProducts = [...allProducts]; // Start with a copy of all data

    // --- A. Apply Search Filter ---
    const searchTerm = document.getElementById('search').value.toLowerCase();
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => {
            const name = (product.productNameBold || '') + ' ' + (product.productNameThin || '');
            const category = product.customCategoryTitle || product.categoryLevel1 || '';
            const grapes = (product.grapes || []).join(', ');

            return name.toLowerCase().includes(searchTerm) ||
                category.toLowerCase().includes(searchTerm) ||
                grapes.toLowerCase().includes(searchTerm);
        });
    }

    // --- B. Apply Assortment Filter (Ordervaror/BS, etc.) ---
    const assortmentFilter = document.getElementById('filter-assortment').value;
    if (assortmentFilter) {
        filteredProducts = filteredProducts.filter(product =>
            product.assortment === assortmentFilter
        );
    }

    // --- C. Apply Robust Sorting ---
    const sortBy = document.getElementById('sort-by').value;

    filteredProducts.sort((a, b) => {
        switch (sortBy) {
            case 'apk-desc':
                // Use parseFloat to guarantee numerical comparison
                const apkA = parseFloat(a.apk) || 0;
                const apkB = parseFloat(b.apk) || 0;
                return apkB - apkA;
            case 'apk-asc':
                const apkA_asc = parseFloat(a.apk) || 0;
                const apkB_asc = parseFloat(b.apk) || 0;
                return apkA_asc - apkB_asc;

            case 'price-asc':
                const priceA = parseFloat(a.price) || 0;
                const priceB = parseFloat(b.price) || 0;
                return priceA - priceB;
            case 'price-desc':
                const priceA_desc = parseFloat(a.price) || 0;
                const priceB_desc = parseFloat(b.price) || 0;
                return priceB_desc - priceA_desc;

            case 'volume-desc':
                const volA = parseFloat(a.volume) || 0;
                const volB = parseFloat(b.volume) || 0;
                return volB - volA;

            case 'name-asc':
                // ... (String sorting logic remains the same)
                const nameA = (a.productNameThin || '') + ' ' + (a.productNameBold || '');
                const nameB = (b.productNameThin || '') + ' ' + (b.productNameBold || '');
                return nameA.localeCompare(nameB, 'sv', { sensitivity: 'base' });
            default:
                return 0;
        }
    });

    // --- D. Render the resulting table ---
    console.log(`Rendering ${filteredProducts.length} products after filter/sort.`);
    renderTable(filteredProducts);
}


// Function to fetch the JSON data
async function fetchData() {
    try {
        // Replace 'data.json' with the actual path to your JSON file
        const response = await fetch('data/products_with_apk.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Assuming your JSON is an array of objects
        allProducts = await response.json();

        // Initial rendering: sort by APK descending
        applyFiltersAndSort();
    } catch (error) {
        console.error("Could not fetch products:", error);
        tableBody.innerHTML = '<tr><td colspan="7">Error loading data. Check console.</td></tr>';
    }
}


// 3. Function to render the table (updated from your original script)
function renderTable(products) {
    tableBody.innerHTML = ''; // Clear existing rows

    if (products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">No products found matching the criteria.</td></tr>';
        return;
    }

    products.forEach(product => {
        const row = tableBody.insertRow();

        // Calculate the combined product name
        const productName = `${product.productNameThin || ''} ${product.productNameBold || ''}`.trim();

        // 1. Name
        row.insertCell().textContent = productName;

        // 2. Category
        row.insertCell().textContent = product.customCategoryTitle || product.categoryLevel1 || '-';

        // 3. Volume (ml)
        row.insertCell().textContent = product.volume || '-';

        // 4. ABV (%)
        row.insertCell().textContent = product.alcoholPercentage ? `${product.alcoholPercentage}%` : '-';

        // 5. Price (SEK)
        row.insertCell().textContent = product.price ? `${product.price.toFixed(0)} kr` : '-';

        // 6. APK (Alcohol per Krona) - formatted to 2 decimals
        row.insertCell().textContent = product.apk ? product.apk.toFixed(2) : '-';

        // 7. Link
        const linkCell = row.insertCell();
        if (product.productUrl) {
            const link = document.createElement('a');
            link.href = product.productUrl;
            link.textContent = 'View';
            link.target = '_blank'; // Open link in new tab
            linkCell.appendChild(link);
        } else {
            linkCell.textContent = '-';
        }
    });
}

// Use DOMContentLoaded to ensure all HTML elements are available before attaching listeners
// Global variable to hold the debounce timer
let searchTimeout = null;
const DEBOUNCE_DELAY = 300; // 300 milliseconds

// Function to handle the debounced search
function debouncedApplyFiltersAndSort() {
    // 1. Clear any existing timer
    clearTimeout(searchTimeout);

    // 2. Set a new timer
    searchTimeout = setTimeout(() => {
        // Only run the actual filter/sort logic after the delay
        applyFiltersAndSort();
    }, DEBOUNCE_DELAY);
}

// Use DOMContentLoaded to ensure all HTML elements are available before attaching listeners
document.addEventListener('DOMContentLoaded', () => {
    // 1. Attach listener for the Search input to the DEBOUNCED function
    document.getElementById('search').addEventListener('input', debouncedApplyFiltersAndSort);

    // 2. Attach listeners for the Select elements directly (no debounce needed)
    document.getElementById('filter-assortment').addEventListener('change', applyFiltersAndSort);
    document.getElementById('sort-by').addEventListener('change', applyFiltersAndSort);
});

// Start the process by fetching the data
fetchData();

// Start the process by fetching the data
fetchData();