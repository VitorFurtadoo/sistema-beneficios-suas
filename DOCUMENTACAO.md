# Sistema de Benefícios Eventuais - SEMDES

## Visão Geral

O Sistema de Benefícios Eventuais é uma aplicação web desenvolvida para a Secretaria Municipal de Desenvolvimento Social (SEMDES) para gerenciar e controlar a distribuição de benefícios eventuais aos cidadãos necessitados.

## Funcionalidades Principais

### 1. Autenticação e Autorização
- Sistema de login e cadastro de usuários
- Autenticação via Firebase Auth
- Controle de acesso baseado em funções (admin/usuário comum)
- Logout seguro

### 2. Cadastro de Benefícios
- Registro de beneficiários com dados pessoais (nome, CPF)
- Controle de valores e quantidades
- Tipos de benefícios disponíveis:
  - Auxílio Natalidade (Kit Enxoval)
  - Auxílio Alimentação (Cesta Básica)
  - Auxílio Funeral
  - Auxílio Transporte (Passagens)
  - Aluguel Social
- Associação a equipamentos/unidades:
  - CREAS
  - CRAS Camboatã
  - CRAS Jaderlândia
  - CRAS Morada do Sol
  - CRAS Nagibão
  - Abrigo de Idosos
  - Abrigo de Crianças
- Status de acompanhamento (Cedido, Pendente, Negado)
- Campo para observações adicionais

### 3. Consulta e Gestão de Benefícios
- Visualização em tabela de todos os benefícios cadastrados
- Sistema de filtros avançados:
  - Por período (data inicial e final)
  - Por status
  - Por equipamento
  - Por tipo de benefício
- Função de exportação para CSV
- Edição de registros existentes
- Exclusão de registros (para administradores)

### 4. Relatórios e Gráficos
- **Gráfico de Barras**: Análise temporal de benefícios
  - Agrupamento por período (mensal, trimestral, semestral, anual)
  - Filtros por data, status e tipo de benefício
  - Exibição do valor total dos benefícios
- **Gráfico de Pizza**: Distribuição por equipamento
  - Visualização percentual por unidade
  - Filtro por status
- Exportação de gráficos como imagem

### 5. Administração (Apenas Administradores)
- Gestão de usuários do sistema
- Visualização de histórico de atividades
- Controle de permissões

## Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura da aplicação
- **CSS3**: Estilização com design responsivo
- **JavaScript ES6+**: Lógica da aplicação
- **Chart.js**: Geração de gráficos interativos
- **Google Fonts (Poppins)**: Tipografia

### Backend e Banco de Dados
- **Firebase Authentication**: Sistema de autenticação
- **Firebase Firestore**: Banco de dados NoSQL em tempo real
- **Firebase Functions**: Funções serverless (Node.js/TypeScript)

### Ferramentas de Desenvolvimento
- **Firebase CLI**: Deployment e gerenciamento
- **TypeScript**: Tipagem estática para functions
- **ESLint**: Padronização de código

## Estrutura do Projeto

```
D:\Documents\Vitor\Programação\Beneficios Eventuais\
├── css/
│   └── style.css                 # Estilos da aplicação
├── js/
│   ├── script.js                 # Lógica principal
│   ├── login.js                  # Autenticação
│   └── signup.js                 # Cadastro de usuários
├── functions/
│   ├── src/
│   │   ├── index.ts             # Functions TypeScript
│   │   └── genkit-sample.ts     # Exemplo Genkit
│   ├── package.json             # Dependências das functions
│   └── tsconfig.json            # Configuração TypeScript
├── dataconnect/
│   ├── schema/
│   │   └── schema.gql           # Schema GraphQL
│   ├── connector/
│   │   ├── queries.gql          # Queries GraphQL
│   │   └── mutations.gql        # Mutations GraphQL
│   └── dataconnect.yaml         # Configuração Data Connect
├── imagens/
│   └── logo_semdes.png          # Logo institucional
├── index.html                   # Página principal
├── login.html                   # Página de login
├── signup.html                  # Página de cadastro
├── firebase.json                # Configuração Firebase
├── firestore.rules             # Regras de segurança
└── firestore.indexes.json      # Índices do Firestore
```

## Configuração e Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn
- Conta no Firebase
- Firebase CLI instalado

### Passos de Instalação

1. **Clone o repositório**
   ```bash
   git clone [URL_DO_REPOSITORIO]
   cd "Beneficios Eventuais"
   ```

2. **Configure o Firebase**
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com)
   - Configure Authentication (Email/Password)
   - Configure Firestore Database
   - Obtenha as credenciais do projeto

3. **Instale as dependências das Functions**
   ```bash
   cd functions
   npm install
   ```

4. **Configure as credenciais**
   - Atualize o `firebaseConfig` em `js/script.js` com suas credenciais

5. **Deploy da aplicação**
   ```bash
   firebase deploy
   ```

## Uso da Aplicação

### Para Usuários Comuns

1. **Acesso**
   - Faça login com suas credenciais
   - Navegue pelo menu principal

2. **Cadastrar Benefício**
   - Clique em "Cadastrar Benefício"
   - Preencha todos os campos obrigatórios
   - Selecione o tipo de benefício e equipamento
   - Adicione observações se necessário
   - Clique em "Cadastrar"

3. **Consultar Benefícios**
   - Acesse "Consultar Benefícios"
   - Use os filtros para buscar registros específicos
   - Edite registros clicando no botão "Editar"
   - Exporte dados em CSV quando necessário

4. **Visualizar Gráficos**
   - Acesse "Gráficos"
   - Configure os filtros desejados
   - Gere gráficos de barras ou pizza
   - Salve gráficos como imagem

### Para Administradores

- Acesso a todas as funcionalidades de usuários comuns
- Gerenciamento de usuários na seção "Admin"
- Visualização de logs de atividades
- Permissão para excluir registros

## Segurança

### Autenticação
- Login obrigatório para acesso ao sistema
- Tokens de sessão gerenciados pelo Firebase
- Logout automático em caso de inatividade

### Autorização
- Controle de acesso baseado em roles
- Verificação de permissões no frontend e backend
- Validação de dados antes de operações

### Firestore Rules
- Regras de segurança configuradas
- Acesso restrito por usuário autenticado
- Validação de dados no banco

## Manutenção e Suporte

### Logs e Monitoramento
- Sistema de logs de atividades
- Rastreamento de ações dos usuários
- Monitoramento via Firebase Console

### Backup e Recuperação
- Backup automático do Firestore
- Exportação manual de dados via CSV
- Histórico de alterações nos registros

### Atualizações
- Versionamento via Git
- Deploy incremental via Firebase CLI
- Testes antes de atualizações em produção

## Contato e Suporte

Para dúvidas, sugestões ou relatos de problemas:
- Entre em contato com a equipe de TI da SEMDES
- Documente bugs encontrados
- Solicite novas funcionalidades conforme necessidade

---

**Versão**: 1.0  
**Data**: 2024  
**Desenvolvido por**: Vitor Furtado  
**Organização**: Vigilância SUAS Paragominas  
**Cliente**: SEMDES - Secretaria Municipal de Desenvolvimento Social  

© 2024 Vitor Furtado | Vigilância SUAS Paragominas | Todos os direitos reservados