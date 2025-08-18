/* js/script.js - Lógica da Aplicação Principal (Corrigido) */
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado. Iniciando script.js...");
    const { jsPDF } = window.jspdf;

    const firebaseConfig = {
        apiKey: "AIzaSyAnYj37TDwV0kkB9yBeJguZCEqHvWV7vAY",
        authDomain: "beneficios-eventuais-suas.firebaseapp.com",
        projectId: "beneficios-eventuais-suas",
        storageBucket: "beneficios-eventuais-suas.appspot.com",
        messagingSenderId: "665210304564",
        appId: "1:665210304564:web:cf233fd0e56bbfe3d5b261"
    };

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

    const auth = firebase.auth();
    const db = firebase.firestore();
    const beneficiosCollection = db.collection('beneficios');
    const usersCollection = db.collection('users');

    const showLoading = () => {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'flex';
    };
    const hideLoading = () => {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'none';
    };

    const checkLoginStatus = (user) => {
        if (!user) {
            console.log("Usuário não logado. Redirecionando para login.html.");
            window.location.href = 'login.html';
            return false;
        }

        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
            // Se o Firebase Auth tem um usuário, mas o localStorage não,
            // pode ser um problema. Redirecionamos para garantir o estado correto.
            auth.signOut();
            window.location.href = 'login.html';
            return false;
        }

        const currentUser = JSON.parse(userStr);
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) welcomeMessage.textContent = `Bem-vindo(a), ${currentUser.username}!`;

        const adminButton = document.getElementById('adminMenuButton');
        if (adminButton && currentUser.role === 'admin') adminButton.style.display = 'flex';
        console.log("Usuário logado. Retornando true.");
        return true;
    };

    const handleLogout = () => {
        auth.signOut().then(() => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    };

    const showSection = (sectionId) => {
        console.log(`Tentando mostrar a seção: ${sectionId}`);
        document.querySelectorAll('.section, .main-menu').forEach(sec => sec.classList.remove('active'));
        
        if (sectionId === 'mainMenu') {
            document.getElementById('mainMenu').classList.add('active');
        } else {
            const target = document.getElementById(sectionId);
            if (target) {
                target.classList.add('active');
                if (sectionId === 'consultaSection') fetchBeneficios();
                if (sectionId === 'adminSection') renderUsersTable();
            } else {
                console.error(`Erro: Elemento com ID '${sectionId}' não encontrado.`);
            }
        }
    };

    const fetchBeneficios = async () => {
        showLoading();
        try {
            const snapshot = await beneficiosCollection.orderBy('data', 'desc').get();
            const allBeneficios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderTable(allBeneficios);
        } catch (error) {
            console.error("Erro ao buscar benefícios:", error);
            alert("Não foi possível carregar os benefícios.");
        } finally { hideLoading(); }
    };

    const renderTable = (data) => {
        const tableBody = document.querySelector('#beneficiosTable tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        data.forEach(b => {
            const row = tableBody.insertRow();
            row.dataset.id = b.id;
            const dataObj = new Date(b.data + 'T03:00:00');
            const dataFormatada = !isNaN(dataObj.getTime()) ? dataObj.toLocaleDateString('pt-BR') : '';
            const valorFormatado = typeof b.valor === 'number' ? `R$ ${b.valor.toFixed(2).replace('.', ',')}` : b.valor || '';
            row.innerHTML = `
                <td>${b.beneficiario || ''}</td>
                <td>${b.cpf || ''}</td>
                <td>${dataFormatada}</td>
                <td>${valorFormatado}</td>
                <td>${b.beneficio || ''}</td>
                <td>${b.quantidade || ''}</td>
                <td>${b.equipamento || ''}</td>
                <td>${b.responsavel || ''}</td>
                <td>${b.status || ''}</td>
                <td>${b.observacoes || ''}</td>
                <td>${b.lastUpdated || ''}</td>
                <td>
                    <button class="edit-btn" data-id="${b.id}">Editar</button>
                    <button class="delete-btn" data-id="${b.id}">Excluir</button>
                </td>
            `;
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        showLoading();
        try {
            const formData = Object.fromEntries(new FormData(e.target).entries());
            formData.lastUpdated = new Date().toLocaleString('pt-BR');
            await beneficiosCollection.add(formData);
            alert('Benefício cadastrado!');
            e.target.reset();
            showSection('consultaSection');
        } catch(error) {
            console.error("Erro ao cadastrar:", error);
            alert("Falha ao cadastrar benefício.");
        } finally { hideLoading(); }
    };

    const handleEditFormSubmit = async (e) => {
        e.preventDefault();
        showLoading();
        try {
            const docId = document.getElementById('editIndex').value;
            const updated = Object.fromEntries(new FormData(e.target).entries());
            updated.lastUpdated = new Date().toLocaleString('pt-BR');
            await beneficiosCollection.doc(docId).update(updated);
            alert('Registro atualizado!');
            showSection('consultaSection');
        } catch(error) {
            console.error("Erro ao atualizar:", error);
            alert("Falha ao atualizar registro.");
        } finally { hideLoading(); }
    };

    const renderUsersTable = async () => {
        showLoading();
        try {
            const snapshot = await usersCollection.get();
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const tbody = document.querySelector('#usersTable tbody');
            if(!tbody) return;
            tbody.innerHTML = '';
            users.forEach(u => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${u.username}</td>
                    <td>${u.role}</td>
                    <td>${u.active ? 'Ativo' : 'Inativo'}</td>
                    <td><button class="delete-user-btn" data-id="${u.id}">Excluir</button></td>
                `;
            });
        } catch(error) {
            console.error("Erro ao carregar usuários:", error);
        } finally { hideLoading(); }
    };

    document.getElementById('beneficiosTable')?.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('edit-btn')) {
            showLoading();
            try {
                const doc = await beneficiosCollection.doc(id).get();
                if (!doc.exists) throw new Error("Documento não encontrado");
                const data = doc.data();
                document.getElementById('editIndex').value = id;
                Object.keys(data).forEach(key => {
                    const el = document.getElementById(`edit-${key}`);
                    if(el) el.value = data[key];
                });
                showSection('editSection');
            } catch (error) {
                console.error("Erro ao abrir formulário:", error);
                alert("Não foi possível abrir o formulário.");
            } finally { hideLoading(); }
        }
    });

    document.getElementById('usersTable')?.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('delete-user-btn')) {
            if (!confirm("Deseja realmente excluir?")) return;
            try {
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                if (currentUser.role !== 'admin') {
                    alert('Você não tem permissão para excluir usuários.');
                    return;
                }
                await usersCollection.doc(id).delete();
                alert("Usuário excluído!");
                renderUsersTable();
            } catch(error) {
                console.error(error);
                alert("Erro ao excluir usuário.");
            }
        }
    });

    const exportarCSV = async () => { /* ... sua lógica de exportar CSV aqui */ };
    document.getElementById('btn-exportar-csv')?.addEventListener('click', exportarCSV);

    const salvarGraficoComoPDF = (containerId, titulo) => { /* ... sua lógica de gráficos aqui */ };
    document.getElementById('salvar-pdf-periodo')?.addEventListener('click', () => salvarGraficoComoPDF('grafico-periodo-container', 'Benefícios por Período'));
    document.getElementById('salvar-pdf-equipamento')?.addEventListener('click', () => salvarGraficoComoPDF('grafico-equipamento-container', 'Benefícios por Equipamento'));
    
    // NOVO BLOCO DE INICIALIZAÇÃO COM onAuthStateChanged()
    console.log("Aguardando status de autenticação...");
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuário logado
            console.log("Usuário autenticado. Verificando dados...");
            db.collection('users').doc(user.uid).get().then(userDoc => {
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    localStorage.setItem('currentUser', JSON.stringify({ id: user.uid, ...userData }));
                    console.log("Dados do usuário sincronizados. Inicializando a aplicação...");
                    
                    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                    const welcomeMessage = document.getElementById('welcome-message');
                    if (welcomeMessage) welcomeMessage.textContent = `Bem-vindo(a), ${currentUser.username}!`;

                    const adminButton = document.getElementById('adminMenuButton');
                    if (adminButton && currentUser.role === 'admin') adminButton.style.display = 'flex';

                    // Anexa os ouvintes de eventos e mostra a tela inicial
                    document.querySelectorAll('.menu-btn').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));
                    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));
                    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
                    document.getElementById('beneficioForm')?.addEventListener('submit', handleFormSubmit);
                    document.getElementById('editForm')?.addEventListener('submit', handleEditFormSubmit);

                    showSection('mainMenu');
                } else {
                    console.error("Documento de usuário não encontrado no Firestore. Deslogando.");
                    auth.signOut();
                    localStorage.removeItem('currentUser');
                    window.location.href = 'login.html';
                }
            }).catch(error => {
                console.error("Erro ao buscar documento do usuário:", error);
                auth.signOut();
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            });
        } else {
            // Nenhum usuário logado, redireciona para a tela de login
            console.log("Nenhum usuário logado. Redirecionando.");
            window.location.href = 'login.html';
        }
    });
});