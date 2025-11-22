<?php
$pageTitle = 'GWAP - Tableau de bord';
include 'includes/header.php';
?>

<div class="min-h-screen bg-gray-50">
    <!-- Navigation Top Bar -->
    <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <h1 class="text-2xl font-bold text-purple-600">💳 GWAP</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <span id="userName" class="text-gray-700 font-medium"></span>
                    <button onclick="logout()" class="text-red-600 hover:text-red-700">
                        <i class="fas fa-sign-out-alt mr-1"></i>Déconnexion
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Welcome Section -->
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-800 mb-2">Tableau de bord</h2>
            <p class="text-gray-600">Bienvenue sur votre espace personnel</p>
        </div>

        <!-- Wallets Grid -->
        <div class="grid md:grid-cols-3 gap-6 mb-8" id="walletsGrid">
            <!-- Wallets will be loaded here -->
            <div class="col-span-3 text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-purple-600 mb-4"></i>
                <p class="text-gray-600">Chargement de vos portefeuilles...</p>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid md:grid-cols-3 gap-6 mb-8">
            <a href="pages/cards.php" class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all card-hover">
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-credit-card text-purple-600 text-xl"></i>
                    </div>
                    <h3 class="ml-4 text-xl font-semibold">Mes Cartes</h3>
                </div>
                <p class="text-gray-600">Créer et gérer vos cartes virtuelles</p>
            </a>

            <a href="pages/deposit.php" class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all card-hover">
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-plus-circle text-green-600 text-xl"></i>
                    </div>
                    <h3 class="ml-4 text-xl font-semibold">Recharger</h3>
                </div>
                <p class="text-gray-600">Alimenter vos portefeuilles</p>
            </a>

            <a href="pages/transactions.php" class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all card-hover">
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-history text-blue-600 text-xl"></i>
                    </div>
                    <h3 class="ml-4 text-xl font-semibold">Historique</h3>
                </div>
                <p class="text-gray-600">Consulter vos transactions</p>
            </a>
        </div>

        <!-- Recent Transactions -->
        <div class="bg-white rounded-xl shadow-md p-6">
            <h3 class="text-xl font-semibold mb-4">Transactions récentes</h3>
            <div id="recentTransactions">
                <p class="text-gray-600 text-center py-8">Chargement...</p>
            </div>
        </div>
    </div>
</div>

<script>
// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'login.php';
}

// Redirect admin to admin dashboard
if (user.role === 'admin') {
    window.location.href = 'admin_dashboard.php';
}

// Display user name
document.getElementById('userName').textContent = user.name || 'Utilisateur';

// Load wallets
async function loadWallets() {
    try {
        const response = await apiRequest('/api/wallets.php?action=list', {
            method: 'GET'
        });

        if (response.success && response.data) {
            const walletsGrid = document.getElementById('walletsGrid');
            walletsGrid.innerHTML = response.data.map(wallet => `
                <div class="bg-gradient-to-br from-${getColorForCurrency(wallet.currency)}-500 to-${getColorForCurrency(wallet.currency)}-600 rounded-xl shadow-lg p-6 text-white">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-sm opacity-80">Portefeuille ${wallet.currency}</p>
                            <p class="text-3xl font-bold mt-2">${formatAmount(wallet.balance, wallet.currency)}</p>
                        </div>
                        <i class="fas fa-wallet text-2xl opacity-80"></i>
                    </div>
                    <div class="text-sm opacity-80">
                        ${wallet.status === 'active' ? '✓ Actif' : '✗ Inactif'}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading wallets:', error);
        document.getElementById('walletsGrid').innerHTML = `
            <div class="col-span-3 text-center py-8 text-red-600">
                <i class="fas fa-exclamation-triangle text-3xl mb-4"></i>
                <p>Erreur lors du chargement des portefeuilles</p>
            </div>
        `;
    }
}

// Load recent transactions
async function loadTransactions() {
    try {
        const response = await apiRequest('/api/wallets.php?action=transactions&limit=5', {
            method: 'GET'
        });

        if (response.success && response.data && response.data.length > 0) {
            document.getElementById('recentTransactions').innerHTML = `
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${response.data.map(tx => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3 text-sm">${new Date(tx.created_at).toLocaleDateString('fr-FR')}</td>
                                    <td class="px-4 py-3 text-sm">${tx.type}</td>
                                    <td class="px-4 py-3 text-sm font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}">
                                        ${tx.amount > 0 ? '+' : ''}${formatAmount(tx.amount, tx.currency)}
                                    </td>
                                    <td class="px-4 py-3 text-sm">
                                        <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(tx.status)}">
                                            ${tx.status}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            document.getElementById('recentTransactions').innerHTML = `
                <p class="text-gray-600 text-center py-8">Aucune transaction récente</p>
            `;
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Helper functions
function formatAmount(amount, currency) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function getColorForCurrency(currency) {
    const colors = { USD: 'green', NGN: 'blue', XOF: 'purple' };
    return colors[currency] || 'gray';
}

function getStatusColor(status) {
    const colors = {
        'completed': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.php';
    }
}

// Load data on page load
loadWallets();
loadTransactions();
</script>

<?php include 'includes/footer.php'; ?>
