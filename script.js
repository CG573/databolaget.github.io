// 1. Global variable to store the data once it's loaded
const DATA_FILE_PATH = 'data/products_with_apk.json';
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

// New function to fetch the last updated timestamp from GitHub's API
async function fetchLastUpdatedTime() {
    const timeElement = document.getElementById('last-updated-time');

    // 1. Construct the API URL for file metadata
    // NOTE: Replace 'cg573/databolaget.github.io' with your actual 'OWNER/REPO' path
    // For GitHub Pages repos, the main branch is usually 'main' or 'master'
    const githubApiUrl = `https://api.github.com/repos/cg573/databolaget.github.io/commits?path=${DATA_FILE_PATH}&page=1&per_page=1`;

    try {
        const response = await fetch(githubApiUrl);
        if (!response.ok) {
            timeElement.textContent = 'Last update time unavailable.';
            return;
        }

        const commits = await response.json();

        if (commits.length > 0) {
            // Get the commit date from the first (latest) commit
            const lastCommitDate = commits[0].commit.author.date;

            // Format the date for human readability (using Swedish locale)
            const date = new Date(lastCommitDate);
            const formatter = new Intl.DateTimeFormat('sv-SE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Stockholm' // Adjust timezone if needed
            });
            const formattedDate = formatter.format(date);

            timeElement.textContent = `Senast uppdaterad: ${formattedDate}`;
        }
    } catch (error) {
        console.error("Could not fetch update time:", error);
        timeElement.textContent = 'Last update time failed to load.';
    }
}

// Function to fetch the JSON data (modified to call fetchLastUpdatedTime)
async function fetchData() {
    try {
        const response = await fetch(DATA_FILE_PATH);
        // ... (rest of your existing fetchData logic) ...

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allProducts = await response.json();

        // Initial rendering
        applyFiltersAndSort();

        // 🚀 Fetch and display the last updated time after data is loaded
        fetchLastUpdatedTime();

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