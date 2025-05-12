// Global variables
let quotedProducts = [];
let products = [];
let editingIndex = null;

// DOM Elements
const productForm = document.getElementById('product-form');
const submitBtn = document.getElementById('submitProductBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const BASE_URL = "https://quotation-backend-2vww.onrender.com";

// Example usage:
fetch(`${BASE_URL}/api/users`)


// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadProductsFromStorage();

    // Real-time price calculation when inputs change
    document.getElementById('regular-price').addEventListener('input', updatePurchasePriceDisplay);
    document.getElementById('special-price').addEventListener('input', updatePurchasePriceDisplay);
    document.getElementById('transport-price').addEventListener('input', updatePurchasePriceDisplay);
    document.querySelectorAll('input[name="price-type"]').forEach(radio => {
        radio.addEventListener('change', updatePurchasePriceDisplay);
    });
    
    // Transport Included dropdown handler
    document.getElementById('transport-included').addEventListener('change', function() {
        const group = document.getElementById('transport-price-group');
        if (this.value === 'No') {
            group.style.display = 'block';
        } else {
            group.style.display = 'none';
            document.getElementById('transport-price').value = '';
        }
        updatePurchasePriceDisplay();
    });

    

    // Form submit handler
    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveProduct();
    });

    // Cancel edit handler
    cancelEditBtn.addEventListener('click', function() {
        resetForm();
    });

    // Search functionality
    document.getElementById('search-input').addEventListener('input', function() {
        const search = this.value.toLowerCase();
        const rows = document.querySelectorAll('#productTable tbody tr');
        rows.forEach(row => {
            const company = row.cells[1].innerText.toLowerCase();
            const product = row.cells[2].innerText.toLowerCase();
            row.style.display = (company.includes(search) || product.includes(search)) ? '' : 'none';
        });
    });

    // Quotation popup handlers
    document.getElementById('createQuotationBtn').addEventListener('click', function() {
        if (quotedProducts.length === 0) {
            alert('Please add products to quotation first!');
            return;
        }
        document.getElementById('quotationPopup').style.display = 'flex';
    });

    document.getElementById('receiver-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const receiverName = document.getElementById('receiver-name').value;
        const organization = document.getElementById('receiver-organization').value;
        const address = document.getElementById('receiver-address').value;
        
        document.getElementById('receiverDetails').innerText = `${receiverName}\n${organization}\n${address}`;
        document.getElementById('quotationPopup').style.display = 'none';
        document.getElementById('finalQuotationPopup').style.display = 'block';
        renderQuotation();
    });

    // CSV upload handler
    document.getElementById('uploadCsvBtn').addEventListener('click', function() {
        const fileInput = document.getElementById('csvFileInput');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a CSV file to upload.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const csvContent = e.target.result;
                const rows = csvContent.split('\n').map(row => row.split(','));
                
                let newProductsCount = 0;
                
                rows.slice(1).forEach((row, index) => {
                    if (row.length < 13) {
                        console.warn('Skipping incomplete row:', row);
                        return;
                    }

                    const product = {
                        company: row[0]?.trim() || '',
                        productName: row[1]?.trim() || '',
                        regularPrice: parseFloat(row[2]?.trim()) || 0,
                        specialPrice: parseFloat(row[3]?.trim()) || 0,
                        transportIncluded: row[4]?.trim() === 'No' ? 'No' : 'Yes',
                        purchaseGST: row[5]?.trim() || '5',
                        transportPrice: parseFloat(row[6]?.trim()) || 0,
                        distributorPrice: parseFloat(row[7]?.trim()) || 0,
                        specialSalePrice: parseFloat(row[8]?.trim()) || 0,
                        institutionalPrice: parseFloat(row[9]?.trim()) || 0,
                        b2cPrice: parseFloat(row[10]?.trim()) || 0,
                        mrpPrice: parseFloat(row[11]?.trim()) || 0,
                        saleGST: row[12]?.trim() || '5',
                        priceType: 'regular'
                    };

                    products.push(product);
                    newProductsCount++;
                });

                saveToLocalStorage();
                refreshTable();
                alert(`Added ${newProductsCount} new products from CSV (Total: ${products.length})`);
            } catch (error) {
                console.error('Error processing CSV:', error);
                alert('Error processing CSV file. Please check the format.');
            }
        };
        
        reader.onerror = function() {
            alert('Error reading file. Please try again.');
        };
        
        reader.readAsText(file);
    });

    // Handle clicks on Add to Quotation buttons
    document.getElementById('productTable').addEventListener('click', function(e) {
        if (e.target.classList.contains('add-quotation-btn')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            addToQuotation(index);
        }
    });

    // Export CSV handler
    document.getElementById('exportCsvBtn').addEventListener('click', exportProductsToCSV);
});

