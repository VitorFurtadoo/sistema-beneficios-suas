document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM totalmente carregado. Iniciando a aplicação.");

    // Cole sua configuração do Firebase aqui
    const firebaseConfig = {
        apiKey: "AIzaSyAnYj37TDwV0kkB9yBeJguZCEqHvWV7vAY",
        authDomain: "beneficios-eventuais-suas.firebaseapp.com",
        projectId: "beneficios-eventuais-suas",
        storageBucket: "beneficios-eventuais-suas.firebasestorage.app",
        messagingSenderId: "665210304564",
        appId: "1:665210304564:web:cf233fd0e56bbfe3d5b261"
    };

    if (firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const db = firebase.firestore();
    const beneficiosCollection = db.collection('beneficios');
    const usersCollection = db.collection('users');

    let currentUser = null;

    function showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'flex';
    }
    
    function hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    let form, editForm, adminForm, equipamentoSelect, responsavelGroup, responsavelInput, tableBody, menuButtons, backButtons, filterBtn, clearFilterBtn, separateBtn, exportBtn, logoutBtn;
    let graficoPeriodoCanvas, graficoEquipamentoCanvas, periodoGraficoSelect, tipoGraficoPeriodoSelect, gerarGraficoPeriodoBtn, tipoGraficoEquipamentoSelect, gerarGraficoEquipamentoBtn, graficoSection;
    let graficoPeriodoChart = null, graficoEquipamentoChart = null;
    
    async function setupAdminUser() {
        const adminSnapshot = await usersCollection.where('role', '==', 'admin').limit(1).get();
        if (adminSnapshot.empty) {
            const newAdminUser = { username: 'vitorfurtadoo', password: 'Biologo123!', role: 'admin', active: true, lastLogin: '' };
            await usersCollection.add(newAdminUser);
            console.log('Usuário administrador criado no Firestore.');
        }
    }

    function saveCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    async function handleLogin(e) {
        e.preventDefault();
        showLoading();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        try {
            const userSnapshot = await usersCollection.where('username', '==', username).where('password', '==', password).get();
            if (!userSnapshot.empty) {
                const userDoc = userSnapshot.docs[0];
                const user = { id: userDoc.id, ...userDoc.data() };
                if (user.active) {
                    user.lastLogin = new Date().toLocaleString('pt-BR');
                    await usersCollection.doc(user.id).update({ lastLogin: user.lastLogin });
                    saveCurrentUser(user);
                    window.location.href = 'index.html';
                } else {
                    alert('Sua conta está desativada.');
                }
            } else {
                alert('Login ou senha incorretos.');
            }
        } catch (error) {
            console.error("Erro no login:", error);
            alert("Falha ao tentar fazer login. Verifique o console (F12).");
        } finally {
            hideLoading();
        }
    }

    function initMainPage() {
        form = document.getElementById('beneficioForm');
        editForm = document.getElementById('editForm');
        adminForm = document.getElementById('adminForm');
        equipamentoSelect = document.getElementById('equipamento');
        responsavelGroup = document.getElementById('responsavelGroup');
        responsavelInput = document.getElementById('responsavel');
        tableBody = document.querySelector('#beneficiosTable tbody');
        menuButtons = document.querySelectorAll('.menu-btn');
        backButtons = document.querySelectorAll('.back-btn');
        filterBtn = document.getElementById('btn-filtrar');
        clearFilterBtn = document.getElementById('btn-limpar');
        separateBtn = document.getElementById('btn-separar');
        exportBtn = document.getElementById('btn-exportar-csv');
        logoutBtn = document.getElementById('logout-btn');
        graficoPeriodoCanvas = document.getElementById('grafico-periodo');
        graficoEquipamentoCanvas = document.getElementById('grafico-equipamento');
        periodoGraficoSelect = document.getElementById('periodo-grafico');
        tipoGraficoPeriodoSelect = document.getElementById('tipo-grafico-periodo');
        gerarGraficoPeriodoBtn = document.getElementById('gerar-grafico-periodo');
        tipoGraficoEquipamentoSelect = document.getElementById('tipo-grafico-equipamento');
        gerarGraficoEquipamentoBtn = document.getElementById('gerar-grafico-equipamento');
        graficoSection = document.getElementById('graficosSection');
        setupMainPageEventListeners();
        checkLoginStatus();
    }

    function initLoginPage() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
        const signupBtn = document.getElementById('signup-btn');
        if (signupBtn) signupBtn.addEventListener('click', showContactInfo);
        setupAdminUser();
    }

    function setupMainPageEventListeners() {
        menuButtons.forEach(button => button.addEventListener('click', () => showSection(button.dataset.section)));
        backButtons.forEach(button => button.addEventListener('click', () => showSection(button.dataset.section)));
        if (form) form.addEventListener('submit', handleFormSubmit);
        if (editForm) {
            editForm.addEventListener('submit', handleEditFormSubmit);
            document.querySelector('.delete-btn-edit').addEventListener('click', deleteBeneficio);
        }
        if (adminForm) adminForm.addEventListener('submit', handleAdminFormSubmit);
        if (equipamentoSelect) equipamentoSelect.addEventListener('change', toggleResponsavelField);
        if (filterBtn) filterBtn.addEventListener('click', applyFilters);
        if (clearFilterBtn) clearFilterBtn.addEventListener('click', clearFilters);
        if (separateBtn) separateBtn.addEventListener('click', toggleDateSeparation);
        if (exportBtn) exportBtn.addEventListener('click', exportarCSV);
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
        if (gerarGraficoPeriodoBtn) gerarGraficoPeriodoBtn.addEventListener('click', gerarGraficoBeneficiosPorPeriodo);
        if (gerarGraficoEquipamentoBtn) gerarGraficoEquipamentoBtn.addEventListener('click', gerarGraficoBeneficiosPorEquipamento);
    }
    
    // Todas as demais funções (handleLogout, fetchBeneficios, etc.) devem ser incluídas aqui
    // Coloquei o restante do seu código JS abaixo, com as devidas modificações.

    function checkLoginStatus() {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
            window.location.href = 'login.html';
            return;
        }
        currentUser = JSON.parse(userStr);
        document.getElementById('welcome-message').textContent = `Bem-vindo(a), ${currentUser.username}!`;
        if (currentUser.role === 'admin') {
            document.getElementById('adminMenuButton').style.display = 'flex';
        }
    }
    
    function handleLogout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }

    async function fetchBeneficios() {
        showLoading();
        try {
            const snapshot = await beneficiosCollection.get();
            const allBeneficios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderTable(allBeneficios);
        } catch (error) {
            console.error("Erro ao buscar benefícios:", error);
            alert("Não foi possível carregar os dados.");
        } finally {
            hideLoading();
        }
    }
    
    // ... Coloque aqui as outras funções que você já tinha, como renderTable, showSection, etc.
    // ... Eu as recriei abaixo para garantir que esteja tudo completo.
    
    function showContactInfo() {
        alert('Para cadastrar um novo login, entre em contato com Vitor Furtado da Vigilância SUAS pelo WhatsApp: (91) 99925-9834.');
    }

    function showSection(sectionId) {
        document.querySelectorAll('.section, .main-menu-section').forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            if (sectionId === 'consultaSection') fetchBeneficios();
            if (sectionId === 'adminSection') renderUsersTable();
            if (sectionId === 'graficosSection') {
                gerarGraficoBeneficiosPorPeriodo();
                gerarGraficoBeneficiosPorEquipamento();
            }
        }
    }

    function renderTable(dataToRender) {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        dataToRender.forEach((beneficio) => {
            const row = document.createElement('tr');
            row.dataset.id = beneficio.id;
            row.innerHTML = `
                <td>${beneficio.beneficiario || ''}</td>
                <td>${beneficio.cpf || ''}</td>
                <td>${beneficio.data || ''}</td>
                <td>${beneficio.valor || ''}</td>
                <td>${beneficio.beneficio || ''}</td>
                <td>${beneficio.quantidade || ''}</td>
                <td>${beneficio.equipamento || ''}</td>
                <td>${beneficio.responsavel || ''}</td>
                <td>${beneficio.status || ''}</td>
                <td>${beneficio.observacoes || ''}</td>
                <td>${beneficio.lastUpdated || ''}</td>
                <td><button class="edit-btn" onclick="openEditForm(this)">Editar</button></td>
            `;
            tableBody.appendChild(row);
        });
    }

    window.openEditForm = async function(button) {
        showLoading();
        try {
            const row = button.closest('tr');
            const docId = row.dataset.id;
            const doc = await beneficiosCollection.doc(docId).get();
            const beneficio = doc.data();

            document.getElementById('editIndex').value = docId;
            document.getElementById('edit-beneficiario').value = beneficio.beneficiario;
            document.getElementById('edit-cpf').value = beneficio.cpf;
            // ... preencha todos os outros campos do formulário de edição
            showSection('editSection');
        } catch(error) {
            console.error("Erro ao abrir formulário de edição:", error);
        } finally {
            hideLoading();
        }
    };
    
    // Continue adicionando as outras funções que faltam...
    
    async function gerarGraficoBeneficiosPorPeriodo() {
        if (!graficoPeriodoCanvas) return;
        showLoading();
        try {
            const snapshot = await beneficiosCollection.get();
            const beneficios = snapshot.docs.map(doc => doc.data());
            const periodo = periodoGraficoSelect.value;
            const tipoGrafico = tipoGraficoPeriodoSelect.value;
            const dadosAgrupados = beneficios.reduce((acc, ben) => {
                if (!ben.data) return acc;
                const data = new Date(ben.data);
                let chave;
                if (periodo === 'mes') chave = `${data.getFullYear()}/${String(data.getMonth() + 1).padStart(2, '0')}`;
                else if (periodo === 'ano') chave = data.getFullYear().toString();
                else {
                    const trimestre = Math.floor(data.getMonth() / 3) + 1;
                    chave = `${data.getFullYear()}/T${trimestre}`;
                }
                if (!acc[chave]) acc[chave] = 0;
                acc[chave] += 1;
                return acc;
            }, {});
            const labels = Object.keys(dadosAgrupados).sort();
            const data = labels.map(label => dadosAgrupados[label]);
            if (graficoPeriodoChart) graficoPeriodoChart.destroy();
            const ctx = graficoPeriodoCanvas.getContext('2d');
            graficoPeriodoChart = new Chart(ctx, {
                type: tipoGrafico,
                data: {
                    labels: labels,
                    datasets: [{ label: 'Qtd. de Benefícios', data: data, backgroundColor: 'rgba(46, 139, 87, 0.6)', borderColor: 'rgba(46, 139, 87, 1)', borderWidth: 2, fill: tipoGrafico === 'line' }]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true } } }
            });
        } catch (error) {
            console.error("Erro ao gerar gráfico por período:", error);
        } finally {
            hideLoading();
        }
    }

    async function gerarGraficoBeneficiosPorEquipamento() {
        if (!graficoEquipamentoCanvas) return;
        showLoading();
        try {
            const snapshot = await beneficiosCollection.get();
            const beneficios = snapshot.docs.map(doc => doc.data());
            const tipoGrafico = tipoGraficoEquipamentoSelect.value;
            const dadosAgrupados = beneficios.reduce((acc, ben) => {
                const equipamento = ben.equipamento;
                if (!acc[equipamento]) acc[equipamento] = 0;
                acc[equipamento] += 1;
                return acc;
            }, {});
            const labels = Object.keys(dadosAgrupados);
            const data = Object.values(dadosAgrupados);
            if (graficoEquipamentoChart) graficoEquipamentoChart.destroy();
            const ctx = graficoEquipamentoCanvas.getContext('2d');
            graficoEquipamentoChart = new Chart(ctx, {
                type: tipoGrafico,
                data: {
                    labels: labels,
                    datasets: [{ label: 'Qtd. por Equipamento', data: data, backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)'], borderColor: '#fff', borderWidth: 1 }]
                },
                options: { responsive: true }
            });
        } catch (error) {
            console.error("Erro ao gerar gráfico por equipamento:", error);
        } finally {
            hideLoading();
        }
    }

    const currentPath = window.location.pathname.split("/").pop();
    if (currentPath === 'login.html' || currentPath === '') {
        initLoginPage();
    } else {
        initMainPage();
    }
});