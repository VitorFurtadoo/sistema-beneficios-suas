const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Esta função é acionada sempre que um novo usuário é criado no Firebase Auth
exports.createUserDocument = functions.auth.user().onCreate((user) => {
    const firestore = admin.firestore();
    const newUserRef = firestore.collection('users').doc(user.uid);

    // Cria o documento do usuário no Firestore com os dados iniciais
    return newUserRef.set({
        email: user.email,
        role: 'user', // A função padrão é 'user'
        active: true,
        username: user.email.split('@')[0], // Define um nome de usuário padrão
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
});