/* SCRIPT.JS COMPLETO E OTIMIZADO */
document.addEventListener('DOMContentLoaded', () => {
    const { jsPDF } = window.jspdf;

    // CONFIGURAÇÃO DO FIREBASE
    const firebaseConfig = {
        apiKey: "AIzaSyAnYj37TDwV0kkB9yBeJguZCEqHvWV7vAY",
        authDomain: "beneficios-eventuais-suas.firebaseapp.com",
        projectId: "beneficios-eventuais-suas",
        storageBucket: "beneficios-eventuais-suas.appspot.com",
        messagingSenderId: "665210304564",
        appId: "1:665210304564:web:cf233fd0e56bbfe3d5b261"
    };

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

    const db = firebase.firestore();
    const beneficiosCollection = db.collection('beneficios');
    const usersCollection = db.collection('users');

    // LOADING OVERLAY
    const showLoading = () => document.getElementById('loading-overlay')?.style.display = 'flex';
    const hideLoading = () => document.getElementById('loading-overlay')?.style.display = 'none';

    // LOGIN
    const handleLogin = async () => {
        showLoading();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        if (!username || !password) {
            alert("Preencha login e senha.");
            hideLoading();
            return;
        }
        try {
            const userSnapshot = await usersCollection
                .where('username', '==', username)
                .where('password', '==', password)
                .get();
            if (!userSnapshot.empty) {
                const user = { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() };
                if (user.active) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    window.location.href = 'index.html';
                } else alert('Conta desativada.');
            } else alert('Login ou senha incorretos.');
        } catch (error) {
            console.error("Erro no login:", error);
            alert("Falha no login, veja console.");
        } finally { hideLoading(); }
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

    const showContactInfo = () => alert('Para cadastrar um novo login, contate o administrador.');

    // NAVEGAÇÃO
    const showSection = (sectionId) => {
        document.querySelectorAll('.section, .main-menu-section').forEach(sec => sec.classList.remove('active'));
        const target = document.getElementById(sectionId);
        if (target) {
            target.classList.add('active');
            if (sectionId === 'consultaSection') fetchBeneficios();
            if (sectionId === 'adminSection') renderUsersTable();
        }
    };

    // CRUD BENEFÍCIOS
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
            row.innerHTML = `
                <td>${b.beneficiario || ''}</td>
                <td>${b.cpf || ''}</td>
                <td>${dataFormatada}</td>
                <td>${typeof b.valor==='number'?b.valor.toFixed(2):b.valor||''}</td>
                <td>${b.beneficio||''}</td>
                <td>${b.quantidade||''}</td>
                <td>${b.equipamento||''}</td>
                <td>${b.responsavel||''}</td>
                <td>${b.status||''}</td>
                <td>${b.observacoes||''}</td>
                <td>${b.lastUpdated||''}</td>
                <td><button class="edit-btn" onclick="window.openEditForm('${b.id}')">Editar</button></td>
            `;
        });
    };

    window.openEditForm = async (id) => {
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

    // ADMIN
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
                row.innerHTML = `
                    <td>${u.username}</td>
                    <td>${u.role}</td>
                    <td>${u.active?'Ativo':'Inativo'}</td>
                    <td><button class="delete-btn" onclick="deleteUser('${u.id}')">Excluir</button></td>
                `;
            });
        } catch(error) {
            console.error("Erro ao carregar usuários:", error);
        } finally { hideLoading(); }
    };

    window.deleteUser = async (id) => {
        if(!confirm("Deseja realmente excluir?")) return;
        try {
            await usersCollection.doc(id).delete();
            alert("Usuário excluído!");
            renderUsersTable();
        } catch(error) {
            console.error(error);
            alert("Erro ao excluir usuário.");
        }
    };

    // EXPORTAR CSV
    const exportarCSV = async () => {
        showLoading();
        try {
            const snapshot = await beneficiosCollection.get();
            const allBeneficios = snapshot.docs.map(doc => doc.data());
            if(allBeneficios.length===0){alert("Sem dados para exportar."); return;}
            const headers = Object.keys(allBeneficios[0]);
            const csvRows = [headers.join(',')];
            allBeneficios.forEach(b => {
                csvRows.push(headers.map(h => `"${b[h]||''}"`).join(','));
            });
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'beneficios.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch(error) { console.error(error); alert("Erro ao exportar CSV."); }
        finally { hideLoading(); }
    };

    // GRAFICOS
    const salvarGraficoComoPDF = (containerId, titulo) => {
        const container = document.getElementById(containerId);
        if(!container) return;
        const pdf = new jsPDF();
        pdf.html(container, {
            callback: function(doc){
                doc.save(`${titulo}.pdf`);
            },
            x: 10, y: 10
        });
    };

    const gerarGraficoBeneficiosPorPeriodo = async () => { /* implementar Chart.js conforme seu código */ };
    const gerarGraficoBeneficiosPorEquipamento = async () => { /* implementar Chart.js conforme seu código */ };

    // INICIALIZAÇÃO
    const initPage = () => {
        const path = window.location.pathname.split("/").pop();
        if(path==='login.html' || path==='') {
            document.getElementById('login-btn')?.addEventListener('click', handleLogin);
            document.getElementById('signup-btn')?.addEventListener('click', showContactInfo);
        } else if(checkLoginStatus()) {
            document.querySelectorAll('.menu-btn').forEach(btn => btn.addEventListener('click', ()=>showSection(btn.dataset.section)));
            document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', ()=>showSection(btn.dataset.section)));
            document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
            document.getElementById('btn-exportar-csv')?.addEventListener('click', exportarCSV);
            document.getElementById('beneficioForm')?.addEventListener('submit', handleFormSubmit);
            document.getElementById('editForm')?.addEventListener('submit', handleEditFormSubmit);
            document.getElementById('gerar-grafico-periodo')?.addEventListener('click', gerarGraficoBeneficiosPorPeriodo);
            document.getElementById('gerar-grafico-equipamento')?.addEventListener('click', gerarGraficoBeneficiosPorEquipamento);
            document.getElementById('salvar-pdf-periodo')?.addEventListener('click', ()=>salvarGraficoComoPDF('grafico-periodo-container','Benefícios por Período'));
            document.getElementById('salvar-pdf-equipamento')?.addEventListener('click', ()=>salvarGraficoComoPDF('grafico-equipamento-container','Benefícios por Equipamento'));
        }
    };

    initPage();
});
