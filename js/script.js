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
    const form = document.getElementById('beneficioForm');
    const editForm = document.getElementById('editForm');
    const adminForm = document.getElementById('adminForm');
    const equipamentoSelect = document.getElementById('equipamento');
    const responsavelGroup = document.getElementById('responsavelGroup');
    const responsavelInput = document.getElementById('responsavel');
    const tableBody = document.querySelector('#beneficiosTable tbody');
    const menuButtons = document.querySelectorAll('.menu-btn');
    const backButtons = document.querySelectorAll('.back-btn');
    const filterBtn = document.getElementById('btn-filtrar');
    const clearFilterBtn = document.getElementById('btn-limpar');
    const separateBtn = document.getElementById('btn-separar');
    const exportBtn = document.getElementById('btn-exportar-csv');
    const logoutBtn = document.getElementById('logout-btn');

    const graficoPeriodoCanvas = document.getElementById('grafico-periodo');
    const graficoEquipamentoCanvas = document.getElementById('grafico-equipamento');
    const periodoGraficoSelect = document.getElementById('periodo-grafico');
    const tipoGraficoPeriodoSelect = document.getElementById('tipo-grafico-periodo');
    const gerarGraficoPeriodoBtn = document.getElementById('gerar-grafico-periodo');
    const tipoGraficoEquipamentoSelect = document.getElementById('tipo-grafico-equipamento');
    const gerarGraficoEquipamentoBtn = document.getElementById('gerar-grafico-equipamento');
    let graficoPeriodoChart = null;
    let graficoEquipamentoChart = null;
    const graficoSection = document.getElementById('graficosSection');

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
    
    async function checkLoginStatus() {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            window.location.href = 'login.html';
        } else {
            const welcomeMessageElement = document.getElementById('welcome-message');
            if (welcomeMessageElement) {
                welcomeMessageElement.textContent = `Bem-vindo(a), ${currentUser.username}!`;
            }
            const adminMenuButton = document.getElementById('adminMenuButton');
            if (adminMenuButton && currentUser.role === 'admin') {
                adminMenuButton.style.display = 'block';
            }
            showSection('mainMenu');
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

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
    }

    function handleLogout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }

    async function handleAdminFormSubmit(e) {
        e.preventDefault();
        const newUsername = document.getElementById('new-username').value;
        const newPassword = document.getElementById('new-password').value;
        const newRole = document.getElementById('new-role').value;
        const existingUserSnapshot = await usersCollection.where('username', '==', newUsername).get();
        if (!existingUserSnapshot.empty) {
            alert('Nome de usuário já existe!');
            return;
        }
        const newUser = {
            username: newUsername,
            password: newPassword,
            role: newRole,
            active: true,
            lastLogin: ''
        };
        await usersCollection.add(newUser);
        renderUsersTable();
        adminForm.reset();
        alert('Novo usuário cadastrado com sucesso!');
    }

    async function renderUsersTable() {
        const usersTableBody = document.querySelector('#usersTable tbody');
        usersTableBody.innerHTML = '';
        const snapshot = await usersCollection.get();
        const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        userList.forEach((user) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.role === 'admin' ? 'Administrador' : 'Usuário Comum'}</td>
                <td>${user.lastLogin || 'Nunca'}</td>
                <td>
                    <button class="${user.active ? 'cancel-btn' : 'submit-btn'}" onclick="toggleUserStatus('${user.id}')">
                        ${user.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button class="delete-btn" onclick="deleteUser('${user.id}')">Excluir</button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
    }

    window.toggleUserStatus = async function(userId) {
        const userRef = usersCollection.doc(userId);
        const userDoc = await userRef.get();
        const user = userDoc.data();
        
        if (user.role === 'admin' && user.active && (await usersCollection.where('role', '==', 'admin').where('active', '==', true).get()).size === 1) {
            alert('Não é possível desativar o único administrador ativo.');
            return;
        }
        await userRef.update({ active: !user.active });
        renderUsersTable();
    };

    window.deleteUser = async function(userId) {
        const userRef = usersCollection.doc(userId);
        const userDoc = await userRef.get();
        const user = userDoc.data();

        if (user.role === 'admin') {
            alert('Não é possível excluir um administrador. Desative a conta, se necessário.');
            return;
        }

        if (confirm(`Tem certeza que deseja excluir o usuário ${user.username}?`)) {
            await userRef.delete();
            renderUsersTable();
        }
    };
    
    function showContactInfo() {
        alert('Para cadastrar um novo login, entre em contato com Vitor Furtado da Vigilância SUAS pelo WhatsApp: (91) 99925-9834.');
    }

    function showSection(sectionId) {
        console.log(`Tentando exibir a seção: ${sectionId}`);
        document.querySelectorAll('.section, .main-menu-section').forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            if (sectionId === 'consultaSection') {
                fetchBeneficios();
            }
            if (sectionId === 'adminSection') {
                renderUsersTable();
            }
            if (sectionId === 'graficosSection') {
                gerarGraficoBeneficiosPorPeriodo();
                gerarGraficoBeneficiosPorEquipamento();
            }
        }
    }

    function setupEventListeners() {
        console.log("Configurando event listeners...");
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
            document.querySelector('.delete-btn-edit').addEventListener('click', deleteBeneficio);
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

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            document.getElementById('signup-btn').addEventListener('click', showContactInfo);
        }
        console.log("Event listeners configurados.");
    }

    function validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
        let soma = 0;
        for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
        let resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(9))) return false;
        soma = 0;
        for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
        resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        return resto === parseInt(cpf.charAt(10));
    }

    function toggleResponsavelField() {
        const responsavelInput = document.getElementById('responsavel');
        const responsavelGroup = document.getElementById('responsavelGroup');
        if (equipamentoSelect.value !== '') {
            responsavelGroup.style.display = 'flex';
            responsavelInput.setAttribute('required', 'required');
        } else {
            responsavelGroup.style.display = 'none';
            responsavelInput.removeAttribute('required');
        }
    }
    
    async function fetchBeneficios() {
        const snapshot = await beneficiosCollection.get();
        const allBeneficios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTable(allBeneficios);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const cpfInput = document.getElementById('cpf').value;
        if (!validarCPF(cpfInput)) {
            alert('CPF inválido!');
            return;
        }
        
        const newBeneficio = {
            beneficiario: form.beneficiario.value,
            cpf: form.cpf.value,
            data: form.data.value,
            valor: form.valor.value,
            beneficio: form.beneficio.value,
            quantidade: form.quantidade.value,
            equipamento: form.equipamento.value,
            responsavel: form.responsavel ? form.responsavel.value : '',
            status: form.status.value,
            observacoes: form.observacoes.value,
            lastUpdated: new Date().toLocaleString('pt-BR')
        };
        
        await beneficiosCollection.add(newBeneficio);
        form.reset();
        if (responsavelGroup) {
            responsavelGroup.style.display = 'none';
            responsavelInput.removeAttribute('required');
        }
        alert('Benefício cadastrado com sucesso!');
        showSection('consultaSection');
    }

    async function handleEditFormSubmit(e) {
        e.preventDefault();
        const docId = document.getElementById('editIndex').value;
        const formEdit = document.getElementById('editForm');
        
        const updatedBeneficio = {
            beneficiario: formEdit['edit-beneficiario'].value,
            cpf: formEdit['edit-cpf'].value,
            data: formEdit['edit-data'].value,
            valor: formEdit['edit-valor'].value,
            beneficio: formEdit['edit-beneficio'].value,
            quantidade: formEdit['edit-quantidade'].value,
            equipamento: formEdit['edit-equipamento'].value,
            responsavel: formEdit['edit-responsavel'].value,
            status: formEdit['edit-status'].value,
            observacoes: formEdit['edit-observacoes'].value,
            lastUpdated: new Date().toLocaleString('pt-BR')
        };
    
        if (!validarCPF(updatedBeneficio.cpf)) {
            alert('CPF inválido!');
            return;
        }

        await beneficiosCollection.doc(docId).update(updatedBeneficio);
        alert('Registro atualizado com sucesso!');
        showSection('consultaSection');
    }

    async function deleteBeneficio() {
        const docId = document.getElementById('editIndex').value;
        if (confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.')) {
            await beneficiosCollection.doc(docId).delete();
            alert('Registro excluído com sucesso!');
            showSection('consultaSection');
        }
    }
    
    function renderTable(dataToRender) {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        dataToRender.forEach((beneficio) => {
            const row = document.createElement('tr');
            row.dataset.id = beneficio.id;
            
            const values = [
                beneficio.beneficiario, beneficio.cpf, beneficio.data, beneficio.valor,
                beneficio.beneficio, beneficio.quantidade, beneficio.equipamento,
                beneficio.responsavel, beneficio.status, beneficio.observacoes,
                beneficio.lastUpdated,
            ];
            
            values.forEach(value => {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });

            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `<button class="edit-btn" onclick="openEditForm(this)">Editar</button>`;
            row.appendChild(actionsCell);
            tableBody.appendChild(row);
        });
    }
    
    window.openEditForm = async function(button) {
        const row = button.closest('tr');
        const docId = row.dataset.id;
        const doc = await beneficiosCollection.doc(docId).get();
        const beneficio = doc.data();

        document.getElementById('editIndex').value = docId;
        document.getElementById('edit-beneficiario').value = beneficio.beneficiario;
        document.getElementById('edit-cpf').value = beneficio.cpf;
        document.getElementById('edit-data').value = beneficio.data;
        document.getElementById('edit-valor').value = beneficio.valor;
        document.getElementById('edit-beneficio').value = beneficio.beneficio;
        document.getElementById('edit-quantidade').value = beneficio.quantidade;
        document.getElementById('edit-equipamento').value = beneficio.equipamento;
        document.getElementById('edit-responsavel').value = beneficio.responsavel;
        document.getElementById('edit-status').value = beneficio.status;
        document.getElementById('edit-observacoes').value = beneficio.observacoes;
        
        showSection('editSection');
    };

    async function applyFilters() {
        let query = beneficiosCollection;
        const filterBeneficio = document.getElementById('filter-beneficio').value;
        const filterEquipamento = document.getElementById('filter-equipamento').value;
        const filterStatus = document.getElementById('filter-status').value;
        const filterData = document.getElementById('filter-data').value;
        
        if (filterBeneficio) query = query.where('beneficio', '==', filterBeneficio);
        if (filterEquipamento) query = query.where('equipamento', '==', filterEquipamento);
        if (filterStatus) query = query.where('status', '==', filterStatus);
        if (filterData) query = query.where('data', '==', filterData);
        
        const snapshot = await query.get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTable(data);
    }

    function clearFilters() {
        document.getElementById('filter-beneficio').value = '';
        document.getElementById('filter-equipamento').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-data').value = '';
        fetchBeneficios();
    }

    async function toggleDateSeparation() {
        const isSeparated = tableBody.querySelectorAll('.date-separator').length > 0;
        const snapshot = await beneficiosCollection.get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (isSeparated) {
            renderTable(data);
        } else {
            const sortedBeneficios = [...data].sort((a, b) => new Date(a.data) - new Date(b.data));
            const groupedByDate = {};
            sortedBeneficios.forEach(beneficio => {
                const date = beneficio.data;
                if (!groupedByDate[date]) { groupedByDate[date] = []; }
                groupedByDate[date].push(beneficio);
            });
            tableBody.innerHTML = '';
            for (const date in groupedByDate) {
                const dateRow = document.createElement('tr');
                const dateCell = document.createElement('td');
                dateCell.colSpan = 12;
                dateCell.className = 'date-separator';
                dateCell.textContent = `Registros em ${date.split('-').reverse().join('/')}`;
                dateRow.appendChild(dateCell);
                tableBody.appendChild(dateRow);
                groupedByDate[date].forEach(beneficio => {
                    const row = document.createElement('tr');
                    row.dataset.id = beneficio.id;
                    const values = [
                        beneficio.beneficiario, beneficio.cpf, beneficio.data, beneficio.valor,
                        beneficio.beneficio, beneficio.quantidade, beneficio.equipamento,
                        beneficio.responsavel, beneficio.status, beneficio.observacoes,
                        beneficio.lastUpdated,
                    ];
                    values.forEach(value => {
                        const cell = document.createElement('td');
                        cell.textContent = value;
                        row.appendChild(cell);
                    });
                    const actionsCell = document.createElement('td');
                    actionsCell.innerHTML = `<button class="edit-btn" onclick="openEditForm(this)">Editar</button>`;
                    row.appendChild(actionsCell);
                    tableBody.appendChild(row);
                });
            }
        }
    }

    async function exportarCSV() {
        const snapshot = await beneficiosCollection.get();
        const sortedData = snapshot.docs.map(doc => doc.data()).sort((a, b) => new Date(a.data) - new Date(b.data));

        if (sortedData.length === 0) {
            alert("Nenhum dado para exportar.");
            return;
        }
        
        const headers = [
            "Beneficiário", "CPF", "Data", "Valor", "Benefício", "Quantidade", 
            "Equipamento", "Técnico Responsável pela Concessão", "Status", "Observações", "Última Atualização"
        ];
        const csvHeaders = headers.map(header => `"${header}"`).join(',');
        
        const csvRows = sortedData.map(beneficio => {
            return headers.map(header => {
                let value = beneficio[header];
                let cleanedValue = String(value || '').replace(/"/g, '""');
                return `"${cleanedValue}"`;
            }).join(',');
        });
        
        const csvContent = `${csvHeaders}\n${csvRows.join('\n')}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'beneficios_eventuais.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Inicialização da aplicação: Apenas se for na página de login
    if (window.location.pathname.endsWith('login.html')) {
        setupAdminUser();
    } else {
        checkLoginStatus();
    }
    setupEventListeners();
});