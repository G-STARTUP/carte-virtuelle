<?php
$pageTitle = 'GWAP - Accueil';
include 'includes/header.php';
?>

<!-- Hero Section -->
<div class="gradient-bg min-h-screen flex items-center justify-center px-4">
    <div class="max-w-6xl mx-auto text-center text-white">
        <h1 class="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
             Cartes Virtuelles<br>Multi-Devises
        </h1>
        <p class="text-xl md:text-2xl mb-8 opacity-90">
            Créez, gérez et rechargez vos cartes virtuelles en toute sécurité
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="register.php" class="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all">
                <i class="fas fa-rocket mr-2"></i>Commencer Gratuitement
            </a>
            <a href="login.php" class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-purple-600 transition-all">
                <i class="fas fa-sign-in-alt mr-2"></i>Se Connecter
            </a>
        </div>
    </div>
</div>

<!-- Features Section -->
<div class="py-20 px-4 bg-white">
    <div class="max-w-6xl mx-auto">
        <h2 class="text-4xl font-bold text-center mb-16 text-gray-800">Pourquoi Choisir GWAP ?</h2>
        <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center p-6 card-hover transition-all bg-white rounded-xl shadow-md">
                <div class="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-shield-alt text-3xl text-purple-600"></i>
                </div>
                <h3 class="text-xl font-semibold mb-3">100% Sécurisé</h3>
                <p class="text-gray-600">Vos données sont protégées par les meilleures technologies de cryptage</p>
            </div>
            <div class="text-center p-6 card-hover transition-all bg-white rounded-xl shadow-md">
                <div class="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-globe text-3xl text-blue-600"></i>
                </div>
                <h3 class="text-xl font-semibold mb-3">Multi-Devises</h3>
                <p class="text-gray-600">Support de USD, NGN, XOF et conversion instantanée</p>
            </div>
            <div class="text-center p-6 card-hover transition-all bg-white rounded-xl shadow-md">
                <div class="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-bolt text-3xl text-green-600"></i>
                </div>
                <h3 class="text-xl font-semibold mb-3">Instantané</h3>
                <p class="text-gray-600">Créez et rechargez vos cartes en quelques secondes</p>
            </div>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
