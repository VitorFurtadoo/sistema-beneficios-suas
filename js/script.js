/* js/script.js - Lógica da Aplicação Principal (Exportar CSV desativado) */
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
                const statusDisplay = u.status || 'Não definido';
                row.innerHTML = `
                    <td>${u.username}</td>
                    <td>${u.role}</td>
                    <td>${statusDisplay}</td>
                    <td class="table-actions"><button class="delete-user-btn" data-id="${u.id}">Excluir</button></td>
                `;
            });
        } catch(error) {
            console.error("Erro ao carregar usuários:", error);
        } finally { hideLoading(); }
    };

    const handleDeleteBeneficio = async (id) => {
        if (!confirm("Tem certeza que deseja excluir este benefício?")) return;
        showLoading();
        try {
            await beneficiosCollection.doc(id).delete();
            alert("Benefício excluído com sucesso!");
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
                renderUsersTable();
            } catch(error) {
                console.error(error);
                alert("Erro ao excluir usuário.");
            }
        }
    });

    // Função placeholder para o botão desativado
    const handleExportDisabled = () => {
        alert("A funcionalidade de exportação de planilha está em desenvolvimento.");
    };
    document.getElementById('btn-exportar-csv')?.addEventListener('click', handleExportDisabled);

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

    auth.onAuthStateChanged(user => {
        if (user) {
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