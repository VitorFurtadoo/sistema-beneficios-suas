document.addEventListener('DOMContentLoaded', () => {
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

    let users = JSON.parse(localStorage.getItem('users')) || [];
    const adminUserIndex = users.findIndex(u => u.username === 'vitorfurtadoo');
    if (adminUserIndex === -1) {
        users.push({ 
            username: 'vitorfurtadoo', 
            password: 'Biologo123!', 
            role: 'admin', 
            active: true, 
            lastLogin: '' 
        });
    } else {
        users[adminUserIndex].active = true;
    }
    saveUsers();

    let currentUser = null;

    function saveUsers() {
        localStorage.setItem('users', JSON.stringify(users));
    }

    const menuButtons = document.querySelectorAll('.menu-btn');
    const backButtons = document.querySelectorAll('.back-btn');
    const form = document.getElementById('beneficioForm');
    const tableBody = document.querySelector('#beneficiosTable tbody');
    const equipamentoSelect = document.getElementById('equipamento');
    const responsavelGroup = document.getElementById('responsavelGroup');
    const responsavelInput = document.getElementById('responsavel');
    const filterBtn = document.getElementById('btn-filtrar');
    const clearFilterBtn = document.getElementById('btn-limpar');
    const separateBtn = document.getElementById('btn-separar');
    const exportBtn = document.getElementById('btn-exportar-csv');
    const editForm = document.getElementById('editForm');
    const adminForm = document.getElementById('adminForm');
    const usersTableBody = document.querySelector('#usersTable tbody');

    const deleteBtnEdit = document.querySelector('.delete-btn-edit');
    if (deleteBtnEdit) {
        deleteBtnEdit.addEventListener('click', deleteBeneficio);
    }

    function showSection(sectionId) {
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
        }
    }

    function setupEventListeners() {
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
        if (editForm) { editForm.addEventListener('submit', handleEditFormSubmit); }
        if (adminForm) { adminForm.addEventListener('submit', handleAdminFormSubmit); }
        if (equipamentoSelect) { equipamentoSelect.addEventListener('change', toggleResponsavelField); }
        if (filterBtn) { filterBtn.addEventListener('click', applyFilters); }
        if (clearFilterBtn) { clearFilterBtn.addEventListener('click', clearFilters); }
        if (separateBtn) { separateBtn.addEventListener('click', toggleDateSeparation); }
        if (exportBtn) { exportBtn.addEventListener('click', exportarCSV); }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            document.getElementById('signup-btn').addEventListener('click', showContactInfo);
        }
        if (!window.location.pathname.endsWith('login.html')) {
            checkLoginStatus();
        }
    }

    function checkLoginStatus() {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            window.location.href = 'login.html';
        } else {
            if (currentUser.role === 'admin') {
                document.getElementById('adminMenuButton').style.display = 'block';
            }
            showSection('mainMenu');
        }
    }

    function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            if (user.active) {
                user.lastLogin = new Date().toLocaleString('pt-BR');
                saveUsers();
                localStorage.setItem('currentUser', JSON.stringify(user));
                window.location.href = 'index.html';
            } else {
                alert('Sua conta está desativada. Entre em contato com o administrador.');
            }
        } else {
            alert('Login ou senha incorretos.');
        }
    }

    function handleAdminFormSubmit(e) {
        e.preventDefault();
        const newUsername = document.getElementById('new-username').value;
        const newPassword = document.getElementById('new-password').value;
        const newRole = document.getElementById('new-role').value;
        const existingUser = users.find(u => u.username === newUsername);
        if (existingUser) {
            alert('Nome de usuário já existe!');
            return;
        }
        const newUser = { username: newUsername, password: newPassword, role: newRole, active: true, lastLogin: '' };
        users.push(newUser);
        saveUsers();
        renderUsersTable();
        adminForm.reset();
        alert('Novo usuário cadastrado com sucesso!');
    }

    function renderUsersTable() {
        usersTableBody.innerHTML = '';
        users.forEach((user, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.role === 'admin' ? 'Administrador' : 'Usuário Comum'}</td>
                <td>${user.lastLogin || 'Nunca'}</td>
                <td>
                    <button class="${user.active ? 'cancel-btn' : 'submit-btn'}" onclick="toggleUserStatus(${index})">
                        ${user.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button class="delete-btn" onclick="deleteUser(${index})">Excluir</button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
    }

    window.toggleUserStatus = function(index) {
        if (users[index].role === 'admin' && users.filter(u => u.role === 'admin' && u.active).length === 1 && users[index].active) {
             alert('Não é possível desativar o único administrador ativo.');
             return;
        }
        users[index].active = !users[index].active;
        saveUsers();
        renderUsersTable();
    };

    window.deleteUser = function(index) {
        if (users[index].role === 'admin') {
            alert('Não é possível excluir um administrador. Desative a conta, se necessário.');
            return;
        }
        if (confirm(`Tem certeza que deseja excluir o usuário ${users[index].username}?`)) {
            users.splice(index, 1);
            saveUsers();
            renderUsersTable();
        }
    };
    
    function showContactInfo() {
        alert('Para cadastrar um novo login, entre em contato com Vitor Furtado da Vigilância SUAS pelo WhatsApp: (91) 99925-9834.');
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
        if (this.value !== '') {
            responsavelGroup.style.display = 'flex';
            responsavelInput.setAttribute('required', 'required');
        } else {
            responsavelGroup.style.display = 'none';
            responsavelInput.removeAttribute('required');
        }
    }

    async function fetchBeneficios() {
        const snapshot = await db.collection('beneficios').get();
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
            lastUpdated: new Date().toLocaleString('pt-BR'),
        };
        
        await db.collection('beneficios').add(newBeneficio);
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

        await db.collection('beneficios').doc(docId).update(updatedBeneficio);
        alert('Registro atualizado com sucesso!');
        showSection('consultaSection');
    }

    async function deleteBeneficio() {
        const docId = document.getElementById('editIndex').value;
        if (confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.')) {
            await db.collection('beneficios').doc(docId).delete();
            alert('Registro excluído com sucesso!');
            showSection('consultaSection');
        }
    }
    
    function renderTable(dataToRender) {
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
        const doc = await db.collection('beneficios').doc(docId).get();
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
        let query = db.collection('beneficios');
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
        const snapshot = await db.collection('beneficios').get();
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
        const snapshot = await db.collection('beneficios').get();
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

    setupEventListeners();
});