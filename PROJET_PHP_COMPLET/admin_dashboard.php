<?php
$pageTitle = 'GWAP - Administration';
include 'includes/header.php';
?>

<div class="min-h-screen bg-gray-50">
    <nav class="bg-gradient-to-r from-red-600 to-purple-600 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <h1 class="text-2xl font-bold text-white"> GWAP Admin</h1>
                <div class="flex items-center space-x-4 text-white">
                    <span id="adminName" class="font-medium"></span>
                    <button onclick="logout()" class="hover:text-red-200">
                        <i class="fas fa-sign-out-alt mr-1"></i>Déconnexion
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Stats Overview -->
        <div class="grid md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-md">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Utilisateurs</p>
                        <p id="totalUsers" class="text-3xl font-bold text-purple-600">0</p>
                    </div>
                    <i class="fas fa-users text-4xl text-purple-200"></i>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-md">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Cartes Actives</p>
                        <p id="totalCards" class="text-3xl font-bold text-blue-600">0</p>
                    </div>
                    <i class="fas fa-credit-card text-4xl text-blue-200"></i>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-md">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Volume Total</p>
                        <p id="totalVolume" class="text-3xl font-bold text-green-600">$0</p>
                    </div>
                    <i class="fas fa-dollar-sign text-4xl text-green-200"></i>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-md">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">KYC En attente</p>
                        <p id="pendingKyc" class="text-3xl font-bold text-orange-600">0</p>
                    </div>
                    <i class="fas fa-clock text-4xl text-orange-200"></i>
                </div>
            </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="bg-white rounded-xl shadow-md mb-6">
            <div class="border-b">
                <nav class="flex space-x-8 px-6" aria-label="Tabs">
                    <button onclick="switchTab('users')" class="tab-btn border-b-2 border-purple-600 py-4 px-1 text-purple-600 font-medium">
                        <i class="fas fa-users mr-2"></i>Utilisateurs
                    </button>
                    <button onclick="switchTab('cards')" class="tab-btn py-4 px-1 text-gray-500 hover:text-gray-700">
                        <i class="fas fa-credit-card mr-2"></i>Cartes
                    </button>
                    <button onclick="switchTab('transactions')" class="tab-btn py-4 px-1 text-gray-500 hover:text-gray-700">
                        <i class="fas fa-exchange-alt mr-2"></i>Transactions
                    </button>
                    <button onclick="switchTab('kyc')" class="tab-btn py-4 px-1 text-gray-500 hover:text-gray-700">
                        <i class="fas fa-id-card mr-2"></i>KYC
                    </button>
                </nav>
            </div>

            <!-- Tab Content -->
            <div class="p-6">
                <!-- Users Tab -->
                <div id="usersTab" class="tab-content">
                    <div class="flex justify-between mb-4">
                        <h3 class="text-xl font-semibold">Liste des utilisateurs</h3>
                        <input type="text" placeholder="Rechercher..." class="px-4 py-2 border rounded-lg" onkeyup="filterUsers(this.value)">
                    </div>
                    <div id="usersList" class="overflow-x-auto">
                        <p class="text-center py-8 text-gray-600">Chargement...</p>
                    </div>
                </div>

                <!-- Cards Tab -->
                <div id="cardsTab" class="tab-content hidden">
                    <h3 class="text-xl font-semibold mb-4">Toutes les cartes</h3>
                    <div id="cardsList">
                        <p class="text-center py-8 text-gray-600">Chargement...</p>
                    </div>
                </div>

                <!-- Transactions Tab -->
                <div id="transactionsTab" class="tab-content hidden">
                    <h3 class="text-xl font-semibold mb-4">Historique des transactions</h3>
                    <div id="transactionsList">
                        <p class="text-center py-8 text-gray-600">Chargement...</p>
                    </div>
                </div>

                <!-- KYC Tab -->
                <div id="kycTab" class="tab-content hidden">
                    <h3 class="text-xl font-semibold mb-4">Demandes KYC</h3>
                    <div id="kycList">
                        <p class="text-center py-8 text-gray-600">Chargement...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token || user.role !== 'admin') {
    window.location.href = 'dashboard.php';
}

document.getElementById('adminName').textContent = user.name;

// Switch tabs
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('border-purple-600', 'text-purple-600');
        el.classList.add('text-gray-500');
    });
    
    document.getElementById(tab + 'Tab').classList.remove('hidden');
    event.target.closest('button').classList.add('border-purple-600', 'text-purple-600');
    event.target.closest('button').classList.remove('text-gray-500');
}

// Load stats
async function loadStats() {
    try {
        const response = await apiRequest('/api/admin.php?action=stats', { method: 'GET' });
        if (response.success) {
            document.getElementById('totalUsers').textContent = response.data.total_users || 0;
            document.getElementById('totalCards').textContent = response.data.total_cards || 0;
            document.getElementById('totalVolume').textContent = '$' + (response.data.total_volume || 0).toLocaleString();
            document.getElementById('pendingKyc').textContent = response.data.pending_kyc || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load users
async function loadUsers() {
    try {
        const response = await apiRequest('/api/admin.php?action=users', { method: 'GET' });
        if (response.success && response.data) {
            const usersList = document.getElementById('usersList');
            usersList.innerHTML = `
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${response.data.map(u => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-4 py-3 text-sm">#${u.id}</td>
                                <td class="px-4 py-3 text-sm font-medium">${u.first_name || ''} ${u.last_name || ''}</td>
                                <td class="px-4 py-3 text-sm">${u.email}</td>
                                <td class="px-4 py-3 text-sm">
                                    <span class="px-2 py-1 rounded-full text-xs ${getKycColor(u.kyc_status)}">
                                        ${u.kyc_status}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-sm">${new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                                <td class="px-4 py-3 text-sm">
                                    <button onclick="viewUser(${u.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button onclick="blockUser(${u.id})" class="text-red-600 hover:text-red-800">
                                        <i class="fas fa-ban"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function getKycColor(status) {
    const colors = {
        'verified': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'not_verified': 'bg-gray-100 text-gray-800',
        'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function viewUser(id) {
    window.location.href = `pages/admin_user_detail.php?id=${id}`;
}

function blockUser(id) {
    if (confirm('Bloquer cet utilisateur ?')) {
        showNotification('Fonctionnalité en développement', 'info');
    }
}

function filterUsers(search) {
    // TODO: Implement search filter
}

function logout() {
    if (confirm('Déconnexion ?')) {
        localStorage.clear();
        window.location.href = 'login.php';
    }
}

// Load data on page load
loadStats();
loadUsers();
</script>

<?php include 'includes/footer.php'; ?>
