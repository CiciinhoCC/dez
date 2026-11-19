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
- [Gerando o APK (Entrega 4)](#gerando-o-apk-entrega-4)
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

| Ferramenta | Versão recomendada | Observação |
|---|---|---|
| **Node.js** | 18 ou superior | Inclui o `npm` |
| **MySQL** | 8.0 ou superior | Server + cliente (Workbench, CLI, etc.) |
| **Git** | qualquer versão recente | Para clonar o repositório |
| **Expo Go** (opcional) | versão mais recente | Necessário apenas para rodar em celular físico |
| **Android Studio** (opcional) | versão mais recente | Necessário apenas para rodar no emulador Android |
| **Conta Expo** (opcional) | gratuita | Necessária apenas para gerar o APK via EAS |

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
├── eas.json              # Configuração de build do APK
├── database.sql          # Script de criação do banco
└── README.md
```

O `package.json` é único e reúne dependências do aplicativo (Expo / React Native) **e** do servidor (Express / MySQL / JWT) — ambos são executados a partir da mesma raiz.

> O arquivo `.env` **não deve ser commitado** — ele contém a senha do MySQL, o `JWT_SECRET` e (opcionalmente) o IP local da máquina. Veja a seção [Notas de segurança](#notas-de-segurança).

---

## Instalação das dependências

Na raiz do repositório:

```bash
npm install
```

Isso instala tudo o que o projeto precisa. As principais dependências são:

- **Backend:** `express`, `cors`, `mysql2`, `bcrypt`, `jsonwebtoken`, `dotenv`
- **Frontend:** `expo`, `react`, `react-native`, `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`, `react-native-markdown-display`
- **Build (APK):** `eas-cli` (instalado separadamente — veja a seção [Gerando o APK](#gerando-o-apk-entrega-4))

Se em algum momento essas dependências não estiverem no `package.json`, instale manualmente:

```bash
# Backend
npm install express cors mysql2 bcrypt jsonwebtoken dotenv

# Frontend (via Expo, para compatibilidade de versões)
npx expo install react-native-screens react-native-safe-area-context react-native-markdown-display
npm install @react-navigation/native @react-navigation/native-stack
```

> **Nota:** a biblioteca `react-native-markdown-display` depende internamente do `punycode`, que não existe no runtime nativo do React Native. Se o build do APK falhar com `Unable to resolve module punycode`, instale o pacote como workaround:
> ```bash
> npm install punycode
> ```

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
UPDATE users SET role = 'admin' WHERE username = 'seu_usuario';
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
EXPO_PUBLIC_API_URL=http://192.168.0.12:3000
```

Regras importantes:

- **`DB_PASSWORD`**: a senha que você usa para acessar o MySQL localmente.
- **`DB_PORT`**: porta em que o MySQL está ouvindo. O padrão é `3306`. Se o seu servidor local usa outra porta (por exemplo, `3307`), ajuste este valor — ou remova a linha e o padrão `3306` será usado.
- **`JWT_SECRET`**: qualquer string longa e aleatória. Você pode gerar uma com:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- **`PORT`**: se `3000` estiver ocupada, troque para outra porta livre (ex.: `3001`) — **e ajuste o `API_URL` em `constants.js`** de acordo (veja o próximo passo).
- **`EXPO_PUBLIC_API_URL`**: endereço da API quando o app roda **fora do navegador**. Em `localhost`/web esse valor é ignorado. No emulador Android, deve ser `http://10.0.2.2:3000`; em celular físico, deve ser o IP da sua máquina na rede local (`http://192.168.0.12:3000`). Veja o próximo passo para o detalhamento completo.

> **Atenção:** o Expo carrega `.env` automaticamente ao iniciar `npx expo start`, mas **é preciso reiniciar o servidor do Expo** sempre que `.env` for alterado. O EAS Build **não envia** o `.env` para a nuvem — veja a seção [Gerando o APK](#gerando-o-apk-entrega-4) para como passar essa variável no build.

### 4. Ajustar `constants.js`

O arquivo `constants.js` na raiz contém a URL base da API usada por todas as telas. O comportamento depende do ambiente:

```js
import { Platform } from 'react-native';

const envURL = process.env.EXPO_PUBLIC_API_URL;

export const API_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3000'          // web sempre usa localhost
    : (envURL || 'http://10.0.2.2:3000'); // mobile usa a env ou o emulador
```

O valor de `EXPO_PUBLIC_API_URL` (definido em `.env`) é o que determina o comportamento fora da web:

| Onde você está rodando | `EXPO_PUBLIC_API_URL` no `.env` |
|---|---|
| **Navegador (web)** | *qualquer valor* — a web sempre usa `http://localhost:3000` |
| **Emulador Android** | `http://10.0.2.2:3000` |
| **Simulador iOS** | `http://localhost:3000` |
| **Celular físico (Expo Go)** | `http://SEU_IP_LOCAL:3000` (ex.: `http://192.168.0.12:3000`) |

> `10.0.2.2` é o endereço especial que o emulador Android usa para acessar a máquina hospedeira. Em um celular físico, use o **IP da sua máquina na rede local** (descubra com `ipconfig` no Windows ou `ifconfig`/`ip a` no Linux/macOS) e garanta que celular e computador estejam na mesma rede Wi-Fi.

### 5. Iniciar a API

Na raiz do repositório:

```bash
node server.js
```

Você deve ver no terminal:

```
API listening on http://0.0.0.0:3000
```

Para verificar, abra no navegador:

```
http://localhost:3000/
```

A resposta esperada é:

```json
{"status":"ok","service":"dez_notas API"}
```

Para testar se a API está acessível **de outros dispositivos na rede** (necessário para o app no celular), abra no navegador do próprio celular:

```
http://SEU_IP_LOCAL:3000/
```

Se funcionar, a rede está pronta. Se não funcionar, o firewall do computador pode estar bloqueando a porta — veja a seção [Solução de problemas](#solução-de-problemas).

**Deixe esse terminal aberto** — o servidor precisa continuar rodando enquanto você usa o app.

### 6. Rodar o aplicativo

Abra **um segundo terminal** (sem fechar o da API) e, na raiz do repositório:

```bash
npx expo start
```

O Expo exibirá um menu no terminal com as opções:

| Tecla | O que faz |
|---|---|
| `w` | Abre o app no navegador (web) |
| `a` | Abre no emulador Android |
| `i` | Abre no simulador iOS (somente macOS) |
| `s` | Alterna para o modo Expo Go (celular físico, escaneia QR) |

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

## Gerando o APK (Entrega 4)

O APK é gerado via **EAS Build**, o serviço de build na nuvem da Expo. Ele compila o app em um servidor remoto e devolve um link para download do `.apk`.

> **Importante:** o APK **não contém** o servidor Node.js nem o MySQL. Ele é apenas o cliente. Para o APK funcionar, a API precisa estar rodando em algum lugar acessível ao celular (sua máquina na mesma rede Wi-Fi, ou um servidor remoto). O APK só "conversa" com a API pela rede.

### 1. Instalar o EAS CLI e criar/logar em uma conta Expo

```bash
npm install --global eas-cli
eas login
```

Ou, sem instalar globalmente, use `npx eas-cli@latest` em todos os comandos abaixo.

Se ainda não tem conta, crie em [expo.dev](https://expo.dev) (é gratuito).

### 2. Configurar o build

Na raiz do projeto:

```bash
eas build:configure
```

Isso gera o arquivo `eas.json`. Abra e adicione um perfil `preview` com `buildType: "apk"` (o perfil padrão gera AAB, que não é instalável diretamente):

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "environment": "preview"
    }
  }
}
```

### 3. Passar `EXPO_PUBLIC_API_URL` para o servidor de build

O EAS **não envia** o arquivo `.env` para a nuvem. É necessário registrar a variável diretamente no EAS. Substitua `192.168.0.12` pelo IP da sua máquina:

```bash
npx eas-cli@latest env:set \
  --name EXPO_PUBLIC_API_URL \
  --value "http://192.168.0.12:3000" \
  --environment preview \
  --visibility plaintext
```

Confirme que a variável foi salva:

```bash
npx eas-cli@latest env:list --environment preview
```

O IP da máquina fica registrado apenas no EAS — **não** no repositório. Se o IP da sua máquina mudar (por exemplo, ao reconectar ao Wi-Fi), repita o comando acima com o novo valor antes de refazer o build.

### 4. Fazer o build

```bash
npx eas-cli@latest build -p android --profile preview
```

O terminal exibirá um link para acompanhar o progresso em `expo.dev`. O build leva em média 10–15 minutos. Ao final, aparece um segundo link para **baixar o `.apk`**.

### 5. Instalar e testar

1. Baixe o `.apk` no computador.
2. Transfira para o celular (por cabo USB, Google Drive, WhatsApp Web, etc.) ou escaneie o QR Code exibido pelo EAS se disponível.
3. No celular, permita a instalação de "apps de fontes desconhecidas" quando solicitado.
4. Instale o APK.
5. **Antes de abrir o app:** confirme que:
   - a API está rodando (`node server.js`);
   - o celular e o computador estão na mesma rede Wi-Fi;
   - o navegador do celular consegue abrir `http://SEU_IP_LOCAL:3000/`.
6. Abra o app, faça login e teste o fluxo completo.

### Se o build falhar

- **`Unable to resolve module punycode`** → rode `npm install punycode` e refaça o build com `--clear-cache`.
- **`Unknown error. See logs of the Bundle JavaScript build phase`** → abra o log completo no painel do Expo, procure o **primeiro erro específico** e cole-o para diagnóstico. Costuma ser uma dependência ausente ou uma sintaxe inválida.
- **Build passa, mas app não conecta** → confira o painel de logs do Android (`adb logcat`) ou use a dica da seção [Solução de problemas](#solução-de-problemas) sobre ver a `API_URL` em uso dentro do app.

### Alternativa: build local (sem EAS)

Se preferir não depender da nuvem, e já tiver o Android Studio instalado:

```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

O `.apk` fica em `android/app/build/outputs/apk/release/app-release.apk`. Como o bundle é gerado localmente, o `.env` local é lido normalmente — não é preciso registrar `EXPO_PUBLIC_API_URL` no EAS. O primeiro build leva mais tempo por baixar as dependências nativas.

---

## Solução de problemas

### `NetworkError when attempting to fetch resource`

- A API não está rodando → confira o terminal do `node server.js`.
- `API_URL` errado para o ambiente atual → veja a tabela no [Passo 4](#4-ajustar-constantsjs).
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

### O celular (ou o emulador) não consegue alcançar a API

- **Emulador Android:** o IP correto é `10.0.2.2` (não `localhost`, não o IP da máquina). Confirme que `EXPO_PUBLIC_API_URL` em `.env` está definido como `http://10.0.2.2:3000` **e reinicie `npx expo start`**.
- **Celular físico:** o IP correto é o da máquina na rede local. Teste antes no navegador do celular (`http://SEU_IP_LOCAL:3000/`). Se não abrir:
  - Verifique o firewall do computador (veja abaixo).
  - Confirme que os dois estão na mesma rede Wi-Fi.
  - Confirme que o `server.js` escuta em `0.0.0.0` e não apenas em `127.0.0.1`. A linha deve ser `app.listen(PORT, '0.0.0.0', ...)`.
- **Windows — liberar a porta 3000:** abra o PowerShell como administrador e execute:
  ```powershell
  New-NetFirewallRule -DisplayName "DezNotas API" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
  ```
- **macOS / Linux:** permita o `node` na configuração do firewall ou execute `sudo ufw allow 3000/tcp`.

### Build do APK falha com "Bundle JavaScript"

A causa é sempre um erro específico dentro do log. Abra o painel do Expo, expanda a fase **"Bundle JavaScript"** e procure a primeira mensagem de erro real (ex.: `Unable to resolve module ...`, `SyntaxError`, `ENOENT`). Corrija, rode `npx eas-cli@latest build -p android --profile preview --clear-cache` para refazer.

---

## Notas de segurança

Este projeto foi desenvolvido para fins acadêmicos, mas segue boas práticas básicas:

- Senhas são armazenadas **exclusivamente** como hash bcrypt (custo 10). O texto puro nunca é gravado nem logado.
- O JWT é assinado com `JWT_SECRET` e enviado via **Bearer Token** no header `Authorization`.
- O middleware `verifyToken` (em `authMiddleware.js`) valida o token em todas as rotas de notas.
- O backend sempre verifica a **propriedade da nota** ou o **papel de admin** antes de permitir edição/exclusão — a ocultação de botões na UI é apenas cosmética.
- Erros de login retornam a mesma mensagem (`Invalid credentials`) tanto para usuário inexistente quanto para senha errada, evitando vazamento de informação.

**O que não deve ser enviado ao repositório:**

- Arquivo `.env` (contém senha do banco, `JWT_SECRET` e, opcionalmente, o IP local da máquina).
- Credenciais reais de qualquer tipo.
- `node_modules/`.
- Qualquer IP da rede local em arquivos versionados (use `EXPO_PUBLIC_API_URL` em `.env` ou no EAS em vez de hardcodar em `constants.js` ou `eas.json`).

Esses itens já devem estar cobertos pelo `.gitignore`. Antes de cada entrega, confirme com:

```bash
git status
```

que nenhum arquivo sensível aparece na lista.