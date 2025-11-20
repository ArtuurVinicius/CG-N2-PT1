# Visualizador de Curvas Paramétricas

Uma aplicação web interativa para visualizar e manipular curvas de Bézier e B-Splines, desenvolvida para o projeto acadêmico de Computação Gráfica.

## 🎯 Funcionalidades

### Curvas de Bézier
- ✅ Implementação do algoritmo de De Casteljau
- ✅ Adição, edição e remoção de pontos de controle interativos
- ✅ Pesos ajustáveis para cada ponto (NURBS)
- ✅ Visualização em tempo real
- ✅ Grau variável baseado no número de pontos

### B-Splines Cúbicas
- ✅ Interpolação B-spline cúbica
- ✅ Controle de grau da curva (2, 3, 4)
- ✅ Passo de interpolação ajustável
- ✅ Reutilização de pontos da aba Bézier
- ✅ Geração automática de vetor de nós

### Interface Interativa
- ✅ Canvas HTML5 com interação por mouse
- ✅ Sistema de abas para alternar entre tipos de curva
- ✅ Controles em tempo real para coordenadas e pesos
- ✅ Lista visual de pontos de controle
- ✅ Exportação de dados em formato JSON
- ✅ Feedback visual com coordenadas do mouse

## 🚀 Como Usar

### Instalação e Execução
```bash
# Execute o servidor de desenvolvimento
npm run dev

# Acesse http://localhost:5173
```

### Controles Básicos

#### Adição de Pontos
- **Clique** em qualquer lugar do canvas para adicionar um ponto de controle

#### Manipulação de Pontos
- **Arraste** um ponto para movê-lo
- **Duplo-clique** em um ponto para removê-lo
- **Selecione** um ponto clicando nele para editar propriedades

#### Teclado
- **Setas** - Move o ponto selecionado pixel por pixel
- **Delete/Backspace** - Remove o ponto selecionado
- **Escape** - Deseleciona o ponto atual

### Controles da Interface

#### Aba Bézier
- **Grau da Curva**: Mostra o grau atual (número de pontos - 1)
- **Coordenadas**: Edite X e Y do ponto selecionado
- **Peso**: Ajuste o peso do ponto (0.1 a 3.0)

#### Aba B-Spline
- **Grau da Curva**: Selecione grau 2, 3 ou 4
- **Passo de Interpolação**: Controle a suavidade (0.001 a 0.1)
- **Copiar Pontos de Bézier**: Importa pontos da aba Bézier

### Exportação de Dados

Clique em **"Exportar JSON"** para baixar os dados da curva atual:

```json
{
  "type": "bezier",
  "degree": 3,
  "controlPoints": [
    {"x": 100, "y": 300, "weight": 1.0},
    {"x": 200, "y": 100, "weight": 1.2}
  ]
}
```

## 🛠️ Arquitetura Técnica

### Estrutura Modular
```
src/
├── math.js      # Algoritmos matemáticos (De Casteljau, B-Splines)
├── renderer.js  # Renderização no canvas
├── ui.js        # Gerenciamento de eventos e interface
├── data.js      # Gerenciamento de dados e estado
├── app.js       # Aplicação principal e integração
└── styles.css   # Estilos e layout responsivo
```

## 📊 Requisitos Atendidos

- ✅ **HTML5, CSS3 e JavaScript puro** - Sem frameworks obrigatórios
- ✅ **Elemento `<canvas>`** - Para renderização das curvas
- ✅ **Estrutura modular** - Separação clara de responsabilidades
- ✅ **Algoritmos manuais** - De Casteljau e B-spline implementados do zero
- ✅ **Interface interativa** - Manipulação direta no canvas
- ✅ **Exportação JSON** - Dados estruturados exportáveis
