# 🎾 Viva By Baumann - Beach Tennis Tournament Management

Sistema web completo de alta performance para gestão operacional de torneios de Beach Tennis, com suporte a chaveamento automático, fase de grupos (serpentina e aleatório), grade horária inteligente com arrastar e soltar (Drag & Drop), mesa de operação em tempo real e Modo Telão (Big Screen) em alta resolução.

---

## ✨ Principais Funcionalidades

### 🏆 1. Gestão de Torneios e Categorias
- Criação e configuração de torneios com múltiplas quadras (areia externa e coberta).
- Configuração de categorias (Masculina, Feminina, Mista, Iniciante a Pro).
- Inscrição manual ou importação de atletas via planilha CSV com resolução de duplicatas.

### 🔀 2. Sorteio de Grupos & Chaveamento Mata-Mata
- Distribuição de duplas em grupos via sistema **Serpentina (cabeças de chave)** ou **Sorteio Aleatório**.
- Classificação automática por grupo (Critérios: Vitórias, Saldo de Sets, Saldo de Games, Confronto Direto).
- Geração de chaves eliminatórias com cruzamento inteligente de 1º vs 2º colocados.

### 📅 3. Programação Inteligente & Divulgação Oficial
- **Matriz de Quadras × Horários** com reorganização interativa por **Drag & Drop** (arrastar e soltar).
- **Pré-alocação Automática** de partidas por quadras e blocos de horários.
- **Identificação Visual por Cores**: cada categoria possui sua própria paleta de cores para rápido reconhecimento.
- **Aba "Divulgação Oficial"**: horários oficiais de início de cada categoria com botão **"Copiar Comunicado (WhatsApp)"** e impressão em alta definição.

### 🎛️ 4. Mesa de Operação (Telão Admin)
- Painel para operadores de quadra em tablets ou notebooks.
- Controle game a game com 1 toque.
- Botão **"Cancelar (Voltar à Fila)"** para desvincular jogos de quadras e retornar automaticamente à fila de espera liberando a quadra.
- Gestão de fila e chamada rápida de duplas para aquecimento.

### 📝 5. Lançamento e Homologação de Resultados
- Entrada de placar otimizada com foco limpo para digitação rápida.
- Botão **"Editar"** para retificação de resultados finalizados pela arbitragem.
- Propagação automática de vencedores para a próxima fase do mata-mata.

### 📺 6. Modo Telão (Big Screen 1080p/4K)
- Interface de alto contraste em **Azul Neon** projetada para televisores e telões da arena.
- Atualização em tempo real (polling a cada 4s) com status de quadras ao vivo e fila de espera.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend & Backend**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) com paleta personalizada Neon Blue & Slate
- **Banco de Dados & ORM**: [Prisma ORM](https://www.prisma.io/) com SQLite (ou PostgreSQL/MySQL compatível)
- **Ícones**: [Lucide React](https://lucide.dev/)

---

## 🚀 Como Executar o Projeto Localmente

1. **Clonar o Repositório:**
```bash
git clone https://github.com/daniel1alexandre/beach-tennis.git
cd beach-tennis
```

2. **Instalar as Dependências:**
```bash
npm install
```

3. **Configurar o Banco de Dados:**
```bash
npx prisma db push
node prisma/seed.js
```

4. **Executar em Modo de Desenvolvimento:**
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000).

5. **Compilar e Executar em Produção:**
```bash
npm run build
npm start
```

---

## 📄 Licença
Distribuído sob a licença MIT. Desenvolvido para gestão profissional de eventos esportivos.
