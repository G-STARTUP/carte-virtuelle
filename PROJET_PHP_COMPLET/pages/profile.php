<?php
$pageTitle = 'GWAP - Mon Profil';
include '../includes/header.php';
?>

<div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <a href="../dashboard.php" class="text-purple-600 hover:text-purple-700">
                    <i class="fas fa-arrow-left mr-2"></i>Retour
                </a>
                <h1 class="text-xl font-bold">Mon Profil</h1>
                <div></div>
            </div>
        </div>
    </nav>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid md:grid-cols-3 gap-6">
            <!-- Profile Sidebar -->
            <div class="bg-white rounded-xl shadow-md p-6 h-fit">
                <div class="text-center mb-6">
                    <div class="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                        <span id="userInitials">U</span>
                    </div>
                    <h2 id="profileName" class="text-xl font-bold mb-1">Chargement...</h2>
                    <p id="profileEmail" class="text-gray-600 text-sm">email@example.com</p>
                </div>

                <div class="space-y-3">
                    <div class="flex items-center justify-between py-2 border-b">
                        <span class="text-sm text-gray-600">Statut KYC</span>
                        <span id="kycStatus" class="px-2 py-1 rounded-full text-xs bg-gray-100">-</span>
                    </div>
                    <div class="flex items-center justify-between py-2 border-b">
                        <span class="text-sm text-gray-600">Membre depuis</span>
                        <span id="memberSince" class="text-sm font-medium">-</span>
                    </div>
                    <div class="flex items-center justify-between py-2">
                        <span class="text-sm text-gray-600">ID Utilisateur</span>
                        <span id="userId" class="text-sm font-mono">#-</span>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="md:col-span-2 space-y-6">
                <!-- Personal Information -->
                <div class="bg-white rounded-xl shadow-md p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-semibold">Informations personnelles</h3>
                        <button onclick="enableEdit()" id="editBtn" class="text-purple-600 hover:text-purple-700">
                            <i class="fas fa-edit mr-1"></i>Modifier
                        </button>
                    </div>

                    <form id="profileForm" class="space-y-4">
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                                <input 
                                    type="text" 
                                    name="first_name" 
                                    id="firstName"
                                    disabled
                                    class="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                                >
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                                <input 
                                    type="text" 
                                    name="last_name" 
                                    id="lastName"
                                    disabled
                                    class="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                                >
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                            <input 
                                type="tel" 
                                name="phone" 
                                id="phone"
                                disabled
                                class="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                            >
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                            <textarea 
                                name="address" 
                                id="address"
                                disabled
                                rows="3"
                                class="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                            ></textarea>
                        </div>

                        <div id="saveSection" class="hidden">
                            <button 
                                type="submit" 
                                class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 mr-2"
                            >
                                <i class="fas fa-save mr-2"></i>Enregistrer
                            </button>
                            <button 
                                type="button"
                                onclick="cancelEdit()" 
                                class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Change Password -->
                <div class="bg-white rounded-xl shadow-md p-6">
                    <h3 class="text-lg font-semibold mb-6">Changer le mot de passe</h3>
                    
                    <form id="passwordForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                            <input 
                                type="password" 
                                name="current_password" 
                                required
                                class="w-full px-4 py-2 border rounded-lg"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                            <input 
                                type="password" 
                                name="new_password" 
                                required
                                minlength="8"
                                class="w-full px-4 py-2 border rounded-lg"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                            <input 
                                type="password" 
                                name="confirm_password" 
                                required
                                minlength="8"
                                class="w-full px-4 py-2 border rounded-lg"
                            >
                        </div>
                        <button 
                            type="submit" 
                            class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                        >
                            <i class="fas fa-key mr-2"></i>Changer le mot de passe
                        </button>
                    </form>
                </div>

                <!-- KYC Section -->
                <div class="bg-white rounded-xl shadow-md p-6">
                    <h3 class="text-lg font-semibold mb-4">Vérification d'identité (KYC)</h3>
                    <div id="kycSection">
                        <p class="text-gray-600 mb-4">Vérifiez votre identité pour débloquer toutes les fonctionnalités.</p>
                        <button onclick="showNotification('Fonctionnalité en développement', 'info')" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                            <i class="fas fa-id-card mr-2"></i>Commencer la vérification
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
if (!localStorage.getItem('token')) window.location.href = '../login.php';

let userDataOriginal = {};

async function loadProfile() {
    try {
        const response = await apiRequest('/api/user.php?action=profile', { method: 'GET' });
        
        if (response.success && response.data) {
            userDataOriginal = response.data;
            displayProfile(response.data);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Erreur de chargement du profil', 'error');
    }
}

function displayProfile(data) {
    document.getElementById('profileName').textContent = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Utilisateur';
    document.getElementById('profileEmail').textContent = data.email || '';
    document.getElementById('userId').textContent = '#' + (data.id || '-');
    document.getElementById('memberSince').textContent = data.created_at ? new Date(data.created_at).toLocaleDateString('fr-FR') : '-';
    
    // Set initials
    const initials = ((data.first_name?.[0] || '') + (data.last_name?.[0] || '')).toUpperCase() || 'U';
    document.getElementById('userInitials').textContent = initials;
    
    // KYC Status
    const kycEl = document.getElementById('kycStatus');
    const kycColors = {
        'verified': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'not_verified': 'bg-gray-100 text-gray-800',
        'rejected': 'bg-red-100 text-red-800'
    };
    kycEl.className = 'px-2 py-1 rounded-full text-xs ' + (kycColors[data.kyc_status] || kycColors['not_verified']);
    kycEl.textContent = data.kyc_status || 'not_verified';
    
    // Fill form
    document.getElementById('firstName').value = data.first_name || '';
    document.getElementById('lastName').value = data.last_name || '';
    document.getElementById('phone').value = data.phone || '';
    document.getElementById('address').value = data.address || '';
}

function enableEdit() {
    const inputs = document.querySelectorAll('#profileForm input, #profileForm textarea');
    inputs.forEach(input => input.disabled = false);
    document.getElementById('saveSection').classList.remove('hidden');
    document.getElementById('editBtn').classList.add('hidden');
}

function cancelEdit() {
    displayProfile(userDataOriginal);
    const inputs = document.querySelectorAll('#profileForm input, #profileForm textarea');
    inputs.forEach(input => input.disabled = true);
    document.getElementById('saveSection').classList.add('hidden');
    document.getElementById('editBtn').classList.remove('hidden');
}

// Save profile
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        phone: formData.get('phone'),
        address: formData.get('address')
    };

    try {
        const response = await apiRequest('/api/user.php?action=update', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.success) {
            showNotification('Profil mis à jour avec succès', 'success');
            userDataOriginal = {...userDataOriginal, ...data};
            cancelEdit();
        } else {
            showNotification(response.message || 'Erreur de mise à jour', 'error');
        }
    } catch (error) {
        showNotification('Erreur: ' + error.message, 'error');
    }
});

// Change password
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    if (formData.get('new_password') !== formData.get('confirm_password')) {
        showNotification('Les mots de passe ne correspondent pas', 'error');
        return;
    }

    const data = {
        current_password: formData.get('current_password'),
        new_password: formData.get('new_password')
    };

    try {
        const response = await apiRequest('/api/user.php?action=change_password', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.success) {
            showNotification('Mot de passe modifié avec succès', 'success');
            e.target.reset();
        } else {
            showNotification(response.message || 'Erreur de modification', 'error');
        }
    } catch (error) {
        showNotification('Erreur: ' + error.message, 'error');
    }
});

loadProfile();
</script>

<?php include '../includes/footer.php'; ?>
