/* js/login.js - Lógica de Login */

const firebaseConfig = {
    apiKey: "AIzaSyAnYj37TDwV0kkB9yBeJguZCEqHvWV7vAY",
    authDomain: "beneficios-eventuais-suas.firebaseapp.com",
    projectId: "beneficios-eventuais-suas",
    storageBucket: "beneficios-eventuais-suas.appspot.com",
    messagingSenderId: "665210304564",
    appId: "1:665210304564:web:cf233fd0e56bbfe3d5b261"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const showLoading = () => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
};

const hideLoading = () => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-btn').addEventListener('click', async () => {
        showLoading();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        // **ATENÇÃO:** Esta lógica de login é INSEGURA. 
        // Você deve migrar para o Firebase Authentication para gerenciar usuários e senhas de forma segura.
        // A lógica abaixo é a sua implementação original, que tem vulnerabilidades.
        const db = firebase.firestore();
        const usersCollection = db.collection('users');

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
            console.error("Erro no login:", error);
            alert("Falha no login. Verifique o console.");
        } finally {
            hideLoading();
        }
    });

    document.getElementById('signup-btn').addEventListener('click', () => {
        alert('Para solicitar acesso, entre em contato com o administrador.');
    });
});