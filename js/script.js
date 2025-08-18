/* CÓDIGO COMPLETO COMEÇA AQUI */
document.addEventListener('DOMContentLoaded', () => {
    // IMPORTA AS BIBLIOTECAS GLOBAIS
    const { jsPDF } = window.jspdf;

    // CONFIGURAÇÃO DO FIREBASE
    // **IMPORTANTE**: Substitua pelos seus dados reais do Firebase
    const firebaseConfig = {
        apiKey: "SUA_API_KEY",
        authDomain: "SEU_AUTH_DOMAIN.firebaseapp.com",
        projectId: "SEU_PROJECT_ID",
        storageBucket: "SEU_STORAGE_BUCKET.appspot.com",
        messagingSenderId: "SEU_SENDER_ID",
        appId: "SEU_APP_ID"
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

    // DECLARAÇÃO DE VARIÁVEIS DE ELEMENTOS DO DOM
    let salvarPdfPeriodoBtn, salvarPdfEquipamentoBtn, graficoPeriodoChart, graficoEquipamentoChart;

    // FUNÇÕES DE LOGIN E AUTENTICAÇÃO
    const handleLogin = async (e) => {
        e.preventDefault();
        showLoading();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        try {
            const userSnapshot = await usersCollection.where('username', '==', username).where('password', '==', password).get();
            if (!userSnapshot.empty) {
                const user = { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() };
                if (user.active) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
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
    };

    const checkLoginStatus = () => {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
            window.location.href = 'login.html';
            return false;
        }
        const currentUser = JSON.parse(userStr);
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Bem-vindo(a), ${currentUser.username}!`;
        }
        const adminButton = document.getElementById('adminMenuButton');
        if (adminButton && currentUser.role === 'admin') {
            adminButton.style.display = 'flex';
        }
        return true;
    };

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    };

    const showContactInfo = () => {
        alert('Para cadastrar um novo login, entre em contato com o administrador.');
    };

    // FUNÇÕES DE NAVEGAÇÃO E VISIBILIDADE
    const showSection = (sectionId) => {
        document.querySelectorAll('.section, .main-menu-section').forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            if (sectionId === 'consultaSection') fetchBeneficios();
        }
    };

    // FUNÇÕES CRUD (EXEMPLO)
    const fetchBeneficios = async () => {
        showLoading();
        try {
            const snapshot = await beneficiosCollection.get();
            const allBeneficios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Aqui você chamaria a função que renderiza a tabela, por exemplo:
            // renderTable(allBeneficios); 
        } catch (error) {
            console.error("Erro ao buscar benefícios:", error);
            alert("Não foi possível carregar os dados.");
        } finally {
            hideLoading();
        }
    };
    
    // FUNÇÕES DE EXPORTAÇÃO E GERAÇÃO DE PDF
    const exportarCSV = async () => {
        showLoading();
        try {
            const snapshot = await beneficiosCollection.get();
            const data = snapshot.docs.map(doc => doc.data());
            if (data.length === 0) {
                alert("Nenhum dado para exportar.");
                return;
            }

            const headers = ["Beneficiário", "CPF", "Data", "Valor", "Benefício", "Quantidade", "Equipamento", "Técnico Responsável", "Status", "Observações", "Última Atualização"];
            
            const csvRows = data.map(row => {
                return [
                    `"${row.beneficiario || ''}"`,
                    `"${row.cpf || ''}"`,
                    `"${row.data || ''}"`,
                    `"${row.valor || ''}"`,
                    `"${row.beneficio || ''}"`,
                    `"${row.quantidade || ''}"`,
                    `"${row.equipamento || ''}"`,
                    `"${row.responsavel || ''}"`,
                    `"${row.status || ''}"`,
                    `"${row.observacoes || ''}"`,
                    `"${row.lastUpdated || ''}"`
                ].join(',');
            });

            const csvContent = [headers.join(','), ...csvRows].join('\n');
            const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'relatorio_beneficios.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Erro ao exportar CSV:", error);
            alert("Falha ao exportar CSV.");
        } finally {
            hideLoading();
        }
    };

    const salvarGraficoComoPDF = (containerId, titulo) => {
        showLoading();
        const graficoContainer = document.getElementById(containerId);
        const logo = new Image();
        logo.src = 'logo_semdes.png';

        logo.onload = () => {
            html2canvas(graficoContainer, { scale: 2 }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const doc = new jsPDF('p', 'mm', 'a4');
                const pageWidth = doc.internal.pageSize.getWidth();
                
                const logoWidth = 40;
                const logoHeight = (logo.height * logoWidth) / logo.width;
                doc.addImage(logo, 'PNG', 15, 15, logoWidth, logoHeight);

                doc.setFontSize(18);
                doc.setTextColor('#2e8b57');
                doc.text(titulo, pageWidth / 2, 25, { align: 'center' });

                const dataAtual = new Date().toLocaleString('pt-BR');
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(`Relatório gerado em: ${dataAtual}`, pageWidth / 2, 35, { align: 'center' });

                const imgWidth = pageWidth - 30;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                doc.addImage(imgData, 'PNG', 15, 50, imgWidth, imgHeight);

                doc.save(`${titulo.replace(/ /g, '_').toLowerCase()}.pdf`);
            }).catch(err => {
                console.error("Erro no html2canvas:", err);
                alert("Falha ao gerar o PDF.");
            }).finally(() => {
                hideLoading();
            });
        };

        logo.onerror = () => {
            alert("Logo não encontrada! Verifique se 'logo_semdes.png' está na pasta raiz do projeto.");
            hideLoading();
        };
    };

    // FUNÇÕES DE GRÁFICOS
    const gerarGraficoBeneficiosPorPeriodo = async () => {
        showLoading();
        try {
            const snapshot = await beneficiosCollection.get();
            const beneficios = snapshot.docs.map(doc => doc.data());
            const periodo = document.getElementById('periodo-grafico').value;
            const tipoGrafico = document.getElementById('tipo-grafico-periodo').value;
            
            const dadosAgrupados = beneficios.reduce((acc, ben) => {
                if (!ben.data) return acc;
                const data = new Date(ben.data);
                if (isNaN(data.getTime())) return acc;
                let chave;
                if (periodo === 'mes') chave = `${data.getFullYear()}/${String(data.getMonth() + 1).padStart(2, '0')}`;
                else if (periodo === 'ano') chave = data.getFullYear().toString();
                else {
                    const trimestre = Math.floor(data.getMonth() / 3) + 1;
                    chave = `${data.getFullYear()}/T${trimestre}`;
                }
                acc[chave] = (acc[chave] || 0) + 1;
                return acc;
            }, {});

            if (graficoPeriodoChart) graficoPeriodoChart.destroy();
            const ctx = document.getElementById('grafico-periodo').getContext('2d');
            graficoPeriodoChart = new Chart(ctx, {
                type: tipoGrafico,
                data: {
                    labels: Object.keys(dadosAgrupados).sort(),
                    datasets: [{ label: 'Qtd. de Benefícios', data: Object.values(dadosAgrupados), backgroundColor: '#2e8b57' }]
                }
            });
            salvarPdfPeriodoBtn.style.display = 'inline-block';
        } catch (error) {
            console.error("Erro ao gerar gráfico por período:", error);
        } finally {
            hideLoading();
        }
    };
    
    const gerarGraficoBeneficiosPorEquipamento = async () => {
        showLoading();
        try {
            const snapshot = await beneficiosCollection.get();
            const beneficios = snapshot.docs.map(doc => doc.data());
            const tipoGrafico = document.getElementById('tipo-grafico-equipamento').value;
            
            const dadosAgrupados = beneficios.reduce((acc, ben) => {
                const equipamento = ben.equipamento || 'Não especificado';
                acc[equipamento] = (acc[equipamento] || 0) + 1;
                return acc;
            }, {});

            if (graficoEquipamentoChart) graficoEquipamentoChart.destroy();
            const ctx = document.getElementById('grafico-equipamento').getContext('2d');
            graficoEquipamentoChart = new Chart(ctx, {
                type: tipoGrafico,
                data: {
                    labels: Object.keys(dadosAgrupados),
                    datasets: [{
                        label: 'Qtd. por Equipamento',
                        data: Object.values(dadosAgrupados),
                        backgroundColor: ['#28a745', '#17a2b8', '#ffc107', '#6c757d', '#fd7e14', '#dc3545', '#0d6efd']
                    }]
                }
            });
            salvarPdfEquipamentoBtn.style.display = 'inline-block';
        } catch (error) {
            console.error("Erro ao gerar gráfico por equipamento:", error);
        } finally {
            hideLoading();
        }
    };

    // INICIALIZAÇÃO DA PÁGINA
    const initPage = () => {
        const path = window.location.pathname.split("/").pop();
        if (path === 'login.html' || path === '') {
            document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
            document.getElementById('signup-btn')?.addEventListener('click', showContactInfo);
        } else if (checkLoginStatus()) {
            document.querySelectorAll('.menu-btn').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));
            document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));
            document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
            document.getElementById('btn-exportar-csv')?.addEventListener('click', exportarCSV);
            
            salvarPdfPeriodoBtn = document.getElementById('salvar-pdf-periodo');
            salvarPdfEquipamentoBtn = document.getElementById('salvar-pdf-equipamento');

            document.getElementById('gerar-grafico-periodo')?.addEventListener('click', gerarGraficoBeneficiosPorPeriodo);
            document.getElementById('gerar-grafico-equipamento')?.addEventListener('click', gerarGraficoBeneficiosPorEquipamento);
            
            salvarPdfPeriodoBtn?.addEventListener('click', () => salvarGraficoComoPDF('grafico-periodo-container', 'Relatório de Benefícios por Período'));
            salvarPdfEquipamentoBtn?.addEventListener('click', () => salvarGraficoComoPDF('grafico-equipamento-container', 'Relatório de Benefícios por Equipamento'));
        }
    };

    initPage();
});
/* FIM DO CÓDIGO COMPLETO */