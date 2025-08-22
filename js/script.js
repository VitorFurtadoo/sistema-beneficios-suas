/* js/script.js - Lógica da Aplicação Principal */
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado. Iniciando script.js...");

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
    const logsCollection = db.collection('logs');

    const showLoading = () => {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'flex';
    };
    const hideLoading = () => {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'none';
    };

    const logActivity = (userId, message, action, details = {}) => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const logData = {
            userId: userId,
            username: currentUser?.username || 'Usuário Desconhecido',
            userRole: currentUser?.role || 'user',
            message: message,
            action: action,
            details: details,
            ipAddress: 'N/A', // Placeholder - real IP would need server-side
            userAgent: navigator.userAgent.substring(0, 100), // Limitar tamanho
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            sessionId: currentUser?.sessionId || 'N/A'
        };
        
        logsCollection.add(logData)
            .then(() => console.log(`Log registrado: ${action} - ${message}`))
            .catch(error => console.error("Erro ao registrar log:", error));
    };

    const checkLoginStatus = (user) => {
        if (!user) {
            console.log("Usuário não logado. Redirecionando para login.html.");
            window.location.href = 'login.html';
            return false;
        }

        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
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
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            // Log de logout antes de remover dados
            logActivity(currentUser.id, `Usuário ${currentUser.username} fez logout do sistema`, 'user_logout');
        }
        
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
                if (sectionId === 'adminSection') {
                    renderUsersTable();
                    renderLogsTable();
                }
                
                // Log da navegação
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                if (currentUser) {
                    const sectionNames = {
                        'mainMenu': 'Menu Principal',
                        'cadastrarSection': 'Cadastrar Benefício',
                        'consultaSection': 'Consultar Benefícios',
                        'graficosSection': 'Gráficos',
                        'adminSection': 'Administração',
                        'editSection': 'Editar Benefício'
                    };
                    logActivity(currentUser.id, `Acessou a seção: ${sectionNames[sectionId] || sectionId}`, 'navigate_section', { section: sectionId });
                }
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
                <td class="table-actions">
                    <button class="edit-btn" data-id="${b.id}">Editar</button>
                    <button class="delete-btn" data-id="${b.id}">Excluir</button>
                </td>
            `;
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        showLoading();
        
        const valorInput = e.target.querySelector('input[name="valor"]');
        const quantidadeInput = e.target.querySelector('input[name="quantidade"]');
        if (parseFloat(valorInput.value) < 0 || parseInt(quantidadeInput.value) < 0) {
            alert('Valores não podem ser negativos!');
            hideLoading();
            return;
        }

        try {
            const formData = Object.fromEntries(new FormData(e.target).entries());
            formData.lastUpdated = new Date().toLocaleString('pt-BR');
            await beneficiosCollection.add(formData);
            alert('Benefício cadastrado!');
            e.target.reset();
            showSection('consultaSection');
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            logActivity(currentUser.id, `Cadastrou um novo benefício para ${formData.beneficiario}`, 'create_beneficio');
        } catch(error) {
            console.error("Erro ao cadastrar:", error);
            alert("Falha ao cadastrar benefício.");
        } finally { hideLoading(); }
    };

    const handleEditFormSubmit = async (e) => {
        e.preventDefault();
        showLoading();

        const valorInput = e.target.querySelector('input[name="valor"]');
        const quantidadeInput = e.target.querySelector('input[name="quantidade"]');
        if (parseFloat(valorInput.value) < 0 || parseInt(quantidadeInput.value) < 0) {
            alert('Valores não podem ser negativos!');
            hideLoading();
            return;
        }

        try {
            const docId = document.getElementById('editIndex').value;
            const updated = Object.fromEntries(new FormData(e.target).entries());
            updated.lastUpdated = new Date().toLocaleString('pt-BR');
            await beneficiosCollection.doc(docId).update(updated);
            alert('Registro atualizado!');
            showSection('consultaSection');
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            logActivity(currentUser.id, `Editou o benefício ${docId} de ${updated.beneficiario}`, 'edit_beneficio');
        } catch(error) {
            console.error("Erro ao atualizar:", error);
            alert("Falha ao atualizar registro.");
        } finally { hideLoading(); }
    };

    const renderUsersTable = async () => {
        console.log("Chamando renderUsersTable...");
        showLoading();
        try {
            const snapshot = await usersCollection.get();
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const tbody = document.querySelector('#usersTable tbody');
            
            if(!tbody) {
                console.error("Elemento tbody para a tabela de usuários não encontrado!");
                return;
            }

            tbody.innerHTML = '';
            
            if (users.length === 0) {
                console.log("Nenhum usuário encontrado no Firestore.");
                const row = tbody.insertRow();
                const cell = row.insertCell(0);
                cell.textContent = "Nenhum usuário encontrado.";
                cell.colSpan = 4;
            } else {
                console.log(`Encontrados ${users.length} usuários. Preenchendo tabela...`);
                users.forEach(u => {
                    const row = tbody.insertRow();
                    const statusDisplay = u.status || 'Não definido';
                    row.innerHTML = `
                        <td>${u.username}</td>
                        <td>${u.role}</td>
                        <td>${statusDisplay}</td>
                        <td class="table-actions"><button class="delete-user-btn" data-id="${u.id}">Excluir</button></td>
                    `;
                });
            }
        } catch(error) {
            console.error("Erro ao carregar usuários:", error);
            alert("Não foi possível carregar os usuários.");
        } finally { hideLoading(); }
    };
    
    const renderLogsTable = async () => {
        console.log("Chamando renderLogsTable...");
        showLoading();
        try {
            const snapshot = await logsCollection.orderBy('timestamp', 'desc').limit(100).get();
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const tbody = document.querySelector('#logsTable tbody');

            if (!tbody) {
                console.error("Elemento tbody para a tabela de logs não encontrado!");
                return;
            }

            tbody.innerHTML = '';

            if (logs.length === 0) {
                console.log("Nenhum log encontrado no Firestore.");
                const row = tbody.insertRow();
                const cell = row.insertCell(0);
                cell.textContent = "Nenhum log de atividade encontrado.";
                cell.colSpan = 6;
                cell.style.textAlign = 'center';
                cell.style.padding = '20px';
                cell.style.fontStyle = 'italic';
                cell.style.color = '#666';
            } else {
                console.log(`Encontrados ${logs.length} logs. Preenchendo tabela...`);
                logs.forEach(log => {
                    const row = tbody.insertRow();
                    const timestamp = log.timestamp ? log.timestamp.toDate().toLocaleString('pt-BR') : 'Data não disponível';
                    const username = log.username || 'Usuário Desconhecido';
                    const userRole = log.userRole || 'N/A';
                    const action = log.action || 'N/A';
                    const message = log.message || 'Sem descrição';
                    
                    // Definir cor baseada no tipo de ação
                    let actionClass = '';
                    if (action.includes('delete')) actionClass = 'action-delete';
                    else if (action.includes('create')) actionClass = 'action-create';
                    else if (action.includes('edit')) actionClass = 'action-edit';
                    else if (action.includes('login')) actionClass = 'action-login';
                    else if (action.includes('export')) actionClass = 'action-export';
                    
                    row.innerHTML = `
                        <td style="font-size: 0.9em;">${timestamp}</td>
                        <td><strong>${username}</strong> <span style="color: #666; font-size: 0.8em;">(${userRole})</span></td>
                        <td>${message}</td>
                        <td><span class="action-badge ${actionClass}">${action}</span></td>
                        <td style="font-size: 0.8em; color: #666;">${log.userId?.substring(0, 8) || 'N/A'}...</td>
                        <td style="font-size: 0.8em; color: #666;">${log.userAgent?.substring(0, 30) || 'N/A'}...</td>
                    `;
                });
            }
        } catch (error) {
            console.error("Erro ao carregar logs:", error);
            // Silencioso - não mostrar alert para não incomodar o usuário
            const tbody = document.querySelector('#logsTable tbody');
            if (tbody) {
                tbody.innerHTML = '';
                const row = tbody.insertRow();
                const cell = row.insertCell(0);
                cell.textContent = "Erro ao carregar logs. Tente novamente mais tarde.";
                cell.colSpan = 6;
                cell.style.textAlign = 'center';
                cell.style.padding = '20px';
                cell.style.fontStyle = 'italic';
                cell.style.color = '#999';
            }
        } finally {
            hideLoading();
        }
    };


    const handleDeleteBeneficio = async (id) => {
        if (!confirm("Tem certeza que deseja excluir este benefício?")) return;
        showLoading();
        try {
            const benefDoc = await beneficiosCollection.doc(id).get();
            const benefData = benefDoc.data();
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            await beneficiosCollection.doc(id).delete();
            alert("Benefício excluído com sucesso!");
            logActivity(currentUser.id, `Excluiu o benefício ${id} de ${benefData.beneficiario}`, 'delete_beneficio');
            fetchBeneficios();
        } catch (error) {
            console.error("Erro ao excluir benefício:", error);
            alert("Não foi possível excluir o benefício.");
        } finally {
            hideLoading();
        }
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
        } else if (e.target.classList.contains('delete-btn')) {
             handleDeleteBeneficio(id);
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
                logActivity(currentUser.id, `Excluiu o usuário ${id}`, 'delete_user');
                renderUsersTable();
            } catch(error) {
                console.error(error);
                alert("Erro ao excluir usuário.");
            }
        }
    });

    const exportToExcel = () => {
        const table = document.getElementById('beneficiosTable');
        const tbody = table?.querySelector('tbody');
        
        if (!table || !tbody) {
            alert("Nenhuma tabela encontrada para exportar.");
            return;
        }

        const rows = tbody.querySelectorAll('tr');
        if (rows.length === 0) {
            alert("Nenhum dado encontrado para exportar. Aplique os filtros ou carregue os dados primeiro.");
            return;
        }

        // Criar HTML com estilos para Excel
        let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:x="urn:schemas-microsoft-com:office:excel" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <style>
                .header { 
                    background-color: #38a169; 
                    color: white; 
                    font-weight: bold; 
                    text-align: center;
                    border: 1px solid #2d3748;
                    padding: 8px;
                }
                .data-cell { 
                    border: 1px solid #e2e8f0; 
                    padding: 6px;
                    text-align: left;
                }
                .status-cedido { 
                    background-color: #c6f6d5; 
                    color: #22543d;
                }
                .status-pendente { 
                    background-color: #fef2e2; 
                    color: #744210;
                }
                .status-negado { 
                    background-color: #fed7d7; 
                    color: #742a2a;
                }
                .valor-cell {
                    text-align: right;
                    background-color: #f7fafc;
                }
                .data-cell-alt {
                    background-color: #f8f9fa;
                }
                table {
                    border-collapse: collapse;
                    width: 100%;
                    font-family: Arial, sans-serif;
                    font-size: 11px;
                }
                .title {
                    background-color: #2d3748;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    text-align: center;
                    padding: 12px;
                    border: 1px solid #1a202c;
                }
            </style>
        </head>
        <body>
            <table>
                <tr>
                    <td colspan="11" class="title">
                        SEMDES - Sistema de Benefícios Eventuais - Relatório Exportado em ${new Date().toLocaleDateString('pt-BR')}
                    </td>
                </tr>
                <tr>
                    <td class="header">Beneficiário</td>
                    <td class="header">CPF</td>
                    <td class="header">Data</td>
                    <td class="header">Valor (R$)</td>
                    <td class="header">Benefício</td>
                    <td class="header">Quantidade</td>
                    <td class="header">Equipamento</td>
                    <td class="header">Responsável</td>
                    <td class="header">Status</td>
                    <td class="header">Observações</td>
                    <td class="header">Última Atualização</td>
                </tr>`;

        // Processar dados das linhas visíveis
        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');
            const isEvenRow = rowIndex % 2 === 0;
            
            htmlContent += '<tr>';
            
            // Processar cada célula (exceto a última que é "Ações")
            for (let i = 0; i < cells.length - 1; i++) {
                let cellText = cells[i].textContent.trim();
                let cellClass = isEvenRow ? 'data-cell' : 'data-cell data-cell-alt';
                
                // Aplicar estilos especiais baseados no conteúdo
                if (i === 3) { // Coluna de valor
                    cellClass += ' valor-cell';
                    if (cellText.startsWith('R$')) {
                        cellText = cellText.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
                    }
                } else if (i === 8) { // Coluna de status
                    const status = cellText.toLowerCase();
                    if (status === 'cedido') cellClass += ' status-cedido';
                    else if (status === 'pendente') cellClass += ' status-pendente';
                    else if (status === 'negado') cellClass += ' status-negado';
                }
                
                htmlContent += `<td class="${cellClass}">${cellText}</td>`;
            }
            
            htmlContent += '</tr>';
        });

        htmlContent += `
            </table>
            <br>
            <p style="font-size: 10px; color: #666; font-style: italic;">
                Total de registros: ${rows.length} | 
                Gerado em: ${new Date().toLocaleString('pt-BR')} | 
                Sistema de Benefícios Eventuais - SEMDES Paragominas
            </p>
            <p style="font-size: 9px; color: #888; font-style: italic; margin-top: 5px;">
                © 2025 Desenvolvido por Vitor Furtado | Vigilância SUAS Paragominas | Todos os direitos reservados
            </p>
        </body>
        </html>`;

        // Criar e fazer download do arquivo
        const blob = new Blob([htmlContent], { 
            type: 'application/vnd.ms-excel;charset=utf-8;' 
        });
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        
        // Nome do arquivo com data atual
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
        const timeStr = now.toLocaleTimeString('pt-BR').replace(/:/g, '-');
        link.download = `beneficios_eventuais_${dateStr}_${timeStr}.xls`;
        
        // Executar download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpeza
        URL.revokeObjectURL(url);
        
        console.log(`Arquivo Excel exportado: ${rows.length} registros`);
        
        // Log da exportação
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        logActivity(currentUser.id, `Exportou ${rows.length} registros para Excel`, 'export_excel', { recordCount: rows.length });
    };

    const exportButton = document.getElementById('btn-exportar-csv');
    if (exportButton) {
        exportButton.addEventListener('click', exportToExcel);
    }

    let chartPeriodo = null;
    let chartEquipamento = null;
    
    const benefitColors = {
        'Auxilio Natalidade (Kit Enxoval)': 'rgba(56, 161, 105, 0.8)',
        'Auxilio Alimentação (Cesta Básica)': 'rgba(74, 85, 104, 0.8)',
        'Auxilio Funeral': 'rgba(102, 126, 234, 0.8)',
        'Auxilio Transporte (Passagens)': 'rgba(246, 173, 85, 0.8)',
        'Alugel Social': 'rgba(229, 62, 62, 0.8)'
    };
    const allBenefits = Object.keys(benefitColors);
    
    const gerarGraficoBeneficiosPorPeriodo = async () => {
        showLoading();
        try {
            const filtroDataStart = document.getElementById('grafico-data-start').value;
            const filtroDataEnd = document.getElementById('grafico-data-end').value;
            const filtroPeriodo = document.getElementById('grafico-periodo-filtro').value;
            const filtroStatus = document.getElementById('grafico-status-filtro').value;
            const filtroBeneficio = document.getElementById('grafico-beneficio-filtro').value;
            
            let query = beneficiosCollection;
            if (filtroStatus !== 'Todos') {
                query = query.where('status', '==', filtroStatus);
            }
            if (filtroDataStart) {
                query = query.where('data', '>=', filtroDataStart);
            }
            if (filtroDataEnd) {
                query = query.where('data', '<=', filtroDataEnd);
            }
            
            const snapshot = await query.get();
            let allBeneficios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            let quantidadeTotal = 0;
            if (filtroStatus === 'Cedido' || filtroStatus === 'Todos') {
                quantidadeTotal = allBeneficios
                    .filter(b => b.status === 'Cedido')
                    .reduce((sum, b) => sum + (b.quantidade || 0), 0);
            }

            const dataAgrupada = {};
            
            allBeneficios.forEach(item => {
                let periodo;
                if (filtroPeriodo === 'trimestral') {
                    const mes = new Date(item.data + 'T03:00:00').getMonth();
                    periodo = `${new Date(item.data + 'T03:00:00').getFullYear()}-${Math.floor(mes / 3) + 1}º Trimestre`;
                } else if (filtroPeriodo === 'semestral') {
                    const mes = new Date(item.data + 'T03:00:00').getMonth();
                    periodo = `${new Date(item.data + 'T03:00:00').getFullYear()}-${Math.floor(mes / 6) + 1}º Semestre`;
                } else if (filtroPeriodo === 'anual') {
                    periodo = new Date(item.data + 'T03:00:00').getFullYear().toString();
                } else {
                    periodo = item.data.substring(0, 7);
                }

                if (!dataAgrupada[periodo]) {
                    dataAgrupada[periodo] = {};
                }
                dataAgrupada[periodo][item.beneficio] = (dataAgrupada[periodo][item.beneficio] || 0) + (item.quantidade || 1);
                
            });
            
            const labelsOrdenadas = Object.keys(dataAgrupada).sort();

            const datasets = [];
            const beneficiosParaGrafico = filtroBeneficio === 'Todos' ? allBenefits : [filtroBeneficio];
            
            beneficiosParaGrafico.forEach(beneficio => {
                const data = labelsOrdenadas.map(periodo => dataAgrupada[periodo]?.[beneficio] || 0);
                datasets.push({
                    label: beneficio,
                    data: data,
                    backgroundColor: benefitColors[beneficio] || 'gray',
                    borderColor: benefitColors[beneficio] || 'gray',
                    borderWidth: 1
                });
            });

            document.getElementById('total-valor-grafico').textContent = `Quantidade Total de Benefícios Cedidos: ${quantidadeTotal}`;

            const ctx = document.getElementById('grafico-periodo').getContext('2d');
            if (chartPeriodo) {
                chartPeriodo.destroy();
            }
            chartPeriodo = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labelsOrdenadas,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    backgroundColor: 'white',
                    scales: {
                        x: { stacked: true },
                        y: { 
                            stacked: true,
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Quantidade'
                            }
                        }
                    }
                }
            });

            let legendaHtml = `<p>O gráfico de barras mostra a contagem de cada benefício por período, filtrados por status **'${filtroStatus}'**.</p>`;
            document.getElementById('legenda-periodo').innerHTML = legendaHtml;

        } catch (error) {
            console.error("Erro ao gerar gráfico por período:", error);
            alert("Não foi possível gerar o gráfico por período.");
        } finally {
            hideLoading();
        }
    };
    
    const gerarGraficoBeneficiosPorEquipamento = async () => {
        showLoading();
        try {
            const filtroStatus = document.getElementById('grafico-equipamento-status-filtro').value;

            let query = beneficiosCollection;
            if (filtroStatus !== 'Todos') {
                query = query.where('status', '==', filtroStatus);
            }

            const snapshot = await query.get();
            const allBeneficios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const dataPorEquipamento = allBeneficios.reduce((acc, item) => {
                const equipamento = item.equipamento || 'Não especificado';
                acc[equipamento] = (acc[equipamento] || 0) + 1;
                return acc;
            }, {});

            const labels = Object.keys(dataPorEquipamento);
            const data = labels.map(label => dataPorEquipamento[label]);
            
            const backgroundColors = [
                'rgba(56, 161, 105, 0.8)',
                'rgba(74, 85, 104, 0.8)',
                'rgba(102, 126, 234, 0.8)',
                'rgba(246, 173, 85, 0.8)',
                'rgba(229, 62, 62, 0.8)',
                'rgba(49, 130, 206, 0.8)'
            ];

            const ctx = document.getElementById('grafico-equipamento').getContext('2d');
            if (chartEquipamento) {
                chartEquipamento.destroy();
            }
            chartEquipamento = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors
                    }]
                },
                options: {
                    responsive: true,
                    backgroundColor: 'white',
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                    }
                }
            });

            let legendaHtml = `<p>O gráfico de pizza mostra a distribuição dos benefícios por equipamento, filtrado por status **'${filtroStatus}'**.</p><div class="legend-items">`;
            labels.forEach((label, index) => {
                legendaHtml += `<div class="legend-item">
                                <span class="legend-color" style="background-color:${backgroundColors[index % backgroundColors.length]};"></span>
                                <span>${label}</span>
                            </div>`;
            });
            legendaHtml += `</div>`;
            document.getElementById('legenda-equipamento').innerHTML = legendaHtml;


        } catch (error) {
            console.error("Erro ao gerar gráfico por equipamento:", error);
            alert("Não foi possível gerar o gráfico por equipamento.");
        } finally {
            hideLoading();
        }
    };

    const salvarGraficoComoImagem = (canvasId, titulo) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas com ID não encontrado:', canvasId);
            return;
        }
        
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${titulo}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const applyConsultaFilters = async () => {
        showLoading();
        try {
            const snapshot = await beneficiosCollection.orderBy('data', 'desc').get();
            let allBeneficios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const dataStart = document.getElementById('filter-data-start').value;
            const dataEnd = document.getElementById('filter-data-end').value;
            const status = document.getElementById('filter-status').value;
            const equipamento = document.getElementById('filter-equipamento').value;
            const beneficio = document.getElementById('filter-beneficio').value;

            const filterDetails = {
                dataStart: dataStart || 'Não informado',
                dataEnd: dataEnd || 'Não informado',
                status: status || 'Todos',
                equipamento: equipamento || 'Todos',
                beneficio: beneficio || 'Todos'
            };

            let filteredBeneficios = allBeneficios;

            if (dataStart) {
                filteredBeneficios = filteredBeneficios.filter(b => b.data >= dataStart);
            }

            if (dataEnd) {
                filteredBeneficios = filteredBeneficios.filter(b => b.data <= dataEnd);
            }

            if (status) {
                filteredBeneficios = filteredBeneficios.filter(b => b.status === status);
            }

            if (equipamento) {
                filteredBeneficios = filteredBeneficios.filter(b => b.equipamento === equipamento);
            }

            if (beneficio) {
                filteredBeneficios = filteredBeneficios.filter(b => b.beneficio === beneficio);
            }

            renderTable(filteredBeneficios);
            
            // Log da aplicação de filtros
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            logActivity(currentUser.id, `Aplicou filtros na consulta: ${filteredBeneficios.length} registros encontrados`, 'apply_filters', filterDetails);
            
        } catch (error) {
            console.error("Erro ao aplicar filtros:", error);
            alert("Não foi possível aplicar os filtros.");
        } finally {
            hideLoading();
        }
    };

    const clearConsultaFilters = () => {
        document.getElementById('filter-data-start').value = '';
        document.getElementById('filter-data-end').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-equipamento').value = '';
        document.getElementById('filter-beneficio').value = '';
        fetchBeneficios();
    };

    const applyLogsFilter = async () => {
        showLoading();
        try {
            let query = logsCollection.orderBy('timestamp', 'desc');
            
            const dateStart = document.getElementById('logs-date-start').value;
            const dateEnd = document.getElementById('logs-date-end').value;
            const actionFilter = document.getElementById('logs-action-filter').value;
            
            if (dateStart) {
                const startTimestamp = firebase.firestore.Timestamp.fromDate(new Date(dateStart + 'T00:00:00'));
                query = query.where('timestamp', '>=', startTimestamp);
            }
            
            if (dateEnd) {
                const endTimestamp = firebase.firestore.Timestamp.fromDate(new Date(dateEnd + 'T23:59:59'));
                query = query.where('timestamp', '<=', endTimestamp);
            }
            
            if (actionFilter) {
                query = query.where('action', '==', actionFilter);
            }
            
            const snapshot = await query.limit(100).get();
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            renderFilteredLogs(logs);
            
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            logActivity(currentUser.id, `Aplicou filtros nos logs: ${logs.length} registros encontrados`, 'filter_logs');
            
        } catch (error) {
            console.error("Erro ao filtrar logs:", error);
            // Silencioso - apenas log no console
            const tbody = document.querySelector('#logsTable tbody');
            if (tbody) {
                tbody.innerHTML = '';
                const row = tbody.insertRow();
                const cell = row.insertCell(0);
                cell.textContent = "Erro ao filtrar logs. Verifique os filtros e tente novamente.";
                cell.colSpan = 6;
                cell.style.textAlign = 'center';
                cell.style.padding = '20px';
                cell.style.fontStyle = 'italic';
                cell.style.color = '#999';
            }
        } finally {
            hideLoading();
        }
    };

    const clearLogsFilter = () => {
        document.getElementById('logs-date-start').value = '';
        document.getElementById('logs-date-end').value = '';
        document.getElementById('logs-action-filter').value = '';
        renderLogsTable();
    };

    const clearOldLogs = async () => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser.role !== 'admin') {
            alert('Apenas administradores podem limpar logs antigos.');
            return;
        }
        
        if (!confirm('Tem certeza que deseja excluir logs com mais de 30 dias? Esta ação não pode ser desfeita.')) {
            return;
        }
        
        showLoading();
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const cutoffTimestamp = firebase.firestore.Timestamp.fromDate(thirtyDaysAgo);
            
            const snapshot = await logsCollection.where('timestamp', '<', cutoffTimestamp).get();
            
            if (snapshot.empty) {
                alert('Nenhum log antigo encontrado para exclusão.');
                return;
            }
            
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            alert(`${snapshot.docs.length} logs antigos foram excluídos com sucesso.`);
            
            logActivity(currentUser.id, `Excluiu ${snapshot.docs.length} logs antigos (mais de 30 dias)`, 'clear_old_logs');
            renderLogsTable();
            
        } catch (error) {
            console.error("Erro ao limpar logs antigos:", error);
            alert("Não foi possível limpar os logs antigos.");
        } finally {
            hideLoading();
        }
    };

    const renderFilteredLogs = (logs) => {
        const tbody = document.querySelector('#logsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (logs.length === 0) {
            const row = tbody.insertRow();
            const cell = row.insertCell(0);
            cell.textContent = "Nenhum log encontrado com os filtros aplicados.";
            cell.colSpan = 6;
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
            cell.style.fontStyle = 'italic';
            cell.style.color = '#666';
        } else {
            logs.forEach(log => {
                const row = tbody.insertRow();
                const timestamp = log.timestamp ? log.timestamp.toDate().toLocaleString('pt-BR') : 'Data não disponível';
                const username = log.username || 'Usuário Desconhecido';
                const userRole = log.userRole || 'N/A';
                const action = log.action || 'N/A';
                const message = log.message || 'Sem descrição';
                
                let actionClass = '';
                if (action.includes('delete')) actionClass = 'action-delete';
                else if (action.includes('create')) actionClass = 'action-create';
                else if (action.includes('edit')) actionClass = 'action-edit';
                else if (action.includes('login')) actionClass = 'action-login';
                else if (action.includes('export')) actionClass = 'action-export';
                
                row.innerHTML = `
                    <td style="font-size: 0.9em;">${timestamp}</td>
                    <td><strong>${username}</strong> <span style="color: #666; font-size: 0.8em;">(${userRole})</span></td>
                    <td>${message}</td>
                    <td><span class="action-badge ${actionClass}">${action}</span></td>
                    <td style="font-size: 0.8em; color: #666;">${log.userId?.substring(0, 8) || 'N/A'}...</td>
                    <td style="font-size: 0.8em; color: #666;">${log.userAgent?.substring(0, 30) || 'N/A'}...</td>
                `;
            });
        }
    };

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("Usuário autenticado. Verificando dados...");
            db.collection('users').doc(user.uid).get().then(userDoc => {
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    localStorage.setItem('currentUser', JSON.stringify({ id: user.uid, ...userData, sessionId: Date.now().toString() }));
                    console.log("Dados do usuário sincronizados. Inicializando a aplicação...");
                    
                    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                    const welcomeMessage = document.getElementById('welcome-message');
                    if (welcomeMessage) welcomeMessage.textContent = `Bem-vindo(a), ${currentUser.username}!`;
                    
                    // Log de login
                    logActivity(currentUser.id, `Usuário ${currentUser.username} fez login no sistema`, 'user_login', { userRole: currentUser.role });

                    const adminButton = document.getElementById('adminMenuButton');
                    if (adminButton && currentUser.role === 'admin') adminButton.style.display = 'flex';
                    
                    const logsButton = document.getElementById('logsMenuButton');
                    if (logsButton && currentUser.role === 'admin') logsButton.style.display = 'flex';

                    document.querySelectorAll('.menu-btn').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));
                    document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));
                    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
                    document.getElementById('beneficioForm')?.addEventListener('submit', handleFormSubmit);
                    document.getElementById('editForm')?.addEventListener('submit', handleEditFormSubmit);

                    document.getElementById('gerar-grafico-periodo')?.addEventListener('click', gerarGraficoBeneficiosPorPeriodo);
                    document.getElementById('gerar-grafico-equipamento')?.addEventListener('click', gerarGraficoBeneficiosPorEquipamento);
                    document.getElementById('salvar-imagem-periodo')?.addEventListener('click', () => salvarGraficoComoImagem('grafico-periodo', 'Benefícios-por-Período'));
                    document.getElementById('salvar-imagem-equipamento')?.addEventListener('click', () => salvarGraficoComoImagem('grafico-equipamento', 'Benefícios-por-Equipamento'));

                    document.getElementById('grafico-periodo-filtro')?.addEventListener('change', gerarGraficoBeneficiosPorPeriodo);
                    document.getElementById('grafico-status-filtro')?.addEventListener('change', gerarGraficoBeneficiosPorPeriodo);
                    
                    document.getElementById('grafico-beneficio-filtro')?.addEventListener('change', gerarGraficoBeneficiosPorPeriodo);
                    
                    document.getElementById('grafico-equipamento-status-filtro')?.addEventListener('change', gerarGraficoBeneficiosPorEquipamento);

                    document.getElementById('apply-filters-btn')?.addEventListener('click', applyConsultaFilters);
                    document.getElementById('clear-filters-btn')?.addEventListener('click', clearConsultaFilters);
                    
                    // Event listeners para filtros de logs
                    document.getElementById('apply-logs-filter-btn')?.addEventListener('click', applyLogsFilter);
                    document.getElementById('clear-logs-filter-btn')?.addEventListener('click', clearLogsFilter);
                    document.getElementById('clear-old-logs-btn')?.addEventListener('click', clearOldLogs);

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
            console.log("Nenhum usuário logado. Redirecionando.");
            window.location.href = 'login.html';
        }
    });
});