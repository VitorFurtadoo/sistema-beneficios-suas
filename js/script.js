document.addEventListener('DOMContentLoaded', () => {
    // Inicializa o array de benefícios e a lista de usuários
    let allBeneficios = JSON.parse(localStorage.getItem('allBeneficios')) || [];
    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Garante que o usuário admin exista e esteja ativo por padrão
    const adminUserExists = users.some(user => user.username === 'admin');
    if (!adminUserExists) {
        users.push({ 
            username: 'admin', 
            password: 'admin', 
            role: 'admin', 
            active: true, 
            lastLogin: '' 
        });
        saveUsers();
    } else {
        // Garante que o admin principal esteja sempre ativo
        const adminIndex = users.findIndex(user => user.username === 'admin');
        if (adminIndex !== -1 && users[adminIndex].active === false) {
            users[adminIndex].active = true;
            saveUsers();
        }
    }
    
    let currentUser = null;

    // Salva a lista de usuários no armazenamento local
    function saveUsers() {
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Salva os benefícios no armazenamento local
    function saveBeneficios() {
        localStorage.setItem('allBeneficios', JSON.stringify(allBeneficios));
    }

    // Referências a elementos do DOM
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

    // Funções de navegação e inicialização
    function showSection(sectionId) {
        document.querySelectorAll('.section, .main-menu-section').forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            // Se for a seção de consulta, renderiza a tabela
            if (sectionId === 'consultaSection') {
                renderTable(allBeneficios);
            }
            // Se for a seção de administração, renderiza a tabela de usuários
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

        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }

        if (editForm) {
            editForm.addEventListener('submit', handleEditFormSubmit);
        }

        if (adminForm) {
            adminForm.addEventListener('submit', handleAdminFormSubmit);
        }

        if (equipamentoSelect) {
            equipamentoSelect.addEventListener('change', toggleResponsavelField);
        }

        if (filterBtn) {
            filterBtn.addEventListener('click', applyFilters);
        }

        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', clearFilters);
        }

        if (separateBtn) {
            separateBtn.addEventListener('click', toggleDateSeparation);
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', exportarCSV);
        }

        // Adiciona event listener para o login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            document.getElementById('signup-btn').addEventListener('click', showContactInfo);
        }

        // Se estiver na página principal, verifica o login
        if (!window.location.pathname.endsWith('login.html')) {
            checkLoginStatus();
        }
    }

    function checkLoginStatus() {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            window.location.href = 'login.html';
        } else {
            // Se for admin, mostra o botão de administração
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

        const newUser = {
            username: newUsername,
            password: newPassword,
            role: newRole,
            active: true,
            lastLogin: ''
        };
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

    // Funções de validação e formulário
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
            responsavelInput.value = '';
        }
    }

    function handleFormSubmit(e) {
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

        allBeneficios.push(newBeneficio);
        saveBeneficios();
        renderTable(allBeneficios);
        form.reset();
        if (responsavelGroup) {
            responsavelGroup.style.display = 'none';
            responsavelInput.removeAttribute('required');
        }
    }

    function handleEditFormSubmit(e) {
        e.preventDefault();
        const index = document.getElementById('editIndex').value;
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

        allBeneficios[index] = updatedBeneficio;
        saveBeneficios();
        renderTable(allBeneficios);
        showSection('consultaSection');
    }

    // Funções de Tabela e Edição
    function renderTable(dataToRender) {
        tableBody.innerHTML = '';
        dataToRender.forEach((beneficio) => {
            const row = document.createElement('tr');
            row.dataset.index = allBeneficios.indexOf(beneficio);
            
            Object.values(beneficio).forEach(value => {
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
    
    window.openEditForm = function(button) {
        const row = button.closest('tr');
        const index = row.dataset.index;
        const beneficio = allBeneficios[index];

        document.getElementById('editIndex').value = index;
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

    // Funções de Filtro e Organização
    function applyFilters() {
        const filterBeneficio = document.getElementById('filter-beneficio').value;
        const filterEquipamento = document.getElementById('filter-equipamento').value;
        const filterStatus = document.getElementById('filter-status').value;
        const filterData = document.getElementById('filter-data').value;
        const filteredData = allBeneficios.filter(beneficio => {
            const matchesBeneficio = !filterBeneficio || beneficio.beneficio === filterBeneficio;
            const matchesEquipamento = !filterEquipamento || beneficio.equipamento === filterEquipamento;
            const matchesStatus = !filterStatus || beneficio.status === filterStatus;
            const matchesData = !filterData || beneficio.data === filterData;
            return matchesBeneficio && matchesEquipamento && matchesStatus && matchesData;
        });
        renderTable(filteredData);
    }

    function clearFilters() {
        document.getElementById('filter-beneficio').value = '';
        document.getElementById('filter-equipamento').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-data').value = '';
        renderTable(allBeneficios);
    }

    function toggleDateSeparation() {
        const isSeparated = tableBody.querySelectorAll('.date-separator').length > 0;
        if (isSeparated) {
            renderTable(allBeneficios);
        } else {
            const sortedBeneficios = [...allBeneficios].sort((a, b) => new Date(a.data) - new Date(b.data));
            const groupedByDate = {};
            sortedBeneficios.forEach(beneficio => {
                const date = beneficio.data;
                if (!groupedByDate[date]) {
                    groupedByDate[date] = [];
                }
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
                    row.dataset.index = allBeneficios.indexOf(beneficio);
                    Object.values(beneficio).forEach(value => {
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

    // Função de exportação para CSV
    function exportarCSV() {
        const sortedData = [...allBeneficios].sort((a, b) => new Date(a.data) - new Date(b.data));
        if (sortedData.length === 0) {
            alert("Nenhum dado para exportar.");
            return;
        }
        const headers = [
            "Beneficiário", "CPF", "Data", "Valor", "Benefício", "Quantidade", 
            "Equipamento", "Responsável", "Status", "Observações", "Última Atualização"
        ];
        const csvHeaders = headers.map(header => `"${header}"`).join(',');
        const csvRows = sortedData.map(beneficio => {
            return Object.values(beneficio).map(value => {
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
    
    // Inicialização da aplicação
    setupEventListeners();
});