    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        // Configuration de l'API
        const API_URL = '/api';
        
        // Fonction pour obtenir le token
        function getToken() {
            return localStorage.getItem('gwap_token');
        }
        
        // Fonction pour faire des requêtes API
        async function apiRequest(endpoint, options = {}) {
            const token = getToken();
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            try {
                const response = await fetch(`${API_URL}${endpoint}`, {
                    ...options,
                    headers
                });
                
                const data = await response.json();
                return { success: response.ok, data, status: response.status };
            } catch (error) {
                console.error('API Error:', error);
                return { success: false, error: error.message };
            }
        }
        
        // Fonction pour afficher les notifications
        function showNotification(message, type = 'success') {
            const colors = {
                success: 'bg-green-500',
                error: 'bg-red-500',
                info: 'bg-blue-500',
                warning: 'bg-yellow-500'
            };
            
            const notification = $(`
                <div class="fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                        <span>${message}</span>
                    </div>
                </div>
            `);
            
            $('body').append(notification);
            
            setTimeout(() => {
                notification.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 3000);
        }
    </script>
</body>
</html>
