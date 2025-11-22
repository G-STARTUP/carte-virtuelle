<?php
$pageTitle = 'GWAP - Transactions';
include '../includes/header.php';
?>

<div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <a href="../dashboard.php" class="text-purple-600 hover:text-purple-700">
                    <i class="fas fa-arrow-left mr-2"></i>Retour
                </a>
                <h1 class="text-xl font-bold">Historique des transactions</h1>
                <div></div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 class="text-lg font-semibold mb-4">Filtres</h3>
            <div class="grid md:grid-cols-4 gap-4">
                <select id="filterType" class="px-4 py-2 border rounded-lg">
                    <option value="">Tous les types</option>
                    <option value="credit">Crédit</option>
                    <option value="debit">Débit</option>
                    <option value="card_purchase">Achat carte</option>
                    <option value="card_reload">Rechargement carte</option>
                    <option value="deposit">Dépôt</option>
                </select>
                
                <select id="filterCurrency" class="px-4 py-2 border rounded-lg">
                    <option value="">Toutes les devises</option>
                    <option value="USD">USD</option>
                    <option value="NGN">NGN</option>
                    <option value="XOF">XOF</option>
                </select>
                
                <input type="date" id="filterFrom" class="px-4 py-2 border rounded-lg" placeholder="Date début">
                <input type="date" id="filterTo" class="px-4 py-2 border rounded-lg" placeholder="Date fin">
            </div>
            <button onclick="applyFilters()" class="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
                <i class="fas fa-filter mr-2"></i>Appliquer les filtres
            </button>
        </div>

        <!-- Transactions Table -->
        <div class="bg-white rounded-xl shadow-md overflow-hidden">
            <div class="overflow-x-auto">
                <div id="transactionsTable">
                    <div class="text-center py-12">
                        <i class="fas fa-spinner fa-spin text-4xl text-purple-600 mb-4"></i>
                        <p class="text-gray-600">Chargement des transactions...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div id="pagination" class="mt-6 flex justify-center"></div>
    </div>
</div>

<script>
if (!localStorage.getItem('token')) window.location.href = '../login.php';

let currentPage = 1;
const perPage = 20;

async function loadTransactions(page = 1) {
    try {
        const type = document.getElementById('filterType')?.value || '';
        const currency = document.getElementById('filterCurrency')?.value || '';
        const from = document.getElementById('filterFrom')?.value || '';
        const to = document.getElementById('filterTo')?.value || '';

        let url = `/api/wallets.php?action=transactions&page=${page}&limit=${perPage}`;
        if (type) url += `&type=${type}`;
        if (currency) url += `&currency=${currency}`;
        if (from) url += `&from=${from}`;
        if (to) url += `&to=${to}`;

        const response = await apiRequest(url, { method: 'GET' });
        
        if (response.success && response.data) {
            displayTransactions(response.data);
            updatePagination(response.pagination || { total: response.data.length, page, perPage });
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactionsTable').innerHTML = `
            <div class="text-center py-12 text-red-600">
                <i class="fas fa-exclamation-triangle text-3xl mb-4"></i>
                <p>Erreur lors du chargement</p>
            </div>
        `;
    }
}

function displayTransactions(transactions) {
    const container = document.getElementById('transactionsTable');
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-600">
                <i class="fas fa-inbox text-4xl mb-4"></i>
                <p>Aucune transaction trouvée</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table class="w-full">
            <thead class="bg-gray-50 border-b">
                <tr>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                ${transactions.map(tx => `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm whitespace-nowrap">
                            ${new Date(tx.created_at).toLocaleString('fr-FR')}
                        </td>
                        <td class="px-6 py-4 text-sm whitespace-nowrap">
                            <span class="px-2 py-1 rounded-full text-xs ${getTypeColor(tx.type)}">
                                ${formatType(tx.type)}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm">${tx.description || '-'}</td>
                        <td class="px-6 py-4 text-sm font-semibold whitespace-nowrap ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}">
                            ${tx.amount > 0 ? '+' : ''}${tx.amount} ${tx.currency || 'USD'}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500 font-mono">${tx.reference || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function getTypeColor(type) {
    const colors = {
        'credit': 'bg-green-100 text-green-800',
        'debit': 'bg-red-100 text-red-800',
        'conversion': 'bg-blue-100 text-blue-800',
        'card_purchase': 'bg-purple-100 text-purple-800',
        'card_reload': 'bg-yellow-100 text-yellow-800',
        'deposit': 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
}

function formatType(type) {
    const labels = {
        'credit': 'Crédit',
        'debit': 'Débit',
        'conversion': 'Conversion',
        'card_purchase': 'Achat carte',
        'card_reload': 'Rechargement',
        'deposit': 'Dépôt'
    };
    return labels[type] || type;
}

function updatePagination(pagination) {
    const container = document.getElementById('pagination');
    const totalPages = Math.ceil(pagination.total / pagination.perPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="flex space-x-2">';
    
    for (let i = 1; i <= totalPages; i++) {
        html += `
            <button 
                onclick="loadTransactions(${i})" 
                class="px-4 py-2 rounded-lg ${i === pagination.page ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}"
            >
                ${i}
            </button>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function applyFilters() {
    loadTransactions(1);
}

loadTransactions();
</script>

<?php include '../includes/footer.php'; ?>
