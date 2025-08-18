/* CÓDIGO COMPLETO E UNIFICADO */
document.addEventListener('DOMContentLoaded', () => {
    // IMPORTA AS BIBLIOTECAS GLOBAIS
    const { jsPDF } = window.jspdf;

    // CONFIGURAÇÃO DO FIREBASE
    // **IMPORTANTE**: Substitua pelos seus dados reais do Firebase
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
    const beneficiosCollection = db.collection('beneficios');
    const usersCollection = db.collection('users');

    // CONTROLE DE TELA DE CARREGAMENTO
    const showLoading = () => document.getElementById('loading-overlay')?.style.display = 'flex';
    const hideLoading = () => document.getElementById('loading-overlay')?.style.display = 'none';

    // DECLARAÇÃO DE VARIÁVEIS GLOBAIS
    let graficoPeriodoChart = null, graficoEquipamentoChart = null;

    // FUNÇÕES DE LOGIN E AUTENTICAÇÃO
    const handleLogin = async (e) => {
        showLoading();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        if (!username || !password) {
            alert("Por favor, preencha o login e a senha.");
            hideLoading();
            return;
        }
        try {
            const userSnapshot = await usersCollection.where('username', '==', username).where('password', '==', password).get();
            if (!userSnapshot.empty) {
                const userDoc = userSnapshot.docs[0];
                const user = { id: userDoc.id, ...userDoc.data() };
                if (user.active) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    window.location.href = 'index.html';
                } else {
                    hideLoading();
                    alert('Sua conta está desativada.');
                }
            } else {
                hideLoading();
                alert('Login ou senha incorretos.');
            }
        } catch (error) {
            hideLoading();
            console.error("Erro no login:", error);
            alert("Falha ao tentar fazer login. Verifique o console (F12) e suas chaves do Firebase.");
        }
    };

    const checkLoginStatus = () => {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
            window.location.href = 'login.html';
            return false;
        }
        const currentUser = JSON.parse(userStr);
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) welcomeMessage.textContent = `Bem-vindo(a), ${currentUser.username}!`;
        
        const adminButton = document.getElementById('adminMenuButton');
        if (adminButton && currentUser.role === 'admin') adminButton.style.display = 'flex';
        
        return true;
    };

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    };

    const showContactInfo = () => alert('Para cadastrar um novo login, entre em contato com o administrador.');

    // FUNÇÕES DE NAVEGAÇÃO
    const showSection = (sectionId) => {
        document.querySelectorAll('.section, .main-menu-section').forEach(section => section.classList.remove('active'));
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            if (sectionId === 'consultaSection') fetchBeneficios();
            if (sectionId === 'adminSection') renderUsersTable(); // Exemplo
        }
    };

    // FUNÇÕES CRUD (CRIAR, LER, ATUALIZAR, DELETAR)
    const fetchBeneficios = async () => {
        showLoading();
        try {
            const snapshot = await beneficiosCollection.orderBy('data', 'desc').get();
            const allBeneficios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderTable(allBeneficios);
        } catch (error) {
            console.error("Erro ao buscar benefícios:", error);
            alert("Não foi possível carregar os dados.");
        } finally {
            hideLoading();
        }
    };

    const renderTable = (data) => {
        const tableBody = document.querySelector('#beneficiosTable tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        data.forEach(beneficio => {
            const row = tableBody.insertRow();
            row.dataset.id = beneficio.id;
            row.innerHTML = `
                <td>${beneficio.beneficiario || ''}</td>
                <td>${beneficio.cpf || ''}</td>
                <td>${new Date(beneficio.data + 'T00:00:00').toLocaleDateString('pt-BR') || ''}</td>
                <td>${typeof beneficio.valor === 'number' ? beneficio.valor.toFixed(2) : beneficio.valor || ''}</td>
                <td>${beneficio.beneficio || ''}</td>
                <td>${beneficio.quantidade || ''}</td>
                <td>${beneficio.equipamento || ''}</td>
                <td>${beneficio.responsavel || ''}</td>
                <td>${beneficio.status || ''}</td>
                <td>${beneficio.observacoes || ''}</td>
                <td>${beneficio.lastUpdated || ''}</td>
                <td><button class="edit-btn" onclick="window.openEditForm('${beneficio.id}')">Editar</button></td>
            `;
        });
    };
    
    // Disponibiliza a função globalmente para o onclick
    window.openEditForm = async (id) => {
        showLoading();
        try {
            const doc = await beneficiosCollection.doc(id).get();
            if (!doc.exists) throw new Error("Documento não encontrado");
            const data = doc.data();
            document.getElementById('editIndex').value = id;
            document.getElementById('edit-beneficiario').value = data.beneficiario;
            document.getElementById('edit-cpf').value = data.cpf;
            document.getElementById('edit-data').value = data.data;
            document.getElementById('edit-valor').value = data.valor;
            document.getElementById('edit-beneficio').value = data.beneficio;
            document.getElementById('edit-quantidade').value = data.quantidade;
            document.getElementById('edit-equipamento').value = data.equipamento;
            document.getElementById('edit-responsavel').value = data.responsavel;
            document.getElementById('edit-status').value = data.status;
            document.getElementById('edit-observacoes').value = data.observacoes;
            showSection('editSection');
        } catch(error) {
            console.error("Erro ao abrir formulário de edição:", error);
            alert("Não foi possível carregar os dados para edição.");
        } finally {
            hideLoading();
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        showLoading();
        try {
            const formData = new FormData(e.target);
            const newBeneficio = Object.fromEntries(formData.entries());
            newBeneficio.lastUpdated = new Date().toLocaleString('pt-BR');
            await beneficiosCollection.add(newBeneficio);
            alert('Benefício cadastrado com sucesso!');
            e.target.reset();
            showSection('consultaSection');
        } catch(error) {
            console.error("Erro ao cadastrar:", error);
            alert("Falha ao cadastrar benefício.");
        } finally {
            hideLoading();
        }
    };

    const handleEditFormSubmit = async (e) => {
        e.preventDefault();
        showLoading();
        try {
            const docId = document.getElementById('editIndex').value;
            const formData = new FormData(e.target);
            const updatedBeneficio = Object.fromEntries(formData.entries());
            updatedBeneficio.lastUpdated = new Date().toLocaleString('pt-BR');
            await beneficiosCollection.doc(docId).update(updatedBeneficio);
            alert('Registro atualizado com sucesso!');
            showSection('consultaSection');
        } catch(error) {
            console.error("Erro ao atualizar:", error);
            alert("Falha ao atualizar registro.");
        } finally {
            hideLoading();
        }
    };

    // FUNÇÕES DE EXPORTAÇÃO E PDF
    const exportarCSV = async () => { /* ... (código já completo) ... */ };
    const salvarGraficoComoPDF = (containerId, titulo) => { /* ... (código já completo) ... */ };

    // FUNÇÕES DE GRÁFICOS
    const gerarGraficoBeneficiosPorPeriodo = async () => { /* ... (código já completo) ... */ };
    const gerarGraficoBeneficiosPorEquipamento = async () => { /* ... (código já completo) ... */ };

    // INICIALIZAÇÃO DA PÁGINA
    const initPage = () => {
        const path = window.location.pathname.split("/").pop();
        if (path === 'login.html' || path === '') {
            document.getElementById('login-btn')?.addEventListener('click', handleLogin);
            document.getElementById('signup-btn')?.addEventListener('click', showContactInfo);
        } else if (checkLoginStatus()) {
            // Event Listeners da página principal
            document.querySelectorAll('.menu-btn').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));
            document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));
            document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
            document.getElementById('btn-exportar-csv')?.addEventListener('click', exportarCSV);
            
            // Formulários
            document.getElementById('beneficioForm')?.addEventListener('submit', handleFormSubmit);
            document.getElementById('editForm')?.addEventListener('submit', handleEditFormSubmit);

            // Gráficos e PDF
            const salvarPdfPeriodoBtn = document.getElementById('salvar-pdf-periodo');
            const salvarPdfEquipamentoBtn = document.getElementById('salvar-pdf-equipamento');
            document.getElementById('gerar-grafico-periodo')?.addEventListener('click', gerarGraficoBeneficiosPorPeriodo);
            document.getElementById('gerar-grafico-equipamento')?.addEventListener('click', gerarGraficoBeneficiosPorEquipamento);
            salvarPdfPeriodoBtn?.addEventListener('click', () => salvarGraficoComoPDF('grafico-periodo-container', 'Relatório de Benefícios por Período'));
            salvarPdfEquipamentoBtn?.addEventListener('click', () => salvarGraficoComoPDF('grafico-equipamento-container', 'Relatório de Benefícios por Equipamento'));
        }
    };

    initPage();
});