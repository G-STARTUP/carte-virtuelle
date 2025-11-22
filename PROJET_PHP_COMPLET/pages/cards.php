<?php
$pageTitle = 'GWAP - Mes Cartes';
include '../includes/header.php';
?>

<div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <a href="../dashboard.php" class="text-purple-600 hover:text-purple-700">
                    <i class="fas fa-arrow-left mr-2"></i>Retour
                </a>
                <h1 class="text-xl font-bold">Mes Cartes</h1>
                <div></div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Cartes Virtuelles</h2>
            <button onclick="showCreateCardModal()" class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-all">
                <i class="fas fa-plus mr-2"></i>Nouvelle Carte
            </button>
        </div>

        <div id="cardsGrid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-purple-600 mb-4"></i>
                <p class="text-gray-600">Chargement de vos cartes...</p>
            </div>
        </div>
    </div>
</div>

<script>
if (!localStorage.getItem('token')) window.location.href = '../login.php';

async function loadCards() {
    try {
        const response = await apiRequest('/api/cards.php?action=list', { method: 'GET' });
        const grid = document.getElementById('cardsGrid');
        
        if (response.success && response.data && response.data.length > 0) {
            grid.innerHTML = response.data.map(card => `
                <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white shadow-lg">
                    <div class="flex justify-between mb-4">
                        <span class="text-sm opacity-80">${card.brand || 'VISA'}</span>
                        <span class="px-2 py-1 rounded text-xs ${card.status === 'active' ? 'bg-green-500' : 'bg-red-500'}">${card.status}</span>
                    </div>
                    <p class="text-lg font-mono mb-4"> ${card.card_pan_masked?.slice(-4) || '****'}</p>
                    <div class="flex justify-between text-sm">
                        <span>${card.balance} ${card.currency}</span>
                        <span>Exp: ${card.expiration_date || 'N/A'}</span>
                    </div>
                </div>
            `).join('');
        } else {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-600">Aucune carte créée</div>';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function showCreateCardModal() {
    showNotification('Fonctionnalité en développement', 'info');
}

loadCards();
</script>

<?php include '../includes/footer.php'; ?>
