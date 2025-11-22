<?php
$pageTitle = 'GWAP - Inscription';
include 'includes/header.php';
?>

<div class="min-h-screen flex items-center justify-center px-4 gradient-bg py-12">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">💳 GWAP</h1>
            <p class="text-gray-600">Créez votre compte gratuitement</p>
        </div>

        <form id="registerForm" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-user mr-2"></i>Nom complet
                </label>
                <input 
                    type="text" 
                    name="name" 
                    required 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Jean Dupont"
                >
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-envelope mr-2"></i>Email
                </label>
                <input 
                    type="email" 
                    name="email" 
                    required 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="votre@email.com"
                >
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-phone mr-2"></i>Téléphone
                </label>
                <input 
                    type="tel" 
                    name="phone" 
                    required 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="+221 XX XXX XX XX"
                >
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-lock mr-2"></i>Mot de passe
                </label>
                <input 
                    type="password" 
                    name="password" 
                    required 
                    minlength="8"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Min. 8 caractères"
                >
            </div>

            <button 
                type="submit" 
                class="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all mt-6"
            >
                <i class="fas fa-rocket mr-2"></i>Créer mon compte
            </button>
        </form>

        <div class="mt-6 text-center">
            <p class="text-gray-600">
                Déjà un compte ? 
                <a href="login.php" class="text-purple-600 hover:text-purple-700 font-semibold">
                    Se connecter
                </a>
            </p>
        </div>
    </div>
</div>

<script>
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password')
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Création...';
    submitBtn.disabled = true;

    try {
        const response = await apiRequest('/api/auth.php?action=register', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.success) {
            showNotification('Compte créé avec succès !', 'success');
            setTimeout(() => window.location.href = 'login.php', 1500);
        } else {
            showNotification(response.message || 'Erreur lors de l\'inscription', 'error');
        }
    } catch (error) {
        showNotification('Erreur: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});
</script>

<?php include 'includes/footer.php'; ?>
