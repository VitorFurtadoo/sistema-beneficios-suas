document.addEventListener('DOMContentLoaded', () => {

    const showLoading = () => document.getElementById('loading-overlay').style.display = 'flex';
    const hideLoading = () => document.getElementById('loading-overlay').style.display = 'none';

    // Configuração Firebase
    const firebaseConfig = {
        apiKey: "SUA_API_KEY",
        authDomain: "SEU_AUTH_DOMAIN",
        projectId: "SEU_PROJECT_ID",
        storageBucket: "SEU_BUCKET",
        messagingSenderId: "SEU_SENDER_ID",
        appId: "SEU_APP_ID"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();
    const usersCollection = db.collection('users');

    // Função de login
    const handleLogin = async () => {
        showLoading();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!username || !password) {
            alert("Preencha login e senha.");
            hideLoading();
            return;
        }

        try {
            const query = await usersCollection
                .where('username', '==', username)
                .where('password', '==', password)
                .get();

            if (!query.empty) {
                const user = { id: query.docs[0].id, ...query.docs[0].data() };
                if (user.active) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    window.location.href = 'index.html';
                } else {
                    alert('Conta desativada.');
                }
            } else {
                alert('Login ou senha incorretos.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao fazer login. Verifique o console.');
        } finally {
            hideLoading();
        }
    };

    const showContactInfo = () => {
        alert('Para solicitar acesso, entre em contato com o administrador.');
    };

    // Adiciona eventos aos botões
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('signup-btn').addEventListener('click', showContactInfo);
});
