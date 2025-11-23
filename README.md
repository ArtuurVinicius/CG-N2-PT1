# Visualizador de Curvas Paramétricas

Uma aplicação web interativa para visualizar e manipular curvas de Bézier e B-Splines, desenvolvida para o projeto acadêmico de Computação Gráfica.

## Relatório do Projeto

### Visão Geral
Este projeto implementa um visualizador completo de curvas paramétricas com foco na interatividade e precisão matemática. A aplicação permite manipular curvas de Bézier e B-Splines diretamente no canvas, oferecendo controles intuitivos para exploração de conceitos de computação gráfica.

### Como Foi Desenvolvido

#### 1. **Arquitetura Modular**
O projeto foi estruturado em módulos independentes para facilitar manutenção e extensibilidade:

- **`math.js`**: Core matemático com implementação própria dos algoritmos de De Casteljau e funções base B-spline
- **`renderer.js`**: Sistema de renderização otimizado com antialiasing e feedback visual
- **`ui.js`**: Gerenciamento de eventos de mouse/teclado e sincronização de controles
- **`data.js`**: Estado centralizado com persistência no localStorage
- **`app.js`**: Orquestração geral e ciclo de vida da aplicação

#### 2. **Implementações Matemáticas**
- **Algoritmo de De Casteljau**: Implementação recursiva para curvas de Bézier com suporte a pesos (NURBS)
- **B-Splines**: Cálculo de funções base com vetor de nós uniforme e grau variável
- **Validações**: Sistema de verificação de consistência matemática (grau vs número de pontos)

#### 3. **Interface Interativa**
- **Canvas Responsivo**: Detecção precisa de pontos com threshold configurável
- **Feedback Visual**: Grid de fundo, indicadores de peso, numeração de pontos (começando em 1)
- **Controles Dinâmicos**: Sliders e inputs sincronizados com renderização em tempo real

### Principais Dificuldades Encontradas

#### 1. **Sincronização de Estado**
**Problema**: Manter controles da UI, dados do modelo e renderização consistentes durante interações.

**Solução**: Implementação de um sistema de callbacks centralizados no `App.js` que propaga mudanças entre módulos de forma unidirecional.

#### 2. **Grau Efetivo vs Desejado**
**Problema**: B-splines requerem pelo menos `grau + 1` pontos, mas usuário pode selecionar grau maior que o disponível.

**Solução**: Cálculo de grau efetivo (`Math.min(grauDesejado, pontosDisponíveis - 1)`) com feedback visual no seletor.

#### 3. **Numeração Humana vs Indexação**
**Problema**: Programação usa índices 0-based, mas usuários esperam numeração 1-based.

**Solução**: Camada de apresentação com `displayIndex = index + 1` mantendo lógica interna inalterada.

#### 4. **Renderização em Tempo Real**
**Problema**: Mudanças de grau/passo devem refletir imediatamente na curva sem atraso perceptível.

**Solução**: Sistema de eventos otimizado com `handleSplineParameterChange` que atualiza apenas quando necessário.

#### 5. **Detecção de Pontos no Canvas**
**Problema**: Click detection preciso considerando diferentes tamanhos de pontos e indicadores de peso.

**Solução**: Algoritmo de distância euclidiana com threshold ajustável e priorização de pontos selecionados.

### Lições Aprendidas

1. **Modularidade é Essencial**: Separação clara de responsabilidades facilitou debug e extensões
2. **Estado Centralizado**: Um único ponto de verdade evita inconsistências entre módulos
3. **Feedback Imediato**: Usuários esperam respostas instantâneas, especialmente em aplicações gráficas
4. **Validação Matemática**: Verificações preventivas evitam crashes em condições extremas
5. **Persistência Local**: localStorage melhora significativamente a experiência do usuário

### Melhorias Futuras
- Suporte a curvas NURBS com nós não-uniformes
- Importação de pontos via arquivo JSON
- Animações de transição entre estados
- Zoom e pan no canvas
- Múltiplas curvas simultâneas

## Funcionalidades

### Curvas de Bézier
-  Implementação do algoritmo de De Casteljau
-  Adição, edição e remoção de pontos de controle interativos
-  Pesos ajustáveis para cada ponto (NURBS)
-  Visualização em tempo real
-  Grau variável baseado no número de pontos

### B-Splines
-  Interpolação B-spline com grau variável (1-5)
-  Controle de grau da curva (Linear, Quadrática, Cúbica, Quártica, Quíntica)
-  Passo de interpolação ajustável (0.001 a 0.1)
-  Reutilização de pontos da aba Bézier
-  Geração automática de vetor de nós
-  Renderização imediata ao alterar parâmetros

### Interface Interativa
-  Canvas HTML5 com interação por mouse
-  Sistema de abas para alternar entre tipos de curva
-  Controles em tempo real para coordenadas e pesos
-  Lista visual de pontos de controle (numeração 1-based)
-  Exportação de dados em formato JSON
-  Feedback visual com coordenadas do mouse
-  Persistência automática no localStorage

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
- **Grau da Curva**: Selecione grau 1-5 (Linear, Quadrática, Cúbica, Quártica, Quíntica)
- **Passo de Interpolação**: Controle a suavidade/precisão (0.001 a 0.1)
- **Copiar Pontos de Bézier**: Importa pontos da aba Bézier
- **Renderização Imediata**: Mudanças de grau/passo refletem instantaneamente na curva

### Exportação de Dados

Clique em **"Exportar JSON"** para baixar os dados da curva atual:

```json
{
  "type": "spline",
  "degree": 3,
  "interpolationStep": 0.01,
  "controlPoints": [
    {"x": 100, "y": 300, "weight": 1.0},
    {"x": 200, "y": 100, "weight": 1.2},
    {"x": 300, "y": 200, "weight": 0.8},
    {"x": 400, "y": 150, "weight": 1.0}
  ],
  "settings": {
    "steps": 100,
    "showConstructionLines": true
  },
  "metadata": {
    "exportDate": "2025-11-22T10:30:00.000Z",
    "version": "1.0"
  }
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

-  **HTML5, CSS3 e JavaScript puro** - Sem frameworks obrigatórios
-  **Elemento `<canvas>`** - Para renderização das curvas
-  **Estrutura modular** - Separação clara de responsabilidades
-  **Algoritmos manuais** - De Casteljau e B-spline implementados do zero
-  **Interface interativa** - Manipulação direta no canvas
-  **Exportação JSON** - Dados estruturados exportáveis