// Load products from localStorage
function loadProductsFromStorage() {
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
        products = JSON.parse(storedProducts);
        refreshTable();
    }
}

// Save products to localStorage
function saveToLocalStorage() {
    localStorage.setItem('products', JSON.stringify(products));
}

// Calculate purchase price with GST
function calculatePurchasePrice(product) {
    let basePrice = product.priceType === 'special' ? product.specialPrice : product.regularPrice;
    let transportPrice = 0;

    if (product.transportIncluded === 'No') {
        transportPrice = product.transportPrice || 0;
    }
    
    // Calculate subtotal before GST
    const subtotal = basePrice + transportPrice;
    
    // Add purchase GST
    const gstPercentage = parseFloat(product.purchaseGST) || 0;
    const totalWithGST = subtotal * (1 + gstPercentage / 100);

    return totalWithGST.toFixed(2);
}

// Update purchase price display
function updatePurchasePriceDisplay() {
    if (!productForm.reportValidity()) return;
    
    const formData = {
        priceType: document.querySelector('input[name="price-type"]:checked').value,
        regularPrice: parseFloat(document.getElementById('regular-price').value) || 0,
        specialPrice: parseFloat(document.getElementById('special-price').value) || 0,
        transportIncluded: document.getElementById('transport-included').value,
        transportPrice: parseFloat(document.getElementById('transport-price').value) || 0,
        purchaseGST: document.getElementById('purchase-gst').value || '5'
    };
    
    const purchasePrice = calculatePurchasePrice(formData);
    document.querySelector('.gap').textContent = purchasePrice;
}

// Save product function
function saveProduct() {
    const productData = {
        company: document.getElementById('company-name').value,
        productName: document.getElementById('product-name').value,
        regularPrice: parseFloat(document.getElementById('regular-price').value) || 0,
        specialPrice: parseFloat(document.getElementById('special-price').value) || 0,
        transportIncluded: document.getElementById('transport-included').value,
        transportPrice: parseFloat(document.getElementById('transport-price').value) || 0,
        priceType: document.querySelector('input[name="price-type"]:checked').value,
        purchaseGST: document.getElementById('purchase-gst').value,
        distributorPrice: parseFloat(document.getElementById('distributor-price').value) || 0,
        specialSalePrice: parseFloat(document.getElementById('special-sale-price').value) || 0,
        institutionalPrice: parseFloat(document.getElementById('institutional-price').value) || 0,
        b2cPrice: parseFloat(document.getElementById('b2c-price').value) || 0,
        mrpPrice: parseFloat(document.getElementById('mrp-price').value) || 0,
        saleGST: document.getElementById('sale-gst').value
    };

    const purchasePrice = calculatePurchasePrice(productData);
    const salePrice = (productData.distributorPrice * (1 + parseFloat(productData.saleGST) / 100)).toFixed(2);

    if (editingIndex !== null) {
        products[editingIndex] = productData;
        updateTableRow(editingIndex, productData, purchasePrice, salePrice);
    } else {
        products.push(productData);
        addTableRow(products.length - 1, productData, purchasePrice, salePrice);
    }

    saveToLocalStorage();
    resetForm();
}

// Rest of the code remains the same until quotation functions...

// Edit product function
function editProduct(index) {
    editingIndex = index;
    const product = products[index];

    document.getElementById('company-name').value = product.company;
    document.getElementById('product-name').value = product.productName;
    document.getElementById('regular-price').value = product.regularPrice;
    document.getElementById('special-price').value = product.specialPrice;
    document.getElementById('transport-included').value = product.transportIncluded;
    document.getElementById('purchase-gst').value = product.purchaseGST;
    document.getElementById('distributor-price').value = product.distributorPrice;
    document.getElementById('special-sale-price').value = product.specialSalePrice;
    document.getElementById('institutional-price').value = product.institutionalPrice;
    document.getElementById('b2c-price').value = product.b2cPrice;
    document.getElementById('mrp-price').value = product.mrpPrice;
    document.getElementById('sale-gst').value = product.saleGST;

    // Set price type
    document.querySelector(`input[name="price-type"][value="${product.priceType || 'regular'}"]`).checked = true;

    // Set transport price
    document.getElementById('transport-price').value = product.transportPrice || '';
    document.getElementById('transport-price-group').style.display = product.transportIncluded === 'No' ? 'block' : 'none';

    submitBtn.textContent = 'Update Product';
    cancelEditBtn.style.display = 'inline-block';
    productForm.scrollIntoView({ behavior: 'smooth' });
}

