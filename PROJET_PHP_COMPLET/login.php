<?php
$pageTitle = 'GWAP - Connexion';
include 'includes/header.php';
?>

<div class="min-h-screen flex items-center justify-center px-4 gradient-bg">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">💳 GWAP</h1>
            <p class="text-gray-600">Connectez-vous à votre compte</p>
        </div>

        <form id="loginForm" class="space-y-6">
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
                    <i class="fas fa-lock mr-2"></i>Mot de passe
                </label>
                <input 
                    type="password" 
                    name="password" 
                    required 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                >
            </div>

            <button 
                type="submit" 
                class="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
                <i class="fas fa-sign-in-alt mr-2"></i>Se Connecter
            </button>
        </form>

        <div class="mt-6 text-center">
            <p class="text-gray-600">
                Pas encore de compte ? 
                <a href="register.php" class="text-purple-600 hover:text-purple-700 font-semibold">
                    S'inscrire gratuitement
                </a>
            </p>
        </div>
    </div>
</div>

<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Connexion...';
    submitBtn.disabled = true;

    try {
        const response = await apiRequest('/api/auth.php?action=login', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.success) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            showNotification('Connexion réussie ! Redirection...', 'success');
            setTimeout(() => window.location.href = 'dashboard.php', 1000);
        } else {
            showNotification(response.message || 'Erreur de connexion', 'error');
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
