/**
 * Módulo de Gerenciamento de Dados
 * Responsável por armazenar, validar e exportar dados de curvas
 */

const DataManager = {
    // Estado atual da aplicação
    state: {
        bezierPoints: [],
        splinePoints: [],
        currentTab: 'bezier',
        settings: {
            showConstructionLines: true,
            showDebugInfo: false,
            bezierSteps: 100,
            splineSteps: 100,
            splineDegree: 3,
            splineStep: 0.01
        }
    },

    /**
     * Inicializa o gerenciador de dados
     */
    init() {
        this.loadSettings();
        this.setupStorageHandlers();
    },

    /**
     * Adiciona um novo ponto de controle
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @param {string} curveType - Tipo de curva ('bezier' ou 'spline')
     * @returns {number} Índice do ponto adicionado
     */
    addControlPoint(x, y, curveType = null) {
        const type = curveType || this.state.currentTab;
        const point = {
            x: Math.round(x),
            y: Math.round(y),
            weight: 1.0,
            id: this.generateId()
        };

        const points = this.getControlPoints(type);
        points.push(point);
        
        this.saveToLocalStorage();
        return points.length - 1;
    },

    /**
     * Remove um ponto de controle
     * @param {number} index - Índice do ponto
     * @param {string} curveType - Tipo de curva ('bezier' ou 'spline')
     * @returns {boolean} True se removido com sucesso
     */
    removeControlPoint(index, curveType = null) {
        const type = curveType || this.state.currentTab;
        const points = this.getControlPoints(type);
        
        if (index >= 0 && index < points.length) {
            points.splice(index, 1);
            this.saveToLocalStorage();
            return true;
        }
        return false;
    },

    /**
     * Atualiza a posição de um ponto de controle
     * @param {number} index - Índice do ponto
     * @param {number} x - Nova coordenada X
     * @param {number} y - Nova coordenada Y
     * @param {string} curveType - Tipo de curva ('bezier' ou 'spline')
     * @param {boolean} relative - Se o movimento é relativo
     * @returns {boolean} True se atualizado com sucesso
     */
    updateControlPoint(index, x, y, curveType = null, relative = false) {
        const type = curveType || this.state.currentTab;
        const points = this.getControlPoints(type);
        
        if (index >= 0 && index < points.length) {
            if (relative) {
                points[index].x += x;
                points[index].y += y;
            } else {
                if (x !== null) points[index].x = Math.round(x);
                if (y !== null) points[index].y = Math.round(y);
            }
            this.saveToLocalStorage();
            return true;
        }
        return false;
    },

    /**
     * Atualiza o peso de um ponto de controle
     * @param {number} index - Índice do ponto
     * @param {number} weight - Novo peso
     * @param {string} curveType - Tipo de curva ('bezier' ou 'spline')
     * @returns {boolean} True se atualizado com sucesso
     */
    updatePointWeight(index, weight, curveType = null) {
        const type = curveType || this.state.currentTab;
        const points = this.getControlPoints(type);
        
        if (index >= 0 && index < points.length) {
            points[index].weight = Math.max(0.1, Math.min(3.0, weight));
            this.saveToLocalStorage();
            return true;
        }
        return false;
    },

    /**
     * Obtém os pontos de controle para o tipo especificado
     * @param {string} curveType - Tipo de curva ('bezier' ou 'spline')
     * @returns {Array} Array de pontos de controle
     */
    getControlPoints(curveType = null) {
        const type = curveType || this.state.currentTab;
        return type === 'bezier' ? this.state.bezierPoints : this.state.splinePoints;
    },

    /**
     * Define todos os pontos de controle
     * @param {Array} points - Array de pontos
     * @param {string} curveType - Tipo de curva ('bezier' ou 'spline')
     */
    setControlPoints(points, curveType = null) {
        const type = curveType || this.state.currentTab;
        const validatedPoints = this.validatePoints(points);
        
        if (type === 'bezier') {
            this.state.bezierPoints = validatedPoints;
        } else {
            this.state.splinePoints = validatedPoints;
        }
        
        this.saveToLocalStorage();
    },

    /**
     * Limpa todos os pontos de controle
     * @param {string} curveType - Tipo de curva ('bezier' ou 'spline')
     */
    clearControlPoints(curveType = null) {
        const type = curveType || this.state.currentTab;
        
        if (type === 'bezier') {
            this.state.bezierPoints = [];
        } else {
            this.state.splinePoints = [];
        }
        
        this.saveToLocalStorage();
    },

    /**
     * Copia pontos de Bézier para Spline
     */
    copyBezierToSpline() {
        this.state.splinePoints = this.state.bezierPoints.map(point => ({
            ...point,
            id: this.generateId()
        }));
        this.saveToLocalStorage();
    },

    /**
     * Valida um array de pontos
     * @param {Array} points - Array de pontos
     * @returns {Array} Array de pontos validados
     */
    validatePoints(points) {
        if (!Array.isArray(points)) return [];
        
        return points.filter(point => 
            point &&
            typeof point.x === 'number' &&
            typeof point.y === 'number' &&
            !isNaN(point.x) &&
            !isNaN(point.y)
        ).map(point => ({
            x: Math.round(point.x),
            y: Math.round(point.y),
            weight: Math.max(0.1, Math.min(3.0, point.weight || 1.0)),
            id: point.id || this.generateId()
        }));
    },

    /**
     * Encontra o ponto de controle mais próximo
     * @param {Object} targetPoint - Ponto alvo {x, y}
     * @param {string} curveType - Tipo de curva ('bezier' ou 'spline')
     * @param {number} threshold - Distância máxima
     * @returns {number} Índice do ponto ou -1
     */
    findNearestPoint(targetPoint, curveType = null, threshold = 15) {
        const points = this.getControlPoints(curveType);
        return CurveMath.findNearestControlPoint(points, targetPoint, threshold);
    },

    /**
     * Obtém configurações da aplicação
     * @returns {Object} Objeto com configurações
     */
    getSettings() {
        return { ...this.state.settings };
    },

    /**
     * Atualiza uma configuração
     * @param {string} key - Chave da configuração
     * @param {*} value - Novo valor
     */
    updateSetting(key, value) {
        if (this.state.settings.hasOwnProperty(key)) {
            this.state.settings[key] = value;
            this.saveToLocalStorage();
        }
    },

    /**
     * Define a aba atual
     * @param {string} tab - Nome da aba ('bezier' ou 'spline')
     */
    setCurrentTab(tab) {
        if (tab === 'bezier' || tab === 'spline') {
            this.state.currentTab = tab;
            this.saveToLocalStorage();
        }
    },

    /**
     * Obtém a aba atual
     * @returns {string} Nome da aba atual
     */
    getCurrentTab() {
        return this.state.currentTab;
    },

    /**
     * Exporta dados da curva atual em formato JSON
     * @param {string} curveType - Tipo de curva para exportar
     * @returns {Object} Dados exportáveis
     */
    exportCurveData(curveType = null) {
        const type = curveType || this.state.currentTab;
        const points = this.getControlPoints(type);
        const settings = this.getSettings();

        if (type === 'bezier') {
            return {
                type: 'bezier',
                degree: Math.max(0, points.length - 1),
                controlPoints: points.map(p => ({
                    x: p.x,
                    y: p.y,
                    weight: p.weight
                })),
                settings: {
                    steps: settings.bezierSteps,
                    showConstructionLines: settings.showConstructionLines
                },
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '1.0'
                }
            };
        } else {
            return {
                type: 'spline',
                degree: settings.splineDegree,
                interpolationStep: settings.splineStep,
                controlPoints: points.map(p => ({
                    x: p.x,
                    y: p.y,
                    weight: p.weight
                })),
                settings: {
                    steps: settings.splineSteps,
                    showConstructionLines: settings.showConstructionLines
                },
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '1.0'
                }
            };
        }
    },

    /**
     * Importa dados de curva
     * @param {Object} data - Dados para importar
     * @returns {boolean} True se importado com sucesso
     */
    importCurveData(data) {
        try {
            if (!data.type || !Array.isArray(data.controlPoints)) {
                throw new Error('Formato de dados inválido');
            }

            const points = this.validatePoints(data.controlPoints);
            
            if (data.type === 'bezier') {
                this.state.bezierPoints = points;
            } else if (data.type === 'spline') {
                this.state.splinePoints = points;
                
                // Importa configurações de spline se disponíveis
                if (data.degree) {
                    this.updateSetting('splineDegree', data.degree);
                }
                if (data.interpolationStep) {
                    this.updateSetting('splineStep', data.interpolationStep);
                }
            }

            this.saveToLocalStorage();
            return true;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    },

    /**
     * Salva estado no localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('curveAppState', JSON.stringify(this.state));
        } catch (error) {
            console.warn('Não foi possível salvar no localStorage:', error);
        }
    },

    /**
     * Carrega configurações do localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('curveAppState');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Merge com estado padrão para garantir compatibilidade
                this.state = {
                    ...this.state,
                    ...data,
                    bezierPoints: this.validatePoints(data.bezierPoints || []),
                    splinePoints: this.validatePoints(data.splinePoints || []),
                    settings: {
                        ...this.state.settings,
                        ...data.settings
                    }
                };
            }
        } catch (error) {
            console.warn('Não foi possível carregar configurações:', error);
        }
    },

    /**
     * Configura handlers para eventos de storage
     */
    setupStorageHandlers() {
        // Escuta mudanças no localStorage de outras abas
        window.addEventListener('storage', (e) => {
            if (e.key === 'curveAppState') {
                this.loadSettings();
                // Notifica a aplicação sobre mudanças
                if (this.onDataChanged) {
                    this.onDataChanged();
                }
            }
        });
    },

    /**
     * Gera um ID único para pontos
     * @returns {string} ID único
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Obtém estatísticas da curva atual
     * @param {string} curveType - Tipo de curva
     * @returns {Object} Estatísticas
     */
    getCurveStatistics(curveType = null) {
        const type = curveType || this.state.currentTab;
        const points = this.getControlPoints(type);
        
        if (points.length === 0) {
            return {
                pointCount: 0,
                degree: 0,
                boundingBox: null,
                totalWeight: 0,
                averageWeight: 0
            };
        }

        const boundingBox = CurveMath.getBoundingBox(points);
        const totalWeight = points.reduce((sum, p) => sum + p.weight, 0);
        const availableDegree = Math.max(0, points.length - 1);
        const desiredDegree = typeof this.state.settings.splineDegree === 'number'
            ? this.state.settings.splineDegree
            : 1;
        const splineDegree = Math.min(desiredDegree, availableDegree);
        
        return {
            pointCount: points.length,
            degree: type === 'bezier' ? availableDegree : splineDegree,
            boundingBox,
            totalWeight,
            averageWeight: totalWeight / points.length
        };
    },

    /**
     * Valida se a curva atual é válida
     * @param {string} curveType - Tipo de curva
     * @returns {Object} Resultado da validação
     */
    validateCurrentCurve(curveType = null) {
        const type = curveType || this.state.currentTab;
        const points = this.getControlPoints(type);
        const settings = this.getSettings();

        const isValid = CurveMath.validateCurve(points, type, settings.splineDegree);
        
        let errors = [];
        
        if (points.length === 0) {
            errors.push('Nenhum ponto de controle definido');
        } else if (type === 'bezier' && points.length < 2) {
            errors.push('Curva de Bézier precisa de pelo menos 2 pontos');
        } else if (type === 'spline' && points.length < settings.splineDegree + 1) {
            errors.push(`B-Spline de grau ${settings.splineDegree} precisa de pelo menos ${settings.splineDegree + 1} pontos`);
        }

        return {
            isValid,
            errors,
            warnings: []
        };
    },

    /**
     * Reseta todos os dados para o estado inicial
     */
    reset() {
        this.state = {
            bezierPoints: [],
            splinePoints: [],
            currentTab: 'bezier',
            settings: {
                showConstructionLines: true,
                showDebugInfo: false,
                bezierSteps: 100,
                splineSteps: 100,
                splineDegree: 3,
                splineStep: 0.01
            }
        };
        this.saveToLocalStorage();
    }
};

// Exporta o módulo para uso global
window.DataManager = DataManager;