// Add new row to table
function addTableRow(index, productData, purchasePrice, salePrice) {
    const table = document.getElementById('productTable').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();

    newRow.innerHTML = `
        <td>${index + 1}</td>
        <td>${productData.company}</td>
        <td>${productData.productName}</td>
        <td>${parseFloat(productData.regularPrice).toFixed(2)}</td>
        <td>${parseFloat(productData.specialPrice).toFixed(2)}</td>
        <td>${productData.transportIncluded}</td>
        <td>${productData.purchaseGST}</td>
        <td class="gap">${purchasePrice}</td>
        <td>${productData.distributorPrice}</td>
        <td>${productData.specialSalePrice}</td>
        <td>${productData.institutionalPrice}</td>
        <td>${productData.b2cPrice}</td>
        <td>${productData.mrpPrice}</td>
        <td>${productData.saleGST}</td>
        <td>${salePrice}</td>
        <td>
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 10px;">
                <input type="number" class="quantity-input" value="1" min="1" style="width: 60px; text-align: center; padding: 5px;">
                <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 5px;">
                    <label style="font-size: 14px;"><input type="radio" name="price-option-${index}" value="Distributor" checked> Distributor</label>
                    <label style="font-size: 14px;"><input type="radio" name="price-option-${index}" value="Special"> Special</label>
                    <label style="font-size: 14px;"><input type="radio" name="price-option-${index}" value="Institutional"> Institutional</label>
                    <label style="font-size: 14px;"><input type="radio" name="price-option-${index}" value="B2C"> B2C</label>
                    <label style="font-size: 14px;"><input type="radio" name="price-option-${index}" value="MRP"> MRP</label>
                </div>
                <button class="btn add-quotation-btn" data-index="${index}" style="margin-top: 8px; width: 100%;">Add to Quotation</button>
            </div>
        </td>
        <td>
            <button class="btn edit-btn" data-index="${index}">Edit</button>
            <button class="btn delete-btn" data-index="${index}" style="background-color: #dc3545;">Delete</button>
        </td>
    `;

    newRow.querySelector('.edit-btn').addEventListener('click', function() {
        editProduct(index);
    });
    
    newRow.querySelector('.delete-btn').addEventListener('click', function() {
        deleteProduct(index);
    });
}

// Update existing row
function updateTableRow(index, productData, purchasePrice, salePrice) {
    const table = document.getElementById('productTable').getElementsByTagName('tbody')[0];
    const row = table.rows[index];
    
    if (row) {
        row.cells[0].innerText = index + 1;
        row.cells[1].innerText = productData.company;
        row.cells[2].innerText = productData.productName;
        row.cells[3].innerText = parseFloat(productData.regularPrice).toFixed(2);
        row.cells[4].innerText = parseFloat(productData.specialPrice).toFixed(2);
        row.cells[5].innerText = productData.transportIncluded;
        row.cells[6].innerText = productData.purchaseGST;
        row.cells[7].innerText = purchasePrice;
        row.cells[8].innerText = productData.distributorPrice;
        row.cells[9].innerText = productData.specialSalePrice;
        row.cells[10].innerText = productData.institutionalPrice;
        row.cells[11].innerText = productData.b2cPrice;
        row.cells[12].innerText = productData.mrpPrice;
        row.cells[13].innerText = productData.saleGST;
        row.cells[14].innerText = salePrice;
    }
}


// Add product to quotation

