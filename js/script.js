document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM totalmente carregado. Iniciando a aplicação.");

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

    // --- FUNÇÕES DE LOADING ADICIONADAS AQUI ---
    function showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }
    
    function hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Elementos do DOM
    let form = null, editForm = null, adminForm = null, equipamentoSelect = null, responsavelGroup = null;
    let responsavelInput = null, tableBody = null, menuButtons = null, backButtons = null;
    let filterBtn = null, clearFilterBtn = null, separateBtn = null, exportBtn = null, logoutBtn = null;
    let graficoPeriodoCanvas = null, graficoEquipamentoCanvas = null, periodoGraficoSelect = null;
    let tipoGraficoPeriodoSelect = null, gerarGraficoPeriodoBtn = null, tipoGraficoEquipamentoSelect = null;
    let gerarGraficoEquipamentoBtn = null, graficoSection = null;
    let graficoPeriodoChart = null, graficoEquipamentoChart = null;
    
    // Funções de inicialização
    async function setupAdminUser() {
        const adminSnapshot = await usersCollection.where('role', '==', 'admin').limit(1).get();
        if (adminSnapshot.empty) {
            const newAdminUser = { 
                username: 'vitorfurtadoo', 
                password: 'Biologo123!', 
                role: 'admin', 
                active: true, 
                lastLogin: '' 
            };
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
            const userSnapshot = await usersCollection
                .where('username', '==', username)
                .where('password', '==', password)
                .get();
    
            if (!userSnapshot.empty) {
                const userDoc = userSnapshot.docs[0];
                const user = { id: userDoc.id, ...userDoc.data() };
                if (user.active) {
                    user.lastLogin = new Date().toLocaleString('pt-BR');
                    await usersCollection.doc(user.id).update({ lastLogin: user.lastLogin });
                    saveCurrentUser(user);
                    window.location.href = 'index.html';
                } else {
                    alert('Sua conta está desativada. Entre em contato com o administrador.');
                }
            } else {
                alert('Login ou senha incorretos.');
            }
        } catch(error) {
            console.error("Erro no login:", error);
            alert("Falha ao tentar fazer login. Verifique o console.");
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
        menuButtons = document.querySelectorAll('.menu-btn, .btn-graficos');
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
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        const signupBtn = document.getElementById('signup-btn');
        if (signupBtn) {
            signupBtn.addEventListener('click', showContactInfo);
        }
        setupAdminUser();
    }

    function setupMainPageEventListeners() {
        menuButtons.forEach(button => {
            button.addEventListener('click', () => {
                showSection(button.dataset.section);
            });
        });
        backButtons.forEach(button => {
            button.addEventListener('click', () => {
                showSection(button.dataset.section);
            });
        });
        if (form) { form.addEventListener('submit', handleFormSubmit); }
        if (editForm) {
            editForm.addEventListener('submit', handleEditFormSubmit);
            document.querySelector('.delete-btn-edit').addEventListener('click', deleteBeneficioFromEdit);
        }
        if (adminForm) { adminForm.addEventListener('submit', handleAdminFormSubmit); }
        if (equipamentoSelect) { equipamentoSelect.addEventListener('change', toggleResponsavelField); }
        if (filterBtn) { filterBtn.addEventListener('click', applyFilters); }
        if (clearFilterBtn) { clearFilterBtn.addEventListener('click', clearFilters); }
        if (separateBtn) { separateBtn.addEventListener('click', toggleDateSeparation); }
        if (exportBtn) { exportBtn.addEventListener('click', exportarCSV); }
        if (logoutBtn) { logoutBtn.addEventListener('click', handleLogout); }
        if (gerarGraficoPeriodoBtn) { gerarGraficoPeriodoBtn.addEventListener('click', gerarGraficoBeneficiosPorPeriodo); }
        if (gerarGraficoEquipamentoBtn) { gerarGraficoEquipamentoBtn.addEventListener('click', gerarGraficoBeneficiosPorEquipamento); }
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
        } finally {
            hideLoading();
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        showLoading();
        // ... (resto da função de submit)
        try {
            //...
        } finally {
            hideLoading();
        }
    }
    
    // ... (restante das suas funções, lembre-se de adicionar show/hideLoading nelas também) ...
    // Vou adicionar em algumas chaves como exemplo:

    async function handleEditFormSubmit(e) {
        e.preventDefault();
        showLoading();
        try {
            const docId = document.getElementById('editIndex').value;
            // ... (resto da lógica de edição)
            await beneficiosCollection.doc(docId).update(updatedBeneficio);
            alert('Registro atualizado com sucesso!');
            showSection('consultaSection');
        } catch(error){
            console.error("Erro ao editar:", error);
        } finally {
            hideLoading();
        }
    }

    async function deleteBeneficioFromEdit() {
        showLoading();
        try {
            const docId = document.getElementById('editIndex').value;
            if (confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.')) {
                await beneficiosCollection.doc(docId).delete();
                alert('Registro excluído com sucesso!');
                showSection('consultaSection');
            }
        } catch(error) {
            console.error("Erro ao deletar:", error);
        } finally {
            hideLoading();
        }
    }

    // Adicione as outras funções aqui (renderTable, validarCPF, etc.)
    // ...

    // --- CÓDIGO DOS GRÁFICOS ADICIONADO AQUI ---
    async function gerarGraficoBeneficiosPorPeriodo() {
        if (!graficoPeriodoCanvas) return;
        showLoading();

        try {
            const snapshot = await beneficiosCollection.get();
            const beneficios = snapshot.docs.map(doc => doc.data());

            const periodo = periodoGraficoSelect.value;
            const tipoGrafico = tipoGraficoPeriodoSelect.value;

            const dadosAgrupados = beneficios.reduce((acc, ben) => {
                const data = new Date(ben.data);
                let chave;
                if (periodo === 'mes') {
                    chave = `${data.getFullYear()}/${String(data.getMonth() + 1).padStart(2, '0')}`;
                } else if (periodo === 'ano') {
                    chave = data.getFullYear().toString();
                } else {
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
                    datasets: [{
                        label: 'Quantidade de Benefícios Concedidos',
                        data: data,
                        backgroundColor: 'rgba(46, 139, 87, 0.6)',
                        borderColor: 'rgba(46, 139, 87, 1)',
                        borderWidth: 2,
                        fill: tipoGrafico === 'line' ? true : false,
                    }]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true } } }
            });
        } catch (error) {
            console.error("Erro ao gerar gráfico por período:", error);
            alert("Não foi possível gerar o gráfico.");
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
                    datasets: [{
                        label: 'Quantidade por Equipamento',
                        data: data,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.6)','rgba(54, 162, 235, 0.6)','rgba(255, 206, 86, 0.6)',
                            'rgba(75, 192, 192, 0.6)','rgba(153, 102, 255, 0.6)','rgba(255, 159, 64, 0.6)'
                        ],
                        borderColor: '#fff',
                        borderWidth: 1
                    }]
                },
                options: { responsive: true }
            });
        } catch (error) {
            console.error("Erro ao gerar gráfico por equipamento:", error);
            alert("Não foi possível gerar o gráfico.");
        } finally {
            hideLoading();
        }
    }


    // --- LÓGICA DE INICIALIZAÇÃO DA PÁGINA ---
    const currentPath = window.location.pathname;
    if (currentPath.endsWith('login.html') || currentPath === '/') {
        initLoginPage();
    } else {
        initMainPage();
    }
});