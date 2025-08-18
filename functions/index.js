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
        username: user.email.split('@')[0], // Um nome de usuário padrão
        role: 'user', // Define a função padrão para novos usuários como 'user'
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp() // Adiciona um carimbo de data/hora
    });
});