/**
 * Módulo de Renderização para Canvas
 * Responsável por desenhar curvas, pontos de controle e elementos gráficos
 */

const Renderer = {
    canvas: null,
    ctx: null,

    /**
     * Inicializa o renderer com o canvas
     * @param {HTMLCanvasElement} canvas - Elemento canvas
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Configurações iniciais do contexto
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Habilita antialiasing para linhas mais suaves
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    },

    /**
     * Limpa todo o canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenha grid de fundo sutil
        this.drawGrid();
    },

    /**
     * Desenha um grid de fundo sutil
     */
    drawGrid() {
        const gridSize = 20;
        const width = this.canvas.width;
        const height = this.canvas.height;

        this.ctx.save();
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 0.5;
        this.ctx.globalAlpha = 0.3;

        // Linhas verticais
        for (let x = 0; x <= width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }

        // Linhas horizontais
        for (let y = 0; y <= height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    },

    /**
     * Desenha um ponto de controle
     * @param {Object} point - Ponto {x, y, weight}
     * @param {number} index - Índice do ponto
     * @param {boolean} isSelected - Se o ponto está selecionado
     * @param {boolean} isHovered - Se o mouse está sobre o ponto
     */
    drawControlPoint(point, index, isSelected = false, isHovered = false) {
        const radius = 6;
        const weight = point.weight || 1;
        
        this.ctx.save();

        // Círculo externo (indicador de peso)
        if (weight !== 1) {
            const weightRadius = radius + (weight - 1) * 3;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, weightRadius, 0, 2 * Math.PI);
            this.ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#667eea';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }

        // Círculo principal do ponto
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);

        if (isSelected) {
            this.ctx.fillStyle = '#2196f3';
            this.ctx.strokeStyle = '#1976d2';
            this.ctx.lineWidth = 3;
        } else if (isHovered) {
            this.ctx.fillStyle = '#64b5f6';
            this.ctx.strokeStyle = '#1976d2';
            this.ctx.lineWidth = 2;
        } else {
            this.ctx.fillStyle = '#667eea';
            this.ctx.strokeStyle = '#4a5dc7';
            this.ctx.lineWidth = 2;
        }

        this.ctx.fill();
        this.ctx.stroke();

        // Número do ponto
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(index.toString(), point.x, point.y);

        // Label com coordenadas
        const labelX = point.x + 15;
        const labelY = point.y - 15;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`P${index} (${Math.round(point.x)}, ${Math.round(point.y)})`, labelX, labelY);
        
        if (weight !== 1) {
            this.ctx.fillText(`w: ${weight.toFixed(1)}`, labelX, labelY + 12);
        }

        this.ctx.restore();
    },

    /**
     * Desenha linhas de construção entre pontos de controle
     * @param {Array} controlPoints - Array de pontos de controle
     */
    drawConstructionLines(controlPoints) {
        if (controlPoints.length < 2) return;

        this.ctx.save();
        this.ctx.strokeStyle = '#bbb';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.globalAlpha = 0.6;

        this.ctx.beginPath();
        this.ctx.moveTo(controlPoints[0].x, controlPoints[0].y);

        for (let i = 1; i < controlPoints.length; i++) {
            this.ctx.lineTo(controlPoints[i].x, controlPoints[i].y);
        }

        this.ctx.stroke();
        this.ctx.restore();
    },

    /**
     * Desenha uma curva
     * @param {Array} curvePoints - Pontos que formam a curva
     * @param {string} color - Cor da curva (default: '#e91e63')
     * @param {number} lineWidth - Espessura da linha (default: 3)
     */
    drawCurve(curvePoints, color = '#e91e63', lineWidth = 3) {
        if (curvePoints.length < 2) return;

        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Desenha a curva com gradiente sutil
        const gradient = this.ctx.createLinearGradient(
            curvePoints[0].x, curvePoints[0].y,
            curvePoints[curvePoints.length - 1].x, curvePoints[curvePoints.length - 1].y
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.adjustColorBrightness(color, -20));
        this.ctx.strokeStyle = gradient;

        this.ctx.beginPath();
        this.ctx.moveTo(curvePoints[0].x, curvePoints[0].y);

        // Usa curvas suaves para uma aparência mais profissional
        if (curvePoints.length === 2) {
            this.ctx.lineTo(curvePoints[1].x, curvePoints[1].y);
        } else {
            for (let i = 1; i < curvePoints.length - 1; i++) {
                const currentPoint = curvePoints[i];
                const nextPoint = curvePoints[i + 1];
                const controlX = (currentPoint.x + nextPoint.x) / 2;
                const controlY = (currentPoint.y + nextPoint.y) / 2;
                
                this.ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY);
            }
            
            // Último ponto
            const lastPoint = curvePoints[curvePoints.length - 1];
            this.ctx.lineTo(lastPoint.x, lastPoint.y);
        }

        this.ctx.stroke();

        // Destaque nos pontos inicial e final
        this.drawCurveEndpoints(curvePoints, color);

        this.ctx.restore();
    },

    /**
     * Desenha pontos de destaque no início e fim da curva
     * @param {Array} curvePoints - Pontos da curva
     * @param {string} color - Cor base
     */
    drawCurveEndpoints(curvePoints, color) {
        if (curvePoints.length < 2) return;

        const startPoint = curvePoints[0];
        const endPoint = curvePoints[curvePoints.length - 1];

        this.ctx.save();

        // Ponto inicial (círculo)
        this.ctx.beginPath();
        this.ctx.arc(startPoint.x, startPoint.y, 4, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Ponto final (quadrado)
        const size = 6;
        this.ctx.fillRect(endPoint.x - size/2, endPoint.y - size/2, size, size);
        this.ctx.strokeRect(endPoint.x - size/2, endPoint.y - size/2, size, size);

        this.ctx.restore();
    },

    /**
     * Desenha informações de debug/estatísticas
     * @param {Object} info - Informações para exibir
     */
    drawInfo(info) {
        if (!info) return;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 250, Object.keys(info).length * 20 + 20);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';

        let y = 30;
        Object.entries(info).forEach(([key, value]) => {
            this.ctx.fillText(`${key}: ${value}`, 20, y);
            y += 20;
        });

        this.ctx.restore();
    },

    /**
     * Renderiza uma cena completa
     * @param {Object} scene - Objeto com dados da cena
     * @param {Array} scene.controlPoints - Pontos de controle
     * @param {Array} scene.curve - Pontos da curva
     * @param {number} scene.selectedPoint - Índice do ponto selecionado
     * @param {number} scene.hoveredPoint - Índice do ponto sob o mouse
     * @param {boolean} scene.showConstructionLines - Mostrar linhas de construção
     * @param {string} scene.curveType - Tipo de curva ('bezier' ou 'spline')
     */
    renderScene(scene) {
        this.clear();

        // Desenha linhas de construção se habilitadas
        if (scene.showConstructionLines && scene.controlPoints.length > 1) {
            this.drawConstructionLines(scene.controlPoints);
        }

        // Desenha a curva
        if (scene.curve && scene.curve.length > 1) {
            const color = scene.curveType === 'bezier' ? '#e91e63' : '#4caf50';
            this.drawCurve(scene.curve, color);
        }

        // Desenha pontos de controle
        scene.controlPoints.forEach((point, index) => {
            const isSelected = index === scene.selectedPoint;
            const isHovered = index === scene.hoveredPoint;
            this.drawControlPoint(point, index, isSelected, isHovered);
        });

        // Desenha informações de debug se habilitadas
        if (scene.showDebugInfo) {
            const info = {
                'Pontos': scene.controlPoints.length,
                'Tipo': scene.curveType,
                'Grau': scene.controlPoints.length > 0 ? scene.controlPoints.length - 1 : 0
            };
            this.drawInfo(info);
        }
    },

    /**
     * Ajusta o brilho de uma cor
     * @param {string} color - Cor em formato hex
     * @param {number} amount - Quantidade de ajuste (-255 a 255)
     * @returns {string} Nova cor
     */
    adjustColorBrightness(color, amount) {
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        let r = (num >> 16) + amount;
        let g = (num >> 8 & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        r = r > 255 ? 255 : r < 0 ? 0 : r;
        g = g > 255 ? 255 : g < 0 ? 0 : g;
        b = b > 255 ? 255 : b < 0 ? 0 : b;
        return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16);
    },

    /**
     * Converte coordenadas do canvas para coordenadas relativas
     * @param {number} canvasX - Coordenada X no canvas
     * @param {number} canvasY - Coordenada Y no canvas
     * @returns {Object} Coordenadas relativas {x, y}
     */
    getCanvasCoordinates(canvasX, canvasY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (canvasX - rect.left) * scaleX,
            y: (canvasY - rect.top) * scaleY
        };
    },

    /**
     * Anima a transição entre dois estados de curva
     * @param {Array} fromCurve - Curva inicial
     * @param {Array} toCurve - Curva final
     * @param {number} duration - Duração em ms
     * @param {Function} callback - Callback ao finalizar
     */
    animateTransition(fromCurve, toCurve, duration = 500, callback) {
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Interpolação entre curvas
            const interpolatedCurve = this.interpolateCurves(fromCurve, toCurve, progress);
            
            // Renderiza frame da animação
            this.clear();
            this.drawCurve(interpolatedCurve);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (callback) {
                callback();
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * Interpola entre duas curvas
     * @param {Array} curve1 - Primeira curva
     * @param {Array} curve2 - Segunda curva
     * @param {number} t - Fator de interpolação (0-1)
     * @returns {Array} Curva interpolada
     */
    interpolateCurves(curve1, curve2, t) {
        const maxLength = Math.max(curve1.length, curve2.length);
        const interpolated = [];

        for (let i = 0; i < maxLength; i++) {
            const p1 = curve1[i] || curve1[curve1.length - 1];
            const p2 = curve2[i] || curve2[curve2.length - 1];

            interpolated.push({
                x: p1.x + (p2.x - p1.x) * t,
                y: p1.y + (p2.y - p1.y) * t
            });
        }

        return interpolated;
    }
};

// Exporta o módulo para uso global
window.Renderer = Renderer;