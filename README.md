sim. isso foi 100% inteligência artificial e 0% burrice natural. eu vou confessar meus pecados na igreja depois de commitar isso aqui.

# Dez Notas

Aplicação mobile de anotações em Markdown, com autenticação JWT, níveis de usuário e catálogo de notas pessoais e públicas.

**Stack:** React Native + Expo · React Navigation · Node.js + Express · MySQL · JWT · bcrypt

---

## Sumário

- [Visão geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Instalação das dependências](#instalação-das-dependências)
- [Passo a passo](#passo-a-passo)
- [Como testar o fluxo completo](#como-testar-o-fluxo-completo)
- [Solução de problemas](#solução-de-problemas)
- [Notas de segurança](#notas-de-segurança)
- [Autoria](#autoria)

---

## Visão geral

O **Dez Notas** permite que usuários:

- se cadastrem e façam login com senha protegida por hash (bcrypt);
- criem, editem, visualizem e excluam notas em Markdown;
- organizem notas por matéria (subject);
- busquem notas por título, conteúdo e autor;
- filtrem entre suas notas, notas públicas ou ambas;
- tornem notas públicas para que outros usuários possam vê-las;
- (admin) visualizem, editem e excluam qualquer nota do sistema.

---

## Pré-requisitos

Antes de começar, instale em sua máquina:

| Ferramenta                    | Versão recomendada      | Observação                                       |
| ----------------------------- | ----------------------- | ------------------------------------------------ |
| **Node.js**                   | 18 ou superior          | Inclui o `npm`                                   |
| **MySQL**                     | 8.0 ou superior         | Server + cliente (Workbench, CLI, etc.)          |
| **Git**                       | qualquer versão recente | Para clonar o repositório                        |
| **Expo Go** (opcional)        | versão mais recente     | Necessário apenas para rodar em celular físico   |
| **Android Studio** (opcional) | versão mais recente     | Necessário apenas para rodar no emulador Android |

Verifique se estão instalados:

```bash
node -v
npm -v
mysql --version
git --version
```

---

## Estrutura do repositório

Todos os arquivos ficam na raiz do repositório:

```
dez/
├── screens/
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── NotesScreen.js
│   ├── NoteViewScreen.js
│   └── EditNoteScreen.js
├── utils/
│   └── alert.js          # Alert cross-platform (web + native)
├── App.js                # Configuração do React Navigation
├── package.json
├── api.js                # Rotas de autenticação e notas
├── constants.js
├── authMiddleware.js     # Verificação do JWT (Bearer Token)
├── db.js                 # Conexão com o MySQL
├── server.js             # Ponto de entrada do servidor
├── .env
├── database.sql          # Script de criação do banco
└── README.md
```

O `package.json` é único e reúne dependências do aplicativo (Expo / React Native) **e** do servidor (Express / MySQL / JWT) — ambos são executados a partir da mesma raiz.

> O arquivo `.env` **não deve ser commitado** — ele contém a senha do MySQL e o `JWT_SECRET`. Veja a seção [Notas de segurança](#notas-de-segurança).

---

## Instalação das dependências

Na raiz do repositório:

```bash
npm install
```

Isso instala tudo o que o projeto precisa. As principais dependências são:

- **Backend:** `express`, `cors`, `mysql2`, `bcrypt`, `jsonwebtoken`, `dotenv`
- **Frontend:** `expo`, `react`, `react-native`, `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`, `react-native-markdown-display`

Se em algum momento essas dependências não estiverem no `package.json`, instale manualmente:

```bash
# Backend
npm install express cors mysql2 bcrypt jsonwebtoken dotenv

# Frontend (via Expo, para compatibilidade de versões)
npx expo install react-native-screens react-native-safe-area-context react-native-markdown-display
npm install @react-navigation/native @react-navigation/native-stack
```

---

## Passo a passo

### 1. Clonar o repositório

```bash
git clone https://github.com/CiciinhoCC/dez.git
cd dez
```

### 2. Criar o banco de dados MySQL

Inicie o servidor MySQL na sua máquina.

Em seguida, execute o script `database.sql`. Você pode fazer de três formas:

**Opção A — CLI do MySQL:**

```bash
mysql -u root -p < database.sql
```

**Opção B — MySQL Workbench:**

1. Abra uma nova aba de SQL.
2. Cole o conteúdo de `database.sql`.
3. Clique em ⚡ para executar.

**Opção C — phpMyAdmin:**

1. Vá para a aba **SQL**.
2. Cole o script e clique em **Executar**.

Confirme que o banco foi criado corretamente:

```sql
USE dez_notas;
SHOW TABLES;
-- Esperado: notes, users
```

Se você quiser criar um usuário administrador para testar o nível de acesso admin:

```sql
-- Após cadastrar um usuário pelo app:
UPDATE users SET role = 'admin' WHERE username = 'CiciinhoCC';
```

> **Importante:** o papel (`role`) é gravado dentro do JWT no momento do login. Depois de alterar o papel no banco, faça **logout e login novamente** no app para o novo papel entrar em vigor.

### 3. Configurar o arquivo `.env`

Na raiz do repositório, crie (ou edite) o arquivo `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_do_mysql
DB_NAME=dez_notas
JWT_SECRET=uma_string_longa_e_aleatoria_aqui
PORT=3000
```

Regras importantes:

- **`DB_PASSWORD`**: a senha que você usa para acessar o MySQL localmente.
- **`DB_PORT`**: porta em que o MySQL está ouvindo. O padrão é `3306`. Se o seu servidor local usa outra porta (por exemplo, `3307`), ajuste este valor — ou remova a linha e o padrão `3306` será usado.
- **`JWT_SECRET`**: qualquer string longa e aleatória. Você pode gerar uma com:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- **`PORT`**: se `3000` estiver ocupada, troque para outra porta livre (ex.: `3001`) — **e ajuste o `API_URL` em `constants.js`** de acordo (veja o próximo passo).

### 4. Ajustar `constants.js`

O arquivo `constants.js` na raiz contém a URL base da API usada por todas as telas. Abra e ajuste conforme o ambiente em que o app vai rodar:

| Onde você está rodando       | `API_URL`                                                    |
| ---------------------------- | ------------------------------------------------------------ |
| **Navegador (web)**          | `http://localhost:3000`                                      |
| **Emulador Android**         | `http://10.0.2.2:3000`                                       |
| **Simulador iOS**            | `http://localhost:3000`                                      |
| **Celular físico (Expo Go)** | `http://SEU_IP_LOCAL:3000` (ex.: `http://192.168.0.12:3000`) |

Exemplo de `constants.js` que funciona em web, emulador Android e simulador iOS ao mesmo tempo:

```js
import { Platform } from 'react-native';

export const API_URL = Platform.select({
  web:     'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
  ios:     'http://localhost:3000',
  default: 'http://localhost:3000',
});
```

> `10.0.2.2` é o endereço especial que o emulador Android usa para acessar a máquina hospedeira. Em um celular físico, use o **IP da sua máquina na rede local** (descubra com `ipconfig` no Windows ou `ifconfig`/`ip a` no Linux/macOS) e garanta que celular e computador estejam na mesma rede Wi-Fi.

### 5. Iniciar a API

Na raiz do repositório:

```bash
node server.js
```

Você deve ver no terminal:

```
API listening on http://localhost:3000
```

Para verificar, abra no navegador:

```
http://localhost:3000/
```

A resposta esperada é:

```json
{"status":"ok","service":"dez_notas API"}
```

**Deixe esse terminal aberto** — o servidor precisa continuar rodando enquanto você usa o app.

### 6. Rodar o aplicativo

Abra **um segundo terminal** (sem fechar o da API) e, na raiz do repositório:

```bash
npx expo start
```

O Expo exibirá um menu no terminal com as opções:

| Tecla | O que faz                                                 |
| ----- | --------------------------------------------------------- |
| `w`   | Abre o app no navegador (web)                             |
| `a`   | Abre no emulador Android                                  |
| `i`   | Abre no simulador iOS (somente macOS)                     |
| `s`   | Alterna para o modo Expo Go (celular físico, escaneia QR) |

**Exemplo — rodar no navegador:**

Pressione `w`. O navegador abrirá em `http://localhost:8081`.

**Exemplo — rodar no celular físico:**

1. Instale o aplicativo **Expo Go** na Play Store / App Store.
2. Pressione `s` no terminal do Expo.
3. Escaneie o QR Code com o Expo Go (Android) ou com a câmera (iOS).

---

## Como testar o fluxo completo

Após o app abrir, siga estes passos para validar que tudo está funcionando:

1. **Cadastro** — toque em *"Não tem conta? Cadastre-se"*, crie um usuário (ex.: `alice` / `senha123`).
2. **Login automático** — o app entra direto no catálogo de notas.
3. **Criar nota** — toque no **+** no canto superior direito.
   - Preencha título, matéria, conteúdo em Markdown.
   - Ative **Público** para que a nota apareça no filtro "Public".
   - Toque em **Criar**.
4. **Visualizar** — a nota é aberta renderizada em Markdown, com os botões **Editar** e **Excluir** (pois você é o dono).
5. **Editar** — altere o conteúdo e toque em **Salvar**. A tela de visualização atualiza automaticamente.
6. **Filtrar** — volte ao catálogo e teste:
   - Busca por termo no título ou conteúdo.
   - Filtros de escopo: **All / Mine / Public**.
   - Chips de matéria.
7. **Segundo usuário** — faça logout e cadastre outro usuário (`bob`).
   - No filtro **Public**, a nota pública de `alice` aparece com o autor `@alice`.
   - Os botões **Editar/Excluir** **não** aparecem para `bob` (backend bloqueia com 403).
8. **Admin (opcional)** — no MySQL, promova um usuário a admin:
   ```sql
   UPDATE users SET role = 'admin' WHERE username = 'alice';
   ```
   Faça logout e login novamente. Abra uma nota pública de outro usuário — agora os botões de editar/excluir estão visíveis.

---

## Solução de problemas

### `NetworkError when attempting to fetch resource`

- A API não está rodando → confira o terminal do `node server.js`.
- `API_URL` em `constants.js` está errado para o ambiente atual → veja a tabela no [Passo 4](#4-ajustar-constantsjs).
- CORS não está habilitado no servidor → verifique se `app.use(cors())` existe no `server.js`.

### `JSON.parse: unexpected character at line 1 column 1`

A resposta do servidor não é JSON (provavelmente uma página de erro HTML). Abra o **DevTools → Network**, clique na requisição e veja o corpo da resposta. Causas mais comuns:

- URL inexistente (`404 Cannot GET /api/...`) — verifique o caminho e o método.
- Rota não montada no `server.js`.

### `Cannot POST /api/auth/login`

A rota existe mas está em outro caminho. Verifique se o `api.js` define `router.post('/auth/login', ...)` **e** se o `server.js` monta com `app.use('/api', apiRoutes)`. Nesse caso, a URL final é `POST /api/auth/login`.

### `401 Invalid or expired token`

- O `JWT_SECRET` foi alterado entre um login e outro → faça login novamente.
- O token foi apagado/quebrado → faça logout e login.

### `403 Not allowed`

Você está tentando editar/excluir uma nota que não é sua e você não é admin. Isso é **esperado** — é a prova de que o controle de permissões está funcionando no backend.

### `ER_ACCESS_DENIED_ERROR` ao iniciar a API

Usuário/senha do MySQL incorretos. Verifique `DB_USER` e `DB_PASSWORD` no `.env`.

### `ECONNREFUSED 127.0.0.1:3306`

O servidor MySQL não está rodando. Inicie-o (via serviço do sistema, XAMPP, WAMP, Docker, etc.).

### `ECONNREFUSED 127.0.0.1:3307` (ou qualquer outra porta)

O `DB_PORT` no `.env` não corresponde à porta em que o MySQL está rodando.

   - Se o MySQL está na porta padrão `3306`: apague a linha `DB_PORT` do `.env` (ou defina `DB_PORT=3306`).

   - Se o MySQL está em outra porta: defina `DB_PORT=<sua porta>` no `.env`.

Para descobrir a porta que o seu MySQL está usando, execute dentro do cliente MySQL:
```sql
SHOW VARIABLES LIKE 'port';
```

### `Table 'dez_notas.users' doesn't exist`

O script `database.sql` não foi executado ou foi executado em outro banco. Rode novamente e confira com `SHOW TABLES`.

---

## Notas de segurança

Este projeto foi desenvolvido para fins acadêmicos, mas segue boas práticas básicas:

- Senhas são armazenadas **exclusivamente** como hash bcrypt (custo 10). O texto puro nunca é gravado nem logado.
- O JWT é assinado com `JWT_SECRET` e enviado via **Bearer Token** no header `Authorization`.
- O middleware `verifyToken` (em `authMiddleware.js`) valida o token em todas as rotas de notas.
- O backend sempre verifica a **propriedade da nota** ou o **papel de admin** antes de permitir edição/exclusão — a ocultação de botões na UI é apenas cosmética.
- Erros de login retornam a mesma mensagem (`Invalid credentials`) tanto para usuário inexistente quanto para senha errada, evitando vazamento de informação.

**O que não deve ser enviado ao repositório:**

- Arquivo `.env` (contém senha do banco e `JWT_SECRET`).
- Credenciais reais de qualquer tipo.
- `node_modules/`.

Esses itens já devem estar cobertos pelo `.gitignore`. Antes de cada entrega, confirme com:

```bash
git status
```

que nenhum arquivo sensível aparece na lista.

---

## Autoria

Projeto desenvolvido como avaliação incremental em 4 entregas para a disciplina de **Aplicação Mobile com JWT**.

- **Aluno(a):** *[seu nome completo]*
- **Matrícula:** *[sua matrícula]*
- **Repositório:** *[URL do repositório no GitHub]*
