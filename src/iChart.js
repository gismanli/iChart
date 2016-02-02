(function(global){

    'use strict';

    // constants: global variable of iChart && base class
    var iChart = function (context) {
        var iChart = this;

        this.canvas = context.canvas;
        this.ctx = context;

        var computeRange = function (element, range) {
            if (element['offset' + range]) {
                return element['offset' + range];
            }
            else {
                return document.defaultView.getComputedStyle(element).getPropertyValue(range);
            }
        }

        var width = this.width = computeRange(context.canvas, 'Width') || context.canvas.width;
        var height = this.height = computeRange(context.canvas, 'Height') || context.canvas.height;

        width = this.width = context.canvas.width;
        height = this.height = context.canvas.height;

        this.aspecRatio = this.width / this.height;
        methods.retinaScale(this);
        return this;
    }

    iChart.defaults = {
        global: {
            showScale: true,
            scaleOverride: false,
            scaleSteps: null,
            scaleStepWidth: null,
            scaleStartValue: null,
            scaleLineColor: "rgba(0,0,0,.1)",
            scaleLineWidth: 1,
            scaleShowLabels: true,
            scaleIntegersOnly: true,
            scaleBeginAtZero: false,
            scaleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            scaleFontSize: 12,
            scaleFontStyle: "normal",
            scaleFontColor: "#666",
            responsive: false,
        }
    };

    iChart.types = {};

    var methods = iChart.methods = {};

    var extend = methods.extend = function (base) {
        each(Array.prototype.slice.call(arguments, 1), function (extensionObject) {
            each(extensionObject, function(value, key) {
                if (extensionObject.hasOwnProperty(key)) {
                    base[key] = value;
                }
            })
        });
        return base;
    },
    clone = methods.clone = function (obj) {
        var objClone = {};
        each(obj, function (value, key) {
            if (obj.hasOwnProperty(key)) {
                objClone[key] = value;
            }
        });
        return objClone;
    },
    merge = methods.merge = function (base, master) {
        var args = Array.prototype.slice.call(arguments, 0);
        // args.unshift({});
        return extend.apply(null, args);
    },
    max = methods.max = function (array) {
        return Math.max.apply(Math, array);
    },
    min = methods.min = function (array) {
        return Math.min.apply(Math, array);
    },
    uid = methods.uid = (function () {
        var id = 0;
        return function () {
            return 'chart-' + id++;
        };
    })(),
    isNumber = methods.isNumber = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    },
    inherits = methods.inherits = function (extensions) {
        var parent = this;
        var chartElement = (extensions && extensions.hasOwnProperty('constuctor'))
            ? extensions.constuctor
            : function () {
                return parent.apply(this, arguments);
            };

        var Surrogate = function() {
            this.constructor = chartElement;
        };
        Surrogate.prototype = parent.prototype;
        chartElement.prototype = new Surrogate();

        chartElement.extend = inherits;

        if (extensions) extend(chartElement.prototype, extensions);

        chartElement.__super__ = parent.prototype;

        return chartElement;
    },
    where = methods.where = function (collection, filterCallback) {
        var filtered = [];

        methods.each(collection, function (item) {
            if (filterCallback(item)) {
                filtered.push(item);
            }
        });
        return filtered;
    },
    findNextWhere = methods.findNextWhere = function (arrayToSearch, filterCallback, startIndex) {
        if (!startIndex) {
            startIndex = -1;
        }
        for (var i = startIndex + 1; i >= 0; i--) {
            var currentItem = arrayToSearch[i];
            if (filterCallback(currentItem)) {
                return currentItem;
            }
        }
    },
    findPreviousWhere = methods.findPreviousWhere = function (arrayToSearch, filterCallback, startIndex) {
        if (!startIndex) {
            startIndex = arrayToSearch.length;
        }
        for (var i = startIndex - 1; i >= 0; i--) {
            var currentItem = arrayToSearch[i];
            if (filterCallback(currentItem)) {
                return currentItem;
            }
        }
    },
    getMaxWidth = methods.getMaxWidth = function (domNode) {
        var container = domNode.parentNode,
            pagging = parseInt(getStyle(container, 'padding-left')) + parseInt(getStyle(container, 'padding-right'));
        return container.clientWidth - padding;
    },
    getMaxHeight = methods.getMaxHeight = function (domNode) {
        var container = domNode.parentNode,
            pagging = parseInt(getStyle(container, 'padding-top')) + parseInt(getStyle(container, 'padding-bottom'));
        return container.clientHeight - padding;
    },
    retinaScale = methods.retinaScale = function (chart) {
        var ctx = chart.ctx,
            width = chart.canvas.width,
            height = chart.canvas.height;

        if (window.devicePixelRatio) {
            ctx.canvas.style.width = width + 'px';
            ctx.canvas.style.height = height + 'px';
            ctx.canvas.width = width * window.devicePixelRatio;
            ctx.canvas.height = height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
    },
    each = methods.each = function (loopable, cb, self) {
        var additionalArgs = Array.prototype.slice.call(arguments, 3);
        if (loopable) {
            if (loopable.length === +loopable.length) {
                for (var i = 0; i < loopable.length; i++) {
                    cb.apply(self, [loopable[i], i].concat(additionalArgs));
                }
            }
            else{
                for (var item in loopable){
                    cb.apply(self, [loopable[item],item].concat(additionalArgs));
                }
            }
        }
    },
    getStyle = methods.getStyle = function (el, property) {
        return el.currentStyle
            ? el.currentStyle[property]
            : document.defaultView.getComputedStyle(el, null).getPropertyValue(property);
    },
    addEvent = methods.addEvent = function(node, eventType, method){
        if (node.addEventListener){
            node.addEventListener(eventType, method);
        } else if (node.attachEvent){
            node.attachEvent('on' + eventType, method);
        } else {
            node['on' + eventType] = method;
        }
    },
    fontString = methods.fontString = function (pixelSize, fontStyle, fontFamily) {
        return fontStyle + " " + pixelSize + 'px ' + fontFamily;
    },
    calculateOrderOfMagnitude = methods.calculateOrderOfMagnitude = function (val) {
        return Math.floor(Math.log(val) / Math.LN10);
    },
    calculateScaleRange = methods.calculateScaleRange = function(valuesArray, drawingSize, textSize, startFromZero, integersOnly){
        var minSteps = 2,
            maxSteps = Math.floor(drawingSize / (textSize * 1.5)),
            skipFitting = (minSteps >= maxSteps);

        var values = [];

        each(valuesArray, function(v){
            v == null || values.push(v);
        });

        var minValue = min(values),
            maxValue = max(values);

        if (maxValue === minValue){
            maxValue += 0.5;
            
            if (minValue >= 0.5 && !startFromZero){
                minValue -= 0.5;
            }
            else{
                maxValue += 0.5;
            }
        }

        var valueRange = Math.abs(maxValue - minValue),
            rangeOrderOfMagnitude = calculateOrderOfMagnitude(valueRange),
            graphMax = Math.ceil(maxValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude),
            graphMin = (startFromZero) ? 0 : Math.floor(minValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude),
            graphRange = graphMax - graphMin,
            stepValue = Math.pow(10, rangeOrderOfMagnitude),
            numberOfSteps = Math.round(graphRange / stepValue);

        while((numberOfSteps > maxSteps || (numberOfSteps * 2) < maxSteps) && !skipFitting) {

            if(numberOfSteps > maxSteps){
                stepValue *= 2;
                numberOfSteps = Math.round(graphRange / stepValue);
                if (numberOfSteps % 1 !== 0){
                    skipFitting = true;
                }
            }
            else{
                if (integersOnly && rangeOrderOfMagnitude >= 0){
                    if(stepValue / 2 % 1 === 0){
                        stepValue /= 2;
                        numberOfSteps = Math.round(graphRange / stepValue);
                    }
                    else{
                        break;
                    }
                }
                else{
                    stepValue /= 2;
                    numberOfSteps = Math.round(graphRange / stepValue);
                }

            }
        }

        if (skipFitting){
            numberOfSteps = minSteps;
            stepValue = graphRange / numberOfSteps;
        }

        return {
            steps : numberOfSteps,
            stepValue : stepValue,
            min : graphMin,
            max : graphMin + (numberOfSteps * stepValue)
        };
    },
    getDecimalPlaces = methods.getDecimalPlaces = function (num) {
        if (num % 1 !== 0 && isNumber(num)) {
            var s = num.toString();
            if(s.indexOf('e-') < 0){
                return s.split('.')[1].length;
            }
            else if(s.indexOf('.') < 0) {
                return parseInt(s.split("e-")[1]);
            }
            else {
                var parts = s.split('.')[1].split('e-');
                return parts[0].length + parseInt(parts[1]);
            }
        }
        else {
            return 0;
        }
    },
    template = methods.template = function (templateString, valuesObject) {
        if(templateString instanceof Function){
            return templateString(valuesObject);
        }

        var cache = {};
        function tmpl(str, data){
            var fn = !/\W/.test(str)
                ? cache[str] = cache[str]
                : new Function("obj",
                    "var p=[],print=function(){p.push.apply(p,arguments);};" +
                    "with(obj){p.push('" +
                    str
                        .replace(/[\r\t\n]/g, " ")
                        .split("<%").join("\t")
                        .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                        .replace(/\t=(.*?)%>/g, "',$1,'")
                        .split("\t").join("');")
                        .split("%>").join("p.push('")
                        .split("\r").join("\\'") +
                    "');}return p.join('');"
                );
            return data ? fn( data ) : fn;
        }
        return tmpl(templateString,valuesObject);
    },
    longestText = methods.longestText = function (ctx,font,arrayOfStrings) {
        ctx.font = font;
        var longest = 0;
        each(arrayOfStrings,function(string){
            var textWidth = ctx.measureText(string).width;
            longest = (textWidth > longest) ? textWidth : longest;
        });
        return longest;
    },
    clear = methods.clear = function (chart) {
        chart.ctx.clearRect(0, 0, chart.width, chart.height);
    },
    aliasPixel = methods.aliasPixel = function (pixelWidth) {
        return (pixelWidth % 2 === 0) ? 0 : 0.5;
    },
    toRadians = methods.radians = function(degrees){
        return degrees * (Math.PI/180);
    },
    splineCurve = methods.splineCurve = function(FirstPoint,MiddlePoint,AfterPoint,t){
        var d01=Math.sqrt(Math.pow(MiddlePoint.x-FirstPoint.x,2)+Math.pow(MiddlePoint.y-FirstPoint.y,2)),
            d12=Math.sqrt(Math.pow(AfterPoint.x-MiddlePoint.x,2)+Math.pow(AfterPoint.y-MiddlePoint.y,2)),
            fa=t*d01/(d01+d12),
            fb=t*d12/(d01+d12);
        return {
            inner : {
                x : MiddlePoint.x-fa*(AfterPoint.x-FirstPoint.x),
                y : MiddlePoint.y-fa*(AfterPoint.y-FirstPoint.y)
            },
            outer : {
                x: MiddlePoint.x+fb*(AfterPoint.x-FirstPoint.x),
                y : MiddlePoint.y+fb*(AfterPoint.y-FirstPoint.y)
            }
        };
    },
    amd = methods.amd = (typeof define === 'funciton' && define.amd),
    noop = methods.noop = function () {};

    iChart.instances = {};

    iChart.Type = function (data, options, chart) {
        this.options = options;
        this.chart = chart;
        this.id = uid();

        iChart.instances[this.id] = this;

        // if (options.responsive) {
        //     this.resize();
        // }

        this.initialize.call(this, data);
    }

    extend(iChart.Type.prototype, {
        initialize: function () {
            return this;
        },
        clear: function () {
            clear(this.chart)
            return this;
        },
        resize: function (cb) {
            var canvas = this.chart.canvas,
                newWidth = getMaxWidth(this.chart.canvas),
                newHeight = getMaxHeight(this.chart.canvas);
            canvas.width = this.chart.width = newWidth;
            canvas.height = this.chart.height = newHeight;

            if (typeof cb === 'funciton') {
                cb.apply(this, Array.property.slice.call(argument, 1));
            }

            return this;
        },
        reflow: noop,
        render: function (reflow) {
            if (reflow) {
                reflow();
            }

            this.draw();

            return this;
        }
    });

    iChart.Type.extend = function (extensions) {
        var parent = this;
        var chartType = function () {
            return parent.apply(this, arguments);
        };

        chartType.prototype = clone(parent.prototype);

        extend(chartType.prototype, extensions);
        chartType.extend = iChart.Type.extend;

        if (extensions.name || parent.prototype.name){
            var chartName = extensions.name || parent.prototype.name;
            var baseDefaults = iChart.defaults[parent.prototype.name] ? clone(iChart.defaults[parent.prototype.name]) : {};

            iChart.defaults[chartName] = extend(baseDefaults, extensions.defaults);
            iChart.types[chartName] = chartType;

            iChart.prototype[chartName] = function (data, options) {
                var config = merge(iChart.defaults.global, iChart.defaults[chartName], options || {});
                return new chartType(data, config, this);
            };
        }
        else {
            warn("Name not provided for this chart, so it hasn't been registered");
        }
        return parent;
    };

    iChart.Element = function (configuration) {
        extend(this, configuration);
        this.initialize.apply(this, arguments);
        this.save();
    };

    extend(iChart.Element.prototype, {
        initialize: function () {},
        restore: function (props) {
            if (!props) {
                extend(this, this._saved);
            }
            else {
                each(props, function (key) {
                    this[key] = this._saved[key];
                }, this);
            }
            return this;
        },
        save: function () {
            this._saved = clone(this);
            delete this._saved.saved;
            return this;
        },
        update: function (newProps) {
            each(newProps, function (value, key) {
                this._saved[key] = this[key];
                this[key] = value;
            }, this);
            return this;
        },
        transition: function (props, ease) {
            each(props, function (value, key) {
                this[key] = ((value - this._saved[key]) * ease) + this._saved[key];
            }, this);
            return this;
        },
        hasValue: function () {
            return isNumber(this.value);
        }
    });

    iChart.Element.extend = inherits;

    iChart.Point = iChart.Element.extend({
        display: true,
        inRange: function (chartX, chartY) {
            var hitDetectionRange = this.hitDetectionRange + this.radius;
            return ((Math.pow(chartX - this.x, 2) + Math.pow(chartY - this.y, 2)) < Math.pow(hitDetectionRange, 2));
        },
        draw: function() {
            if (this.display){
                var ctx = this.ctx;
                ctx.beginPath();

                ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
                ctx.closePath();

                ctx.strokeStyle = this.strokeColor;
                ctx.lineWidth = this.strokeWidth;

                ctx.fillStyle = this.fillColor;

                ctx.fill();
                ctx.stroke();
            }
        }
    });

    iChart.Scale = iChart.Element.extend({
        initialize: function () {
            this.fit();
        },
        buildYLabels : function(){
            this.yLabels = [];

            var stepDecimalPlaces = getDecimalPlaces(this.stepValue);
            for (var i = 0; i <= this.steps; i++){
                this.yLabels.push((this.min + (i * this.stepValue)).toFixed(stepDecimalPlaces));
            }
            this.yLabelWidth = (this.display && this.showLabels) ? longestText(this.ctx, this.font, this.yLabels) + 10 : 0;
        },
        fit: function () {
            this.startPoint = (this.display) ? this.fontSize : 0;
            this.endPoint = (this.display) ? this.height - (this.fontSize * 1.5) - 5 : this.height;

            this.startPoint += this.padding;
            this.endPoint += this.padding;

            var cachedEndPoint = this.endPoint;
            var cachedHeight = this.endPoint - this.startPoint,
                cachedYLabelWidth;

            this.calculateYRange(cachedHeight);

            this.buildYLabels();

            this.calculateXLabelRotation();

            while((cachedHeight > this.endPoint - this.startPoint)){
                cachedHeight = this.endPoint - this.startPoint;
                cachedYLabelWidth = this.yLabelWidth;

                this.calculateYRange(cachedHeight);
                this.buildYLabels();

                if (cachedYLabelWidth < this.yLabelWidth){
                    this.endPoint = cachedEndPoint;
                    this.calculateXLabelRotation();
                }
            }
        },
        calculateXLabelRotation : function(){
            this.ctx.font = this.font;

            var firstWidth = this.ctx.measureText(this.xLabels[0]).width,
                lastWidth = this.ctx.measureText(this.xLabels[this.xLabels.length - 1]).width,
                firstRotated,
                lastRotated;

            this.xScalePaddingRight = lastWidth / 2 + 3;
            this.xScalePaddingLeft = (firstWidth / 2 > this.yLabelWidth) ? firstWidth/2 : this.yLabelWidth;

            this.xLabelRotation = 0;
            if (this.display){
                var originalLabelWidth = longestText(this.ctx, this.font, this.xLabels),
                    cosRotation,
                    firstRotatedWidth;
                this.xLabelWidth = originalLabelWidth;

                var xGridWidth = Math.floor(this.calculateX(1) - this.calculateX(0)) - 6;

                while ((this.xLabelWidth > xGridWidth && this.xLabelRotation === 0) || (this.xLabelWidth > xGridWidth && this.xLabelRotation <= 90 && this.xLabelRotation > 0)){
                    cosRotation = Math.cos(toRadians(this.xLabelRotation));

                    firstRotated = cosRotation * firstWidth;
                    lastRotated = cosRotation * lastWidth;

                    if (firstRotated + this.fontSize / 2 > this.yLabelWidth){
                        this.xScalePaddingLeft = firstRotated + this.fontSize / 2;
                    }
                    this.xScalePaddingRight = this.fontSize/2;


                    this.xLabelRotation++;
                    this.xLabelWidth = cosRotation * originalLabelWidth;

                }
                if (this.xLabelRotation > 0){
                    this.endPoint -= Math.sin(toRadians(this.xLabelRotation))*originalLabelWidth + 3;
                }
            }
            else{
                this.xLabelWidth = 0;
                this.xScalePaddingRight = this.padding;
                this.xScalePaddingLeft = this.padding;
            }

        },
        calculateYRange: noop,
        drawingArea: function(){
            return this.startPoint - this.endPoint;
        },
        calculateY : function(value){
            var scalingFactor = this.drawingArea() / (this.min - this.max);
            return this.endPoint - (scalingFactor * (value - this.min));
        },
        calculateX : function(index){
            var isRotated = (this.xLabelRotation > 0),
                // innerWidth = (this.offsetGridLines) ? this.width - offsetLeft - this.padding : this.width - (offsetLeft + halfLabelWidth * 2) - this.padding,
                innerWidth = this.width - (this.xScalePaddingLeft + this.xScalePaddingRight),
                valueWidth = innerWidth/Math.max((this.valuesCount - ((this.offsetGridLines) ? 0 : 1)), 1),
                valueOffset = (valueWidth * index) + this.xScalePaddingLeft;

            if (this.offsetGridLines){
                valueOffset += (valueWidth/2);
            }

            return Math.round(valueOffset);
        },
        draw : function(){
            var ctx = this.ctx,
                yLabelGap = (this.endPoint - this.startPoint) / this.steps,
                xStart = Math.round(this.xScalePaddingLeft);

            if (this.display){
                ctx.fillStyle = this.textColor;
                ctx.font = this.font;

                each(this.yLabels, function (labelString, index) {
                    var yLabelCenter = this.endPoint - (yLabelGap * index),
                        linePositionY = Math.round(yLabelCenter),
                        drawHorizontalLine = this.showHorizontalLines;

                    ctx.textAlign = "right";
                    ctx.textBaseline = "middle";
                    if (this.showLabels){
                        ctx.fillText(labelString, xStart - 10, yLabelCenter);
                    }

                    if (index === 0 && !drawHorizontalLine){
                        drawHorizontalLine = true;
                    }

                    if (drawHorizontalLine){
                        ctx.beginPath();
                    }
                    if (index > 0){
                        ctx.lineWidth = this.gridLineWidth;
                        ctx.strokeStyle = this.gridLineColor;
                    } else {
                        ctx.lineWidth = this.lineWidth;
                        ctx.strokeStyle = this.lineColor;
                    }

                    linePositionY += methods.aliasPixel(ctx.lineWidth);

                    if(drawHorizontalLine){
                        ctx.moveTo(xStart, linePositionY);
                        ctx.lineTo(this.width, linePositionY);
                        ctx.stroke();
                        ctx.closePath();
                    }

                    ctx.lineWidth = this.lineWidth;
                    ctx.strokeStyle = this.lineColor;
                    ctx.beginPath();
                    ctx.moveTo(xStart - 5, linePositionY);
                    ctx.lineTo(xStart, linePositionY);
                    ctx.stroke();
                    ctx.closePath();

                }, this);

                each(this.xLabels, function(label, index){
                    var xPos = this.calculateX(index) + aliasPixel(this.lineWidth),
                        linePos = this.calculateX(index - (this.offsetGridLines ? 0.5 : 0)) + aliasPixel(this.lineWidth),
                        isRotated = (this.xLabelRotation > 0),
                        drawVerticalLine = this.showVerticalLines;

                    if (index === 0 && !drawVerticalLine){
                        drawVerticalLine = true;
                    }

                    if (drawVerticalLine){
                        ctx.beginPath();
                    }

                    if (index > 0){
                        ctx.lineWidth = this.gridLineWidth;
                        ctx.strokeStyle = this.gridLineColor;
                    } else {
                        ctx.lineWidth = this.lineWidth;
                        ctx.strokeStyle = this.lineColor;
                    }

                    if (drawVerticalLine){
                        ctx.moveTo(linePos,this.endPoint);
                        ctx.lineTo(linePos,this.startPoint - 3);
                        ctx.stroke();
                        ctx.closePath();
                    }

                    ctx.lineWidth = this.lineWidth;
                    ctx.strokeStyle = this.lineColor;

                    ctx.beginPath();
                    ctx.moveTo(linePos,this.endPoint);
                    ctx.lineTo(linePos,this.endPoint + 5);
                    ctx.stroke();
                    ctx.closePath();

                    ctx.save();
                    ctx.translate(xPos,(isRotated) ? this.endPoint + 12 : this.endPoint + 8);
                    ctx.rotate(toRadians(this.xLabelRotation)*-1);
                    ctx.font = this.font;
                    ctx.textAlign = (isRotated) ? "right" : "center";
                    ctx.textBaseline = (isRotated) ? "middle" : "top";
                    ctx.fillText(label, 0, 0);
                    ctx.restore();
                },this);

            }
        }
    });

    if (amd) {
        define(function () {
            return iChart;
        })
    }
    else if (typeof module === 'object' && module.exports) {
        module.exports = iChart;
    }
    else
        global['iChart'] = global['iChart'] || iChart;

})(this || window)