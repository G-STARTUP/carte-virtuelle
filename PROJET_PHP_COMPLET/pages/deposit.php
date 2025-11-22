<?php
$pageTitle = 'GWAP - Recharger';
include '../includes/header.php';
?>

<div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <a href="../dashboard.php" class="text-purple-600 hover:text-purple-700">
                    <i class="fas fa-arrow-left mr-2"></i>Retour
                </a>
                <h1 class="text-xl font-bold">Recharger mon compte</h1>
                <div></div>
            </div>
        </div>
    </nav>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid md:grid-cols-2 gap-8">
            <!-- Payment Form -->
            <div class="bg-white rounded-xl shadow-md p-6">
                <h2 class="text-2xl font-bold mb-6">Recharger par carte</h2>
                
                <form id="depositForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Montant</label>
                        <div class="relative">
                            <input 
                                type="number" 
                                name="amount" 
                                required 
                                min="10"
                                step="0.01"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 pl-12"
                                placeholder="100.00"
                            >
                            <span class="absolute left-4 top-3 text-gray-500 text-lg">$</span>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Devise du portefeuille</label>
                        <select name="currency" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="USD">USD - Dollar Américain</option>
                            <option value="NGN">NGN - Naira Nigérian</option>
                            <option value="XOF">XOF - Franc CFA</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Méthode de paiement</label>
                        <div class="space-y-3">
                            <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input type="radio" name="payment_method" value="card" checked class="mr-3">
                                <i class="fas fa-credit-card text-purple-600 mr-2"></i>
                                <span>Carte bancaire</span>
                            </label>
                            <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input type="radio" name="payment_method" value="mobile" class="mr-3">
                                <i class="fas fa-mobile-alt text-green-600 mr-2"></i>
                                <span>Mobile Money</span>
                            </label>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        class="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                        <i class="fas fa-lock mr-2"></i>Procéder au paiement
                    </button>
                </form>
            </div>

            <!-- Info Section -->
            <div>
                <div class="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-6 mb-6">
                    <h3 class="text-lg font-semibold mb-4 text-purple-800">
                        <i class="fas fa-info-circle mr-2"></i>Informations importantes
                    </h3>
                    <ul class="space-y-3 text-sm text-gray-700">
                        <li class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 mr-2 mt-1"></i>
                            <span>Rechargement instantané en moins de 5 minutes</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 mr-2 mt-1"></i>
                            <span>Paiement 100% sécurisé avec SSL</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 mr-2 mt-1"></i>
                            <span>Montant minimum: 10 USD / équivalent</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 mr-2 mt-1"></i>
                            <span>Frais de transaction: 2.5%</span>
                        </li>
                    </ul>
                </div>

                <!-- Recent Deposits -->
                <div class="bg-white rounded-xl shadow-md p-6">
                    <h3 class="text-lg font-semibold mb-4">Derniers rechargements</h3>
                    <div id="recentDeposits">
                        <p class="text-gray-600 text-sm text-center py-4">Chargement...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
if (!localStorage.getItem('token')) window.location.href = '../login.php';

// Load recent deposits
async function loadRecentDeposits() {
    try {
        const response = await apiRequest('/api/payment.php?action=history&limit=5', { method: 'GET' });
        const container = document.getElementById('recentDeposits');
        
        if (response.success && response.data && response.data.length > 0) {
            container.innerHTML = response.data.map(deposit => `
                <div class="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                        <p class="text-sm font-medium">${deposit.amount} ${deposit.currency}</p>
                        <p class="text-xs text-gray-500">${new Date(deposit.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span class="px-2 py-1 rounded text-xs ${deposit.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                        ${deposit.status}
                    </span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-gray-600 text-sm text-center py-4">Aucun rechargement</p>';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Handle form submission
document.getElementById('depositForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        amount: parseFloat(formData.get('amount')),
        currency: formData.get('currency'),
        payment_method: formData.get('payment_method')
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Traitement...';
    submitBtn.disabled = true;

    try {
        const response = await apiRequest('/api/payment.php?action=deposit', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.success) {
            showNotification('Rechargement initié avec succès !', 'success');
            
            // Redirect to payment gateway if URL provided
            if (response.data.payment_url) {
                setTimeout(() => window.location.href = response.data.payment_url, 1500);
            } else {
                setTimeout(() => window.location.href = '../dashboard.php', 1500);
            }
        } else {
            showNotification(response.message || 'Erreur lors du rechargement', 'error');
        }
    } catch (error) {
        showNotification('Erreur: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

loadRecentDeposits();
</script>

<?php include '../includes/footer.php'; ?>
