/**
 * Aplicação Principal - Visualizador de Curvas Paramétricas
 * Integra todos os módulos e gerencia o estado global da aplicação
 */

const App = {
    // Estado da aplicação
    canvas: null,
    currentCurve: [],
    isInitialized: false,
    animationFrame: null,

    /**
     * Inicializa a aplicação
     */
    init() {
        if (this.isInitialized) return;

        try {
            // Inicializa módulos
            DataManager.init();
            
            // Configura canvas
            this.canvas = document.getElementById('canvas');
            if (!this.canvas) {
                throw new Error('Canvas não encontrado');
            }

            Renderer.init(this.canvas);

            // Configura UI com callbacks
            UI.init(this.canvas, {
                onPointAdd: (x, y) => this.addPoint(x, y),
                onPointMove: (index, x, y, relative) => this.movePoint(index, x, y, relative),
                onPointRemove: (index) => this.removePoint(index),
                onPointSelect: (index) => this.selectPoint(index),
                onMouseMove: (coords) => this.handleMouseMove(coords),
                onFindPointAt: (coords) => this.findPointAt(coords)
            });

            // Configura callbacks adicionais para UI
            UI.onPointWeightChange = (index, weight) => this.updatePointWeight(index, weight);
            UI.onPointCoordinateChange = (index, x, y) => this.updatePointCoordinates(index, x, y);
            UI.onSplineParameterChange = () => this.updateCurve();

            // Configura callback para mudanças de dados
            DataManager.onDataChanged = () => this.refresh();

            // Carrega estado inicial
            this.loadInitialState();
            
            // Configura event listeners adicionais
            this.setupEventListeners();

            // Renderiza estado inicial
            this.render();

            this.isInitialized = true;
            console.log('Aplicação inicializada com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            this.showError('Erro ao inicializar aplicação: ' + error.message);
        }
    },

    /**
     * Carrega estado inicial da aplicação
     */
    loadInitialState() {
        const currentTab = DataManager.getCurrentTab();
        this.switchTab(currentTab);
        this.updateCurve();
        this.updateUI();
    },

    /**
     * Configura event listeners adicionais
     */
    setupEventListeners() {
        // Redimensionamento da janela
        window.addEventListener('resize', () => this.handleResize());
        
        // Prevenção de comportamentos padrão
        document.addEventListener('dragover', e => e.preventDefault());
        document.addEventListener('drop', e => e.preventDefault());
    },

    /**
     * Adiciona um novo ponto de controle
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     */
    addPoint(x, y) {
        const index = DataManager.addControlPoint(x, y);
        this.updateCurve();
        this.updateUI();
        this.selectPoint(index);
        this.render();
    },

    /**
     * Move um ponto de controle
     * @param {number} index - Índice do ponto
     * @param {number} x - Nova coordenada X
     * @param {number} y - Nova coordenada Y
     * @param {boolean} relative - Se o movimento é relativo
     */
    movePoint(index, x, y, relative = false) {
        if (DataManager.updateControlPoint(index, x, y, null, relative)) {
            this.updateCurve();
            this.updateUI();
            this.render();
        }
    },

    /**
     * Remove um ponto de controle
     * @param {number} index - Índice do ponto
     */
    removePoint(index) {
        if (DataManager.removeControlPoint(index)) {
            this.updateCurve();
            this.updateUI();
            this.render();
        }
    },

    /**
     * Seleciona um ponto de controle
     * @param {number} index - Índice do ponto
     */
    selectPoint(index) {
        const points = DataManager.getControlPoints();
        if (index >= 0 && index < points.length) {
            UI.selectPoint(index);
            UI.loadPointData(points[index]);
        }
        this.render();
    },

    /**
     * Atualiza o peso de um ponto
     * @param {number} index - Índice do ponto
     * @param {number} weight - Novo peso
     */
    updatePointWeight(index, weight) {
        if (DataManager.updatePointWeight(index, weight)) {
            this.updateCurve();
            this.render();
        }
    },

    /**
     * Atualiza coordenadas de um ponto
     * @param {number} index - Índice do ponto
     * @param {number} x - Nova coordenada X
     * @param {number} y - Nova coordenada Y
     */
    updatePointCoordinates(index, x, y) {
        if (DataManager.updateControlPoint(index, x, y)) {
            this.updateCurve();
            this.updateUI();
            this.render();
        }
    },

    /**
     * Encontra ponto nas coordenadas especificadas
     * @param {Object} coords - Coordenadas {x, y}
     * @returns {number} Índice do ponto ou -1
     */
    findPointAt(coords) {
        return DataManager.findNearestPoint(coords);
    },

    /**
     * Manipula movimento do mouse
     * @param {Object} coords - Coordenadas do mouse
     */
    handleMouseMove(coords) {
        UI.updateMouseCoords(coords);
        
        // Atualiza ponto sob hover
        const hoveredIndex = this.findPointAt(coords);
        UI.setHoveredPoint(hoveredIndex);
        
        if (hoveredIndex !== UI.getHoveredPoint()) {
            this.render();
        }
    },

    /**
     * Atualiza a curva atual
     */
    updateCurve() {
        const currentTab = DataManager.getCurrentTab();
        const points = DataManager.getControlPoints();
        const settings = DataManager.getSettings();

        if (points.length < 2) {
            this.currentCurve = [];
            return;
        }

        try {
            if (currentTab === 'bezier') {
                this.currentCurve = CurveMath.generateBezierCurve(points, settings.bezierSteps);
            } else {
                const degree = parseInt(document.getElementById('spline-degree')?.value || settings.splineDegree);
                const step = parseFloat(document.getElementById('spline-step')?.value || settings.splineStep);
                const steps = Math.ceil(1 / step);
                
                this.currentCurve = CurveMath.generateBSplineCurve(points, degree, steps);
            }
        } catch (error) {
            console.error('Erro ao gerar curva:', error);
            this.currentCurve = [];
        }
    },

    /**
     * Atualiza elementos da interface
     */
    updateUI() {
        const currentTab = DataManager.getCurrentTab();
        const points = DataManager.getControlPoints();
        const statistics = DataManager.getCurveStatistics();

        // Atualiza lista de pontos
        UI.updatePointsList(points);

        // Atualiza informações da curva
        UI.updateCurveInfo(statistics.degree, currentTab);

        // Atualiza validação
        const validation = DataManager.validateCurrentCurve();
        this.updateValidationUI(validation);
    },

    /**
     * Atualiza UI de validação
     * @param {Object} validation - Resultado da validação
     */
    updateValidationUI(validation) {
        // Aqui você pode adicionar indicadores visuais de validação
        if (!validation.isValid) {
            console.warn('Curva inválida:', validation.errors);
        }
    },

    /**
     * Renderiza a cena atual
     */
    render() {
        const currentTab = DataManager.getCurrentTab();
        const points = DataManager.getControlPoints();
        const settings = DataManager.getSettings();

        const scene = {
            controlPoints: points,
            curve: this.currentCurve,
            selectedPoint: UI.getSelectedPoint(),
            hoveredPoint: UI.getHoveredPoint(),
            showConstructionLines: settings.showConstructionLines,
            showDebugInfo: settings.showDebugInfo,
            curveType: currentTab
        };

        Renderer.renderScene(scene);
    },

    /**
     * Alterna entre abas
     * @param {string} tab - Nome da aba ('bezier' ou 'spline')
     */
    switchTab(tab) {
        if (tab !== 'bezier' && tab !== 'spline') return;

        // Atualiza DataManager
        DataManager.setCurrentTab(tab);

        // Atualiza interface visual
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Ativa aba selecionada
        const activeButton = document.querySelector(`[onclick="app.switchTab('${tab}')"]`);
        const activeContent = document.getElementById(`${tab}-tab`);
        
        if (activeButton) activeButton.classList.add('active');
        if (activeContent) activeContent.classList.add('active');

        // Limpa seleção e atualiza
        UI.setSelectedPoint(-1);
        this.updateCurve();
        this.updateUI();
        this.render();
    },

    /**
     * Limpa todos os pontos da aba atual
     */
    clearPoints() {
        DataManager.clearControlPoints();
        UI.setSelectedPoint(-1);
        this.currentCurve = [];
        this.updateUI();
        this.render();
    },

    /**
     * Copia pontos de Bézier para Spline
     */
    copyFromBezier() {
        DataManager.copyBezierToSpline();
        if (DataManager.getCurrentTab() === 'spline') {
            this.updateCurve();
            this.updateUI();
            this.render();
        }
    },

    /**
     * Exporta dados da curva atual
     */
    exportData() {
        try {
            const data = DataManager.exportCurveData();
            const jsonString = JSON.stringify(data, null, 2);
            
            // Cria download do arquivo
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `curva_${data.type}_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            // Mostra preview no console
            console.log('Dados exportados:', data);
            
            // Feedback visual
            this.showSuccess('Dados exportados com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar:', error);
            this.showError('Erro ao exportar dados');
        }
    },

    /**
     * Importa dados de curva
     * @param {Object} data - Dados para importar
     */
    importData(data) {
        try {
            if (DataManager.importCurveData(data)) {
                this.updateCurve();
                this.updateUI();
                this.render();
                this.showSuccess('Dados importados com sucesso!');
                return true;
            } else {
                this.showError('Formato de dados inválido');
                return false;
            }
        } catch (error) {
            console.error('Erro ao importar:', error);
            this.showError('Erro ao importar dados');
            return false;
        }
    },

    /**
     * Atualiza toda a aplicação
     */
    refresh() {
        this.updateCurve();
        this.updateUI();
        this.render();
    },

    /**
     * Manipula redimensionamento da janela
     */
    handleResize() {
        // Debounce para evitar chamadas excessivas
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.render();
        }, 250);
    },

    /**
     * Mostra mensagem de sucesso
     * @param {string} message - Mensagem
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    },

    /**
     * Mostra mensagem de erro
     * @param {string} message - Mensagem
     */
    showError(message) {
        this.showNotification(message, 'error');
    },

    /**
     * Mostra notificação
     * @param {string} message - Mensagem
     * @param {string} type - Tipo ('success', 'error', 'warning')
     */
    showNotification(message, type = 'info') {
        // Implementação simples com alert
        // Em uma aplicação real, você usaria um sistema de notificações mais sofisticado
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        console.log(`${icon} ${message}`);
        
        // Feedback visual temporário
        const originalTitle = document.title;
        document.title = `${icon} ${message}`;
        setTimeout(() => {
            document.title = originalTitle;
        }, 3000);
    },

    /**
     * Obtém estatísticas da aplicação
     * @returns {Object} Estatísticas
     */
    getStatistics() {
        const bezierStats = DataManager.getCurveStatistics('bezier');
        const splineStats = DataManager.getCurveStatistics('spline');
        
        return {
            bezier: bezierStats,
            spline: splineStats,
            currentTab: DataManager.getCurrentTab(),
            settings: DataManager.getSettings(),
            curvePoints: this.currentCurve.length
        };
    },

    /**
     * Método para depuração
     * @returns {Object} Estado interno da aplicação
     */
    debug() {
        return {
            isInitialized: this.isInitialized,
            currentCurveLength: this.currentCurve.length,
            dataManager: DataManager.state,
            statistics: this.getStatistics(),
            validation: DataManager.validateCurrentCurve()
        };
    }
};

// Inicializa automaticamente quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Exporta para uso global
window.app = App;