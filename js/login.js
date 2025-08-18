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

const auth = firebase.auth();
const db = firebase.firestore();
const usersCollection = db.collection('users');

const showLoading = () => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';
};

const hideLoading = () => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Busca o documento do usuário no Firestore com o UID do Firebase Auth
            const userDoc = await usersCollection.doc(user.uid).get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.active) {
                    localStorage.setItem('currentUser', JSON.stringify({ id: user.uid, ...userData }));
                    window.location.href = 'index.html';
                } else {
                    alert('Sua conta está desativada.');
                    await auth.signOut(); // Desloga o usuário
                }
            } else {
                alert('Documento do usuário não encontrado. Contate o administrador.');
                await auth.signOut();
            }
        } catch (error) {
            console.error("Erro no login:", error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                alert("E-mail ou senha incorretos.");
            } else {
                alert("Ocorreu um erro. Verifique o console.");
            }
        } finally {
            hideLoading();
        }
    });
});