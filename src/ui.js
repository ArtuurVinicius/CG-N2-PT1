/**
 * Módulo de Interface do Usuário
 * Gerencia eventos de mouse, teclado e interações com a interface
 */

const UI = {
    canvas: null,
    isDragging: false,
    dragStartPoint: null,
    selectedPointIndex: -1,
    hoveredPointIndex: -1,
    lastClickTime: 0,
    doubleClickDelay: 300,
    
    // Callbacks para eventos
    onPointAdd: null,
    onPointMove: null,
    onPointRemove: null,
    onPointSelect: null,
    onMouseMove: null,
    onFindPointAt: null,
    onSplineParameterChange: null,

    /**
     * Inicializa o sistema de UI
     * @param {HTMLCanvasElement} canvas - Elemento canvas
     * @param {Object} callbacks - Callbacks para eventos
     */
    init(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.onPointAdd = callbacks.onPointAdd || (() => {});
        this.onPointMove = callbacks.onPointMove || (() => {});
        this.onPointRemove = callbacks.onPointRemove || (() => {});
        this.onPointSelect = callbacks.onPointSelect || (() => {});
        this.onMouseMove = callbacks.onMouseMove || (() => {});
        this.onFindPointAt = callbacks.onFindPointAt || null;
        this.onSplineParameterChange = callbacks.onSplineParameterChange || (() => {});

        this.setupEventListeners();
        this.setupControlListeners();
    },

    /**
     * Configura event listeners para o canvas
     */
    setupEventListeners() {
        // Eventos de mouse no canvas
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        
        // Previne menu de contexto
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Eventos de teclado
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    },

    /**
     * Configura listeners para controles da interface
     */
    setupControlListeners() {
        // Slider e input de peso
        const weightSlider = document.getElementById('weight-slider');
        const weightValue = document.getElementById('weight-value');
        
        if (weightSlider && weightValue) {
            weightSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                weightValue.value = value;
                this.updatePointWeight(this.selectedPointIndex, value);
            });

            weightValue.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value) || 1;
                weightSlider.value = value;
                this.updatePointWeight(this.selectedPointIndex, value);
            });
        }

        // Inputs de coordenadas
        const pointX = document.getElementById('point-x');
        const pointY = document.getElementById('point-y');

        if (pointX && pointY) {
            pointX.addEventListener('change', (e) => {
                const x = parseFloat(e.target.value);
                if (!isNaN(x) && this.selectedPointIndex >= 0) {
                    this.updatePointCoordinates(this.selectedPointIndex, x, null);
                }
            });

            pointY.addEventListener('change', (e) => {
                const y = parseFloat(e.target.value);
                if (!isNaN(y) && this.selectedPointIndex >= 0) {
                    this.updatePointCoordinates(this.selectedPointIndex, null, y);
                }
            });
        }

        // Slider de passo de interpolação para splines
        const splineStep = document.getElementById('spline-step');
        const splineStepValue = document.getElementById('spline-step-value');

        if (splineStep && splineStepValue) {
            splineStep.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (Number.isNaN(value)) {
                    return;
                }
                splineStepValue.textContent = value.toFixed(3);
                this.onSplineParameterChange({ step: value });
            });
        }

        // Select de grau da spline
        const splineDegree = document.getElementById('spline-degree');
        if (splineDegree) {
            splineDegree.addEventListener('change', (e) => {
                const value = parseInt(e.target.value, 10);
                if (!Number.isNaN(value)) {
                    this.onSplineParameterChange({ degree: value });
                }
            });
        }
    },

    /**
     * Manipula eventos de mouse down
     * @param {MouseEvent} e - Evento de mouse
     */
    handleMouseDown(e) {
        const coords = Renderer.getCanvasCoordinates(e.clientX, e.clientY);
        const currentTime = Date.now();
        
        // Verifica se clicou em um ponto existente
        const pointIndex = this.findPointAt(coords);
        
        if (pointIndex >= 0) {
            // Clicou em um ponto existente
            this.selectedPointIndex = pointIndex;
            this.isDragging = true;
            this.dragStartPoint = coords;
            this.selectPoint(pointIndex);
            
            // Verifica duplo clique
            if (currentTime - this.lastClickTime < this.doubleClickDelay) {
                this.handleDoubleClick(e);
                return;
            }
        } else {
            // Clicou no espaço vazio - adiciona novo ponto
            this.onPointAdd(coords.x, coords.y);
            this.selectedPointIndex = -1;
        }
        
        this.lastClickTime = currentTime;
        this.canvas.style.cursor = this.isDragging ? 'grabbing' : 'crosshair';
    },

    /**
     * Manipula eventos de mouse move
     * @param {MouseEvent} e - Evento de mouse
     */
    handleMouseMove(e) {
        const coords = Renderer.getCanvasCoordinates(e.clientX, e.clientY);
        
        // Atualiza callback de movimento do mouse
        this.onMouseMove(coords);

        if (this.isDragging && this.selectedPointIndex >= 0) {
            // Arrasta ponto selecionado
            this.onPointMove(this.selectedPointIndex, coords.x, coords.y);
            this.updatePointInputs(this.selectedPointIndex, coords.x, coords.y);
        } else {
            // Verifica hover sobre pontos
            const hoveredIndex = this.findPointAt(coords);
            
            if (hoveredIndex !== this.hoveredPointIndex) {
                this.hoveredPointIndex = hoveredIndex;
                this.updateCursor(hoveredIndex >= 0);
            }
        }
    },

    /**
     * Manipula eventos de mouse up
     * @param {MouseEvent} e - Evento de mouse
     */
    handleMouseUp(e) {
        this.isDragging = false;
        this.dragStartPoint = null;
        this.canvas.style.cursor = this.hoveredPointIndex >= 0 ? 'pointer' : 'crosshair';
    },

    /**
     * Manipula quando o mouse sai do canvas
     * @param {MouseEvent} e - Evento de mouse
     */
    handleMouseLeave(e) {
        this.isDragging = false;
        this.hoveredPointIndex = -1;
        this.canvas.style.cursor = 'crosshair';
    },

    /**
     * Manipula duplo clique
     * @param {MouseEvent} e - Evento de mouse
     */
    handleDoubleClick(e) {
        e.preventDefault();
        const coords = Renderer.getCanvasCoordinates(e.clientX, e.clientY);
        const pointIndex = this.findPointAt(coords);
        
        if (pointIndex >= 0) {
            this.onPointRemove(pointIndex);
            this.selectedPointIndex = -1;
            this.updateControlsState();
        }
    },

    /**
     * Manipula eventos de teclado
     * @param {KeyboardEvent} e - Evento de teclado
     */
    handleKeyDown(e) {
        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                if (this.selectedPointIndex >= 0) {
                    this.onPointRemove(this.selectedPointIndex);
                    this.selectedPointIndex = -1;
                    this.updateControlsState();
                }
                break;
                
            case 'Escape':
                this.selectedPointIndex = -1;
                this.updateControlsState();
                break;
                
            case 'ArrowUp':
                this.moveSelectedPoint(0, -1);
                e.preventDefault();
                break;
                
            case 'ArrowDown':
                                this.moveSelectedPoint(0, 1);
                e.preventDefault();
                break;
                
            case 'ArrowLeft':
                this.moveSelectedPoint(-1, 0);
                e.preventDefault();
                break;
                
            case 'ArrowRight':
                this.moveSelectedPoint(1, 0);
                e.preventDefault();
                break;
        }
    },

    /**
     * Move o ponto selecionado
     * @param {number} deltaX - Movimento em X
     * @param {number} deltaY - Movimento em Y
     */
    moveSelectedPoint(deltaX, deltaY) {
        if (this.selectedPointIndex >= 0) {
            this.onPointMove(this.selectedPointIndex, deltaX, deltaY, true); // true = movimento relativo
        }
    },

    /**
     * Encontra ponto nas coordenadas especificadas
     * @param {Object} coords - Coordenadas {x, y}
     * @returns {number} Índice do ponto ou -1 se não encontrado
     */
    findPointAt(coords) {
        // Usa o callback para buscar pontos através do app
        if (this.onFindPointAt) {
            return this.onFindPointAt(coords);
        }
        return -1;
    },

    /**
     * Seleciona um ponto
     * @param {number} index - Índice do ponto
     */
    selectPoint(index) {
        this.selectedPointIndex = index;
        this.onPointSelect(index);
        this.updateControlsState();
    },

    /**
     * Atualiza o estado dos controles
     */
    updateControlsState() {
        const hasSelection = this.selectedPointIndex >= 0;
        
        // Habilita/desabilita controles baseado na seleção
        const controls = [
            'point-x', 'point-y', 'weight-slider', 'weight-value'
        ];
        
        controls.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.disabled = !hasSelection;
            }
        });

        if (!hasSelection) {
            this.clearPointInputs();
        }
    },

    /**
     * Atualiza inputs de coordenadas do ponto
     * @param {number} index - Índice do ponto
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     */
    updatePointInputs(index, x, y) {
        if (index === this.selectedPointIndex) {
            const pointX = document.getElementById('point-x');
            const pointY = document.getElementById('point-y');
            
            if (pointX) pointX.value = Math.round(x);
            if (pointY) pointY.value = Math.round(y);
        }
    },

    /**
     * Atualiza peso do ponto selecionado
     * @param {number} index - Índice do ponto
     * @param {number} weight - Novo peso
     */
    updatePointWeight(index, weight) {
        if (index >= 0 && this.onPointWeightChange) {
            this.onPointWeightChange(index, weight);
        }
    },

    /**
     * Atualiza coordenadas do ponto selecionado
     * @param {number} index - Índice do ponto
     * @param {number} x - Nova coordenada X (null para manter atual)
     * @param {number} y - Nova coordenada Y (null para manter atual)
     */
    updatePointCoordinates(index, x, y) {
        if (index >= 0 && this.onPointCoordinateChange) {
            this.onPointCoordinateChange(index, x, y);
        }
    },

    /**
     * Limpa inputs de pontos
     */
    clearPointInputs() {
        const inputs = ['point-x', 'point-y', 'weight-value'];
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        
        const slider = document.getElementById('weight-slider');
        if (slider) slider.value = 1;
    },

    /**
     * Atualiza cursor baseado no estado
     * @param {boolean} overPoint - Se está sobre um ponto
     */
    updateCursor(overPoint) {
        if (this.isDragging) {
            this.canvas.style.cursor = 'grabbing';
        } else if (overPoint) {
            this.canvas.style.cursor = 'grab';
        } else {
            this.canvas.style.cursor = 'crosshair';
        }
    },

    /**
     * Atualiza a lista visual de pontos
     * @param {Array} controlPoints - Array de pontos de controle
     */
    updatePointsList(controlPoints) {
        const container = document.getElementById('points-container');
        if (!container) return;

        container.innerHTML = '';

        controlPoints.forEach((point, index) => {
            const displayIndex = index + 1; // Ajusta exibição para começar em 1
            const pointElement = document.createElement('div');
            pointElement.className = 'point-item';
            if (index === this.selectedPointIndex) {
                pointElement.classList.add('selected');
            }

            pointElement.innerHTML = `
                <h4>Ponto ${displayIndex}</h4>
                <p>X: ${Math.round(point.x)}</p>
                <p>Y: ${Math.round(point.y)}</p>
                <p>Peso: ${point.weight ? point.weight.toFixed(2) : '1.00'}</p>
            `;

            pointElement.addEventListener('click', () => {
                this.selectPoint(index);
                this.loadPointData(point);
            });

            container.appendChild(pointElement);
        });
    },

    /**
     * Carrega dados do ponto nos controles
     * @param {Object} point - Dados do ponto
     */
    loadPointData(point) {
        const pointX = document.getElementById('point-x');
        const pointY = document.getElementById('point-y');
        const weightSlider = document.getElementById('weight-slider');
        const weightValue = document.getElementById('weight-value');

        if (pointX) pointX.value = Math.round(point.x);
        if (pointY) pointY.value = Math.round(point.y);
        
        const weight = point.weight || 1;
        if (weightSlider) weightSlider.value = weight;
        if (weightValue) weightValue.value = weight.toFixed(1);
    },

    /**
     * Atualiza informações do grau da curva
     * @param {number} degree - Grau da curva
     * @param {string} type - Tipo de curva
     */
    updateCurveInfo(degree, type) {
        if (type === 'bezier') {
            const degreeElement = document.getElementById('bezier-degree');
            if (degreeElement) {
                const displayDegree = Math.max(1, degree + 1);
                degreeElement.textContent = displayDegree;
            }
        }
    },

    /**
     * Mantém os controles de spline sincronizados com as configurações atuais
     * @param {Object} settings - Configurações de spline
     */
    updateSplineControls(settings) {
        if (!settings) return;

        const degreeSelect = document.getElementById('spline-degree');
        if (degreeSelect && typeof settings.splineDegree === 'number') {
            degreeSelect.value = settings.splineDegree.toString();
        }

        const stepSlider = document.getElementById('spline-step');
        if (stepSlider && typeof settings.splineStep === 'number') {
            stepSlider.value = settings.splineStep.toString();
        }

        const stepValue = document.getElementById('spline-step-value');
        if (stepValue && typeof settings.splineStep === 'number') {
            stepValue.textContent = settings.splineStep.toFixed(3);
        }
    },

    /**
     * Atualiza coordenadas do mouse
     * @param {Object} coords - Coordenadas {x, y}
     */
    updateMouseCoords(coords) {
        const coordsElement = document.getElementById('mouse-coords');
        if (coordsElement) {
            coordsElement.textContent = `Mouse: (${Math.round(coords.x)}, ${Math.round(coords.y)})`;
        }
    },

    /**
     * Define o índice do ponto selecionado
     * @param {number} index - Índice do ponto
     */
    setSelectedPoint(index) {
        this.selectedPointIndex = index;
        this.updateControlsState();
    },

    /**
     * Define o índice do ponto sob hover
     * @param {number} index - Índice do ponto
     */
    setHoveredPoint(index) {
        this.hoveredPointIndex = index;
    },

    /**
     * Obtém o ponto selecionado
     * @returns {number} Índice do ponto selecionado
     */
    getSelectedPoint() {
        return this.selectedPointIndex;
    },

    /**
     * Obtém o ponto sob hover
     * @returns {number} Índice do ponto sob hover
     */
    getHoveredPoint() {
        return this.hoveredPointIndex;
    }
};

// Exporta o módulo para uso global
window.UI = UI;