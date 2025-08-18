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
        // e.preventDefault(); // Não é mais estritamente necessário, mas é boa prática
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
            // renderTable(allBeneficios); // A função que renderiza a tabela deve ser chamada aqui
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
                return alert("Nenhum dado para exportar.");
            }

            const headers = ["Beneficiário", "CPF", "Data", "Valor", "Benefício", "Quantidade", "Equipamento", "Técnico Responsável", "Status", "Observações", "Última Atualização"];
            
            const csvRows = data.map(row => {
                return [
                    `"${row.beneficiario || ''}"`, `"${row.cpf || ''}"`, `"${row.data || ''}"`, `"${row.valor || ''}"`, `"${row.beneficio || ''}"`, `"${row.quantidade || ''}"`, `"${row.equipamento || ''}"`, `"${row.responsavel || ''}"`, `"${row.status || ''}"`, `"${row.observacoes || ''}"`, `"${row.lastUpdated || ''}"`
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
    const gerarGraficoBeneficiosPorPeriodo = async () => { /* ...código da função... */ };
    const gerarGraficoBeneficiosPorEquipamento = async () => { /* ...código da função... */ };

    // INICIALIZAÇÃO DA PÁGINA
    const initPage = () => {
        const path = window.location.pathname.split("/").pop();
        if (path === 'login.html' || path === '') {
            // LÓGICA CORRIGIDA PARA A PÁGINA DE LOGIN
            document.getElementById('login-btn')?.addEventListener('click', handleLogin); // Escuta o clique no botão
            document.getElementById('signup-btn')?.addEventListener('click', showContactInfo);
        } else if (checkLoginStatus()) {
            // Lógica para a página principal (index.html)
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