function addToQuotation(index) {
    const row = document.querySelector(`#productTable tbody tr:nth-child(${index + 1})`);
    if (!row) return;

    const quantity = parseInt(row.querySelector('.quantity-input').value) || 1;
    const priceType = row.querySelector(`input[name="price-option-${index}"]:checked`).value;
    
    let rate;
    switch(priceType) {
        case 'Distributor': rate = parseFloat(row.cells[8].textContent); break;
        case 'Special': rate = parseFloat(row.cells[9].textContent); break;
        case 'Institutional': rate = parseFloat(row.cells[10].textContent); break;
        case 'B2C': rate = parseFloat(row.cells[11].textContent); break;
        case 'MRP': rate = parseFloat(row.cells[12].textContent); break;
    }

    const gstRate = parseFloat(row.cells[13].textContent) || 0;
    const gstAmount = (rate * gstRate / 100).toFixed(2);
    const total = ((parseFloat(rate) + parseFloat(gstAmount)) * quantity).toFixed(2);

    // Check if product already exists in quotation
    const existingIndex = quotedProducts.findIndex(item => item.index === index);
    if (existingIndex >= 0) {
        quotedProducts[existingIndex] = {
            index: index,
            company: row.cells[1].textContent,
            product: row.cells[2].textContent,
            priceType: priceType,
            quantity: quantity,
            rate: rate.toFixed(2),
            gstAmount: gstAmount,
            total: total
        };
    } else {
        quotedProducts.push({
            index: index,
            company: row.cells[1].textContent,
            product: row.cells[2].textContent,
            priceType: priceType,
            quantity: quantity,
            rate: rate.toFixed(2),
            gstAmount: gstAmount,
            total: total
        });
    }

    // Add visual indicator
    row.classList.add('quoted-item');
    if (!row.cells[1].querySelector('.quoted-label')) {
        const quotedLabel = document.createElement('span');
        quotedLabel.className = 'quoted-label';
        quotedLabel.textContent = ' ✓ Quoted';
        quotedLabel.style.cssText = 'color: #28a745; font-weight: bold; margin-left: 8px;';
        row.cells[1].appendChild(quotedLabel);
    }
}



