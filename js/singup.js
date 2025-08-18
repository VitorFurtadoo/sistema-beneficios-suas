/* js/signup.js - Lógica de Cadastro */

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

const auth = firebase.auth();
const db = firebase.firestore();

const showLoading = () => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';
};

const hideLoading = () => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
};

const showMessage = (message, isError = true) => {
    const messageEl = document.getElementById('error-message');
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    messageEl.style.color = isError ? 'red' : 'green';
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        if (password !== confirmPassword) {
            showMessage('As senhas não coincidem.');
            hideLoading();
            return;
        }

        try {
            await auth.createUserWithEmailAndPassword(email, password);
            showMessage('Cadastro realizado com sucesso! Você será redirecionado para o login.', false);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } catch (error) {
            console.error("Erro no cadastro:", error);
            let errorMessage = "Ocorreu um erro no cadastro.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Este e-mail já está em uso.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "O e-mail é inválido.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "A senha deve ter no mínimo 6 caracteres.";
            }
            showMessage(errorMessage);
        } finally {
            hideLoading();
        }
    });
});