document.addEventListener('DOMContentLoaded', () => {

    const showLoading = () => document.getElementById('loading-overlay').style.display = 'flex';
    const hideLoading = () => document.getElementById('loading-overlay').style.display = 'none';

    // Configuração Firebase
   const firebaseConfig = {
  apiKey: "AIzaSyAnYj37TDwV0kkB9yBeJguZCEqHvWV7vAY",
  authDomain: "beneficios-eventuais-suas.firebaseapp.com",
  projectId: "beneficios-eventuais-suas",
  storageBucket: "beneficios-eventuais-suas.firebasestorage.app",
  messagingSenderId: "665210304564",
  appId: "1:665210304564:web:cf233fd0e56bbfe3d5b261"
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