function renderQuotation() {
    const tbody = document.querySelector('#quotationTable tbody');
    tbody.innerHTML = '';
    let grandTotal = 0;

    quotedProducts.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.product}</td>
            <td>${item.company}</td>
            <td>${item.priceType}</td>
            <td>${item.quantity}</td>
            <td>₹${item.rate}</td>
            <td>₹${item.gstAmount}</td>
            <td>₹${item.total}</td>
        `;
        tbody.appendChild(row);
        grandTotal += parseFloat(item.total);
    });

    document.getElementById('grandTotal').textContent = grandTotal.toFixed(2);
}

// New: Export products to CSV
function exportProductsToCSV() {
    if (products.length === 0) {
        alert('No products to export!');
        return;
    }

    const csvContent = [
        ['Company', 'Product Name', 'Regular Price', 'Special Price', 'Transport Included', 
         'Purchase GST', 'Transport Price', 'Distributor Price', 'Special Sale Price',
         'Institutional Price', 'B2C Price', 'MRP Price', 'Sale GST'].join(','),
        ...products.map(product => [
            `"${product.company}"`,
            `"${product.productName}"`,
            product.regularPrice,
            product.specialPrice,
            product.transportIncluded,
            product.purchaseGST,
            product.transportPrice,
            product.distributorPrice,
            product.specialSalePrice,
            product.institutionalPrice,
            product.b2cPrice,
            product.mrpPrice,
            product.saleGST
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Delete product function
function deleteProduct(index) {
    if (confirm('Are you sure you want to delete this product?')) {
        products.splice(index, 1);
        saveToLocalStorage();
        refreshTable();
        if (editingIndex === index) {
            resetForm();
        }
    }
}

// Refresh the entire table
function refreshTable() {
    const table = document.getElementById('productTable').getElementsByTagName('tbody')[0];
    table.innerHTML = '';
    
    products.forEach((product, index) => {
        const purchasePrice = calculatePurchasePrice(product);
        const salePrice = (product.distributorPrice * (1 + parseFloat(product.saleGST) / 100)).toFixed(2);
        addTableRow(index, product, purchasePrice, salePrice);
    });
}

// Reset form function
function resetForm() {
    productForm.reset();
    document.getElementById('transport-price-group').style.display = 'none';
    document.querySelector('input[name="price-type"][value="regular"]').checked = true;
    submitBtn.textContent = 'Add Product';
    cancelEditBtn.style.display = 'none';
    editingIndex = null;
}

// Close and PDF actions (keep existing implementation)
function closeFinalQuotation() {
    document.getElementById('finalQuotationPopup').style.display = 'none';
}



function downloadPDF() {
    const element = document.getElementById('finalQuotationPopup');
    const elementClone = element.cloneNode(true);
    
    elementClone.style.display = 'block';
    elementClone.style.width = '100%';
    elementClone.style.padding = '20px';
    
    const tempContainer = document.createElement('div');
    tempContainer.style.width = '210mm';
    tempContainer.style.margin = '0 auto';
    tempContainer.style.padding = '20px';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    
    const header = document.createElement('div');
    header.style.textAlign = 'left';
    header.style.marginBottom = '20px';
    header.innerHTML = `
        <p style="margin: 5px 0; font-size: 10px;">Quotation</p> 
        <img src="data:image/png;base64,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" style="width: 200px; height: auto; margin-bottom: 10px;" />
        <h1 style="margin: 0; font-size: 28px;font-weight:bold;">Surgi-World</h1>     
        <span>17106 3, Premises At Canara Work Shop Ltd</span><br>
        <span>MAROLI, MANGALORE-575005</span><br>
        <span>Email: info@surgiworld.com | Phone: +91 123 456 7890</span>       
        <p style="margin: 5px 0; font-size: 14px;">Date: ${new Date().toLocaleDateString()}</p>
        <p style="margin: 5px 0; font-size: 14px;">Quotation #: ${Math.floor(Math.random() * 10000)}</p>
    `;
    tempContainer.appendChild(header);
    
    // Modified receiver details section with "To:"
    const receiverDetails = document.createElement('div');
    receiverDetails.style.marginBottom = '20px';
    receiverDetails.style.borderBottom = '1px solid #ccc';
    receiverDetails.style.paddingBottom = '20px';
    receiverDetails.innerHTML = `
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">To:</h3>
        <div style="font-size: 14px; line-height: 1.5;">
            ${elementClone.querySelector('#receiverDetails').innerHTML.replace(/\n/g, '<br>')}
        </div>
        <h3 style="margin: 0 0 10px 0; font-size: 16px; text-align:left;">Respected Sir/Madam,</h3>
        <h3 style="margin: 0 0 10px 0; font-size: 16px; text-align:left;">Sub: QUOTATION</h3>
    `;
    tempContainer.appendChild(receiverDetails);
    
    // Rest of the PDF content remains the same...
    const table = elementClone.querySelector('#quotationTable').cloneNode(true);
    table.style.width = '90%';
    table.style.borderCollapse = 'collapse';
    table.style.marginBottom = '20px';
    
    const ths = table.querySelectorAll('th');
    const tds = table.querySelectorAll('td');
    ths.forEach(th => {
        th.style.border = '1px solid #ddd';
        th.style.padding = '8px';
        th.style.textAlign = 'left';
        th.style.backgroundColor = '#f2f2f2';
        th.style.color = 'black';
    });
    tds.forEach(td => {
        td.style.border = '1px solid #ddd';
        td.style.padding = '8px';
        td.style.color = 'black';
    });
    
    tempContainer.appendChild(table);
    
    const grandTotal = document.createElement('div');
    grandTotal.style.textAlign = 'right';
    grandTotal.style.fontWeight = 'bold';
    grandTotal.style.fontSize = '18px';
    grandTotal.style.marginTop = '20px';
    grandTotal.style.width = '90%';
    grandTotal.textContent = `Grand Total: ₹${elementClone.querySelector('#grandTotal').textContent}`;
    tempContainer.appendChild(grandTotal);
    
    const terms = document.createElement('div');
    terms.style.marginTop = '30px';
    terms.style.fontSize = '12px';
    terms.innerHTML = `
        <h3 style="margin-bottom: 5px;">Terms & Conditions:</h3>
        <ul style="margin-top: 5px; padding-left: 20px;">
            <li>Prices are inclusive of all taxes</li>
            <li>Valid for 30 days from date of issue</li>
            <li>Payment terms: 50% advance, 50% on delivery</li>
            <li>Delivery within 15 working days after order confirmation</li>
        </ul>
    `;
    tempContainer.appendChild(terms);
    
    const footer = document.createElement('div');
    footer.style.marginTop = '40px';
    footer.style.paddingTop = '20px';
    footer.style.borderTop = '1px solid #ccc';
    footer.style.textAlign = 'center';
    footer.style.fontSize = '12px';
    footer.style.width = '90%';
    footer.innerHTML = `
        <p>Thank you for your business!</p>
        <p>Surgi-World • 17106 3, Premises At Canara Work Shop Ltd
        MAROLI, MANGALORE-575005 • Phone: +91 123 456 7890 • GSTIN: XXXXXXXX</p>
    `;
    tempContainer.appendChild(footer);
    
    const opt = {
        margin: 10,
        filename: `quotation_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            logging: true,
            useCORS: true,
            scrollY: 0,
            windowWidth: document.body.scrollWidth,
            windowHeight: document.body.scrollHeight
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        },
        pagebreak: {
            mode: ['css', 'legacy'],
            avoid: ['.no-page-break'],
        }
    };
    
    setTimeout(() => {
        html2pdf().set(opt).from(tempContainer).save();
    }, 500);
}

document.getElementById('logout').addEventListener('click', function () {
    // Redirect to login page (or any logout endpoint if backend is used)
    window.location.href = 'index.html';  // change to your actual login page
});