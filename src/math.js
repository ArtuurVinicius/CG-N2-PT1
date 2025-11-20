/**
 * Módulo de Cálculos Matemáticos para Curvas Paramétricas
 * Implementa algoritmos para curvas de Bézier e B-Splines
 */

const CurveMath = {
    /**
     * Algoritmo de De Casteljau para curvas de Bézier
     * @param {Array} controlPoints - Array de pontos de controle {x, y, weight}
     * @param {number} t - Parâmetro t entre 0 e 1
     * @returns {Object} Ponto calculado {x, y}
     */
    deCasteljauBezier(controlPoints, t) {
        if (controlPoints.length === 0) return null;
        if (controlPoints.length === 1) return {
            x: controlPoints[0].x,
            y: controlPoints[0].y
        };

        // Implementação do algoritmo de De Casteljau com pesos (NURBS)
        let points = controlPoints.map(p => ({
            x: p.x * p.weight,
            y: p.y * p.weight,
            weight: p.weight
        }));

        // Redução recursiva usando interpolação linear
        while (points.length > 1) {
            const newPoints = [];
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];
                
                newPoints.push({
                    x: p1.x * (1 - t) + p2.x * t,
                    y: p1.y * (1 - t) + p2.y * t,
                    weight: p1.weight * (1 - t) + p2.weight * t
                });
            }
            points = newPoints;
        }

        const finalPoint = points[0];
        // Divisão homogênea para obter coordenadas cartesianas
        if (finalPoint.weight !== 0) {
            return {
                x: finalPoint.x / finalPoint.weight,
                y: finalPoint.y / finalPoint.weight
            };
        }
        
        return { x: finalPoint.x, y: finalPoint.y };
    },

    /**
     * Gera uma curva de Bézier completa
     * @param {Array} controlPoints - Array de pontos de controle
     * @param {number} steps - Número de pontos a gerar (default: 100)
     * @returns {Array} Array de pontos da curva
     */
    generateBezierCurve(controlPoints, steps = 100) {
        if (controlPoints.length < 2) return [];

        const curve = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const point = this.deCasteljauBezier(controlPoints, t);
            if (point) curve.push(point);
        }
        return curve;
    },

    /**
     * Calcula as funções base B-spline
     * @param {number} i - Índice da função base
     * @param {number} k - Grau + 1
     * @param {number} t - Parâmetro
     * @param {Array} knots - Vetor de nós
     * @returns {number} Valor da função base
     */
    basisFunction(i, k, t, knots) {
        if (k === 1) {
            return (knots[i] <= t && t < knots[i + 1]) ? 1 : 0;
        }

        let left = 0, right = 0;

        // Primeira parte da fórmula recursiva
        if (knots[i + k - 1] !== knots[i]) {
            left = ((t - knots[i]) / (knots[i + k - 1] - knots[i])) * 
                   this.basisFunction(i, k - 1, t, knots);
        }

        // Segunda parte da fórmula recursiva
        if (knots[i + k] !== knots[i + 1]) {
            right = ((knots[i + k] - t) / (knots[i + k] - knots[i + 1])) * 
                    this.basisFunction(i + 1, k - 1, t, knots);
        }

        return left + right;
    },

    /**
     * Gera vetor de nós uniformes
     * @param {number} n - Número de pontos de controle
     * @param {number} degree - Grau da curva
     * @returns {Array} Vetor de nós
     */
    generateUniformKnots(n, degree) {
        const knotCount = n + degree + 1;
        const knots = [];

        // Nós múltiplos no início
        for (let i = 0; i <= degree; i++) {
            knots.push(0);
        }

        // Nós internos uniformes
        const internalKnots = n - degree;
        for (let i = 1; i < internalKnots; i++) {
            knots.push(i / internalKnots);
        }

        // Nós múltiplos no final
        for (let i = 0; i <= degree; i++) {
            knots.push(1);
        }

        return knots;
    },

    /**
     * Calcula um ponto na curva B-spline
     * @param {Array} controlPoints - Pontos de controle
     * @param {number} t - Parâmetro
     * @param {number} degree - Grau da curva
     * @param {Array} knots - Vetor de nós (opcional)
     * @returns {Object} Ponto calculado {x, y}
     */
    bSplinePoint(controlPoints, t, degree, knots = null) {
        if (controlPoints.length === 0) return null;

        const n = controlPoints.length;
        if (n < degree + 1) return null;

        // Gera vetor de nós se não fornecido
        if (!knots) {
            knots = this.generateUniformKnots(n, degree);
        }

        // Ajusta t para estar no domínio válido
        const validRange = [knots[degree], knots[n]];
        t = Math.max(validRange[0], Math.min(validRange[1], t));

        let x = 0, y = 0, weightSum = 0;

        // Calcula o ponto usando as funções base
        for (let i = 0; i < n; i++) {
            const basis = this.basisFunction(i, degree + 1, t, knots);
            const weight = controlPoints[i].weight || 1;
            const totalWeight = basis * weight;

            x += controlPoints[i].x * totalWeight;
            y += controlPoints[i].y * totalWeight;
            weightSum += totalWeight;
        }

        // Normalização para NURBS
        if (weightSum !== 0) {
            return { x: x / weightSum, y: y / weightSum };
        }

        return { x, y };
    },

    /**
     * Gera uma curva B-spline completa
     * @param {Array} controlPoints - Pontos de controle
     * @param {number} degree - Grau da curva
     * @param {number} steps - Número de pontos a gerar
     * @param {Array} knots - Vetor de nós (opcional)
     * @returns {Array} Array de pontos da curva
     */
    generateBSplineCurve(controlPoints, degree = 3, steps = 100, knots = null) {
        if (controlPoints.length < degree + 1) return [];

        const n = controlPoints.length;
        if (!knots) {
            knots = this.generateUniformKnots(n, degree);
        }

        const curve = [];
        const validRange = [knots[degree], knots[n]];
        
        for (let i = 0; i <= steps; i++) {
            const t = validRange[0] + (i / steps) * (validRange[1] - validRange[0]);
            const point = this.bSplinePoint(controlPoints, t, degree, knots);
            if (point) curve.push(point);
        }

        return curve;
    },

    /**
     * Calcula a distância entre dois pontos
     * @param {Object} p1 - Primeiro ponto {x, y}
     * @param {Object} p2 - Segundo ponto {x, y}
     * @returns {number} Distância euclidiana
     */
    distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    },

    /**
     * Encontra o ponto de controle mais próximo a uma coordenada
     * @param {Array} controlPoints - Array de pontos de controle
     * @param {Object} targetPoint - Ponto alvo {x, y}
     * @param {number} threshold - Distância máxima para considerar (default: 15)
     * @returns {number} Índice do ponto encontrado ou -1
     */
    findNearestControlPoint(controlPoints, targetPoint, threshold = 15) {
        let nearestIndex = -1;
        let minDistance = threshold;

        for (let i = 0; i < controlPoints.length; i++) {
            const distance = this.distance(controlPoints[i], targetPoint);
            if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = i;
            }
        }

        return nearestIndex;
    },

    /**
     * Valida se um conjunto de pontos pode formar uma curva válida
     * @param {Array} controlPoints - Pontos de controle
     * @param {string} curveType - Tipo de curva ('bezier' ou 'spline')
     * @param {number} degree - Grau da curva (para splines)
     * @returns {boolean} True se válido
     */
    validateCurve(controlPoints, curveType, degree = 3) {
        if (!controlPoints || controlPoints.length === 0) return false;

        if (curveType === 'bezier') {
            return controlPoints.length >= 2;
        } else if (curveType === 'spline') {
            return controlPoints.length >= degree + 1;
        }

        return false;
    },

    /**
     * Calcula o boundingBox de um conjunto de pontos
     * @param {Array} points - Array de pontos {x, y}
     * @returns {Object} Bounding box {minX, minY, maxX, maxY, width, height}
     */
    getBoundingBox(points) {
        if (points.length === 0) return null;

        let minX = points[0].x, maxX = points[0].x;
        let minY = points[0].y, maxY = points[0].y;

        for (const point of points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }

        return {
            minX, minY, maxX, maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
};

// Exporta o módulo para uso global
window.CurveMath = CurveMath;