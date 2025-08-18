/* js/login.js - Lógica de Login */

// CONFIGURAÇÃO DO FIREBASE (a mesma que você já tem)
const firebaseConfig = {
    apiKey: "AIzaSyAnYj37TDwV0kkB9yBeJguZCEqHvWV7vAY",
    authDomain: "beneficios-eventuais-suas.firebaseapp.com",
    projectId: "beneficios-eventuais-suas",
    storageBucket: "beneficios-eventuais-suas.appspot.com",
    messagingSenderId: "665210304564",
    appId: "1:665210304564:web:cf233fd0e56bbfe3d5b261"
};

// Inicialização do Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Funções de loading
const showLoading = () => document.getElementById('loading-overlay').style.display = 'flex';
const hideLoading = () => document.getElementById('loading-overlay').style.display = 'none';

// Lógica de Login
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-btn').addEventListener('click', async () => {
        showLoading();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        // IMPORTANTE: Esta é uma referência de como o código *deveria* ser.
        // Você precisa migrar para o Firebase Authentication. A lógica abaixo
        // é APENAS um exemplo, e não é segura.
        console.log("Atenção: A lógica de login precisa ser migrada para o Firebase Authentication para ser segura.");
        // A lógica de login segura com o Firebase Auth seria:
        // try {
        //     await firebase.auth().signInWithEmailAndPassword(email, password);
        //     window.location.href = 'index.html';
        // } catch (error) {
        //     // Tratar erro
        // }

        // A lógica do seu código original (insegura) está aqui:
        const db = firebase.firestore();
        const usersCollection = db.collection('users');

        try {
            const query = await usersCollection
                .where('username', '==', username)
                .where('password', '==', password) // ESTA LINHA É INSEGURA
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