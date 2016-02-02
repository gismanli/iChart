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
            // Boolean - Whether to animate the chart
            animation: true,
            // Number - Number of animation steps
            animationSteps: 60,
            // String - Animation easing effect
            animationEasing: "easeOutQuart",
            // Boolean - If we should show the scale at all
            showScale: true,
            // Boolean - If we want to override with a hard coded scale
            scaleOverride: false,
            // ** Required if scaleOverride is true **
            // Number - The number of steps in a hard coded scale
            scaleSteps: null,
            // Number - The value jump in the hard coded scale
            scaleStepWidth: null,
            // Number - The scale starting value
            scaleStartValue: null,
            // String - Colour of the scale line
            scaleLineColor: "rgba(0,0,0,.1)",
            // Number - Pixel width of the scale line
            scaleLineWidth: 1,
            // Boolean - Whether to show labels on the scale
            scaleShowLabels: true,
            // Interpolated JS string - can access value
            scaleLabel: "<%=value%>",
            // Boolean - Whether the scale should stick to integers, and not show any floats even if drawing space is there
            scaleIntegersOnly: true,
            // Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
            scaleBeginAtZero: false,
            // String - Scale label font declaration for the scale label
            scaleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            // Number - Scale label font size in pixels
            scaleFontSize: 12,
            // String - Scale label font weight style
            scaleFontStyle: "normal",
            // String - Scale label font colour
            scaleFontColor: "#666",
            // Boolean - whether or not the chart should be responsive and resize when the browser does.
            responsive: false,
            // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
            maintainAspectRatio: true,
            // Boolean - Determines whether to draw tooltips on the canvas or not - attaches events to touchmove & mousemove
            showTooltips: true,
            // Boolean - Determines whether to draw built-in tooltip or call custom tooltip function
            customTooltips: false,
            // Array - Array of string names to attach tooltip events
            tooltipEvents: ["mousemove", "touchstart", "touchmove", "mouseout"],
            // String - Tooltip background colour
            tooltipFillColor: "rgba(0,0,0,0.8)",
            // String - Tooltip label font declaration for the scale label
            tooltipFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            // Number - Tooltip label font size in pixels
            tooltipFontSize: 14,
            // String - Tooltip font weight style
            tooltipFontStyle: "normal",
            // String - Tooltip label font colour
            tooltipFontColor: "#fff",
            // String - Tooltip title font declaration for the scale label
            tooltipTitleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            // Number - Tooltip title font size in pixels
            tooltipTitleFontSize: 14,
            // String - Tooltip title font weight style
            tooltipTitleFontStyle: "bold",
            // String - Tooltip title font colour
            tooltipTitleFontColor: "#fff",
            // String - Tooltip title template
            tooltipTitleTemplate: "<%= label%>",
            // Number - pixel width of padding around tooltip text
            tooltipYPadding: 6,
            // Number - pixel width of padding around tooltip text
            tooltipXPadding: 6,
            // Numbe - Size of the caret on the tooltip
            tooltipCaretSize: 8,
            // Number - Pixel radius of the tooltip border
            tooltipCornerRadius: 6,
            // Number - Pixel offset from point x to tooltip edge
            tooltipXOffset: 10,
            // String - Template string for single tooltips
            tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %>",
            // String - Template string for single tooltips
            multiTooltipTemplate: "<%= value %>",
            // String - Colour behind the legend colour block
            multiTooltipKeyBackground: '#fff',
            // Array - A list of colors to use as the defaults
            segmentColorDefault: ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "#FB9A99", "#E31A1C", "#FDBF6F", "#FF7F00", "#CAB2D6", "#6A3D9A", "#B4B482", "#B15928" ],

            // Array - A list of highlight colors to use as the defaults
            segmentHighlightColorDefaults: [ "#CEF6FF", "#47A0DC", "#DAFFB2", "#5BC854", "#FFC2C1", "#FF4244", "#FFE797", "#FFA728", "#F2DAFE", "#9265C2", "#DCDCAA", "#D98150" ],
            // Function - Will fire on animation progression.
            onAnimationProgress: function(){},
            // Function - Will fire on animation completion.
            onAnimationComplete: function(){}
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
        args.unshift({});
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

        //Set a minimum step of two - a point at the top of the graph, and a point at the base
        var minSteps = 2,
            maxSteps = Math.floor(drawingSize/(textSize * 1.5)),
            skipFitting = (minSteps >= maxSteps);

        // Filter out null values since these would min() to zero
        var values = [];
        each(valuesArray, function( v ){
            v == null || values.push( v );
        });
        var minValue = min(values),
            maxValue = max(values);

        // We need some degree of separation here to calculate the scales if all the values are the same
        // Adding/minusing 0.5 will give us a range of 1.
        if (maxValue === minValue){
            maxValue += 0.5;
            // So we don't end up with a graph with a negative start value if we've said always start from zero
            if (minValue >= 0.5 && !startFromZero){
                minValue -= 0.5;
            }
            else{
                // Make up a whole number above the values
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

        //If we have more space on the graph we'll use it to give more definition to the data
        while((numberOfSteps > maxSteps || (numberOfSteps * 2) < maxSteps) && !skipFitting) {
            if(numberOfSteps > maxSteps){
                stepValue *=2;
                numberOfSteps = Math.round(graphRange/stepValue);
                // Don't ever deal with a decimal number of steps - cancel fitting and just use the minimum number of steps.
                if (numberOfSteps % 1 !== 0){
                    skipFitting = true;
                }
            }
            //We can fit in double the amount of scale points on the scale
            else{
                //If user has declared ints only, and the step value isn't a decimal
                if (integersOnly && rangeOrderOfMagnitude >= 0){
                    //If the user has said integers only, we need to check that making the scale more granular wouldn't make it a float
                    if(stepValue/2 % 1 === 0){
                        stepValue /=2;
                        numberOfSteps = Math.round(graphRange/stepValue);
                    }
                    //If it would make it a float break out of the loop
                    else{
                        break;
                    }
                }
                //If the scale doesn't have to be an int, make the scale more granular anyway.
                else{
                    stepValue /=2;
                    numberOfSteps = Math.round(graphRange/stepValue);
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
    getDecimalPlaces = methods.getDecimalPlaces = function(num){
        if (num%1!==0 && isNumber(num)){
            var s = num.toString();
            if(s.indexOf("e-") < 0){
                // no exponent, e.g. 0.01
                return s.split(".")[1].length;
            }
            else if(s.indexOf(".") < 0) {
                // no decimal point, e.g. 1e-9
                return parseInt(s.split("e-")[1]);
            }
            else {
                // exponent and decimal point, e.g. 1.23e-9
                var parts = s.split(".")[1].split("e-");
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
            // Figure out if we're getting a template, or if we need to
            // load the template - and be sure to cache the result.
            var fn = !/\W/.test(str) ?
            cache[str] = cache[str] :

            // Generate a reusable function that will serve as a template
            // generator (and which will be cached).
            new Function("obj",
                "var p=[],print=function(){p.push.apply(p,arguments);};" +

                // Introduce the data as local variables using with(){}
                "with(obj){p.push('" +

                // Convert the template into pure JavaScript
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

            // Provide some basic currying to the user
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
    clear = methods.clear = function(chart){
        chart.ctx.clearRect(0, 0, chart.width, chart.height);
    },
    aliasPixel = methods.aliasPixel = function (pixelWidth) {
        return (pixelWidth % 2 === 0) ? 0 : 0.5;
    },
    toRadians = methods.radians = function(degrees){
        return degrees * (Math.PI/180);
    },
    amd = methods.amd = (typeof define === 'funciton' && define.amd),
    noop = methods.noop = function () {};

    iChart.instances = {};

    iChart.Type = function (data, options, chart) {
        this.options = options;
        this.chart = chart;
        this.id = uid();

        iChart.instances[this.id] = this;

        if (options.responsive) {
            this.resize();
        }

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
                newWidth = this.options.maintainAspectRatio
                    ? newWidth / this.chart.aspecRatio
                    : getMaxHeight(this.chart.canvas);
            canvas.width = this.chart.width = newWidth;
            canvas.height = this.chart.height = newHeight;

            retinaScale(this.chart);

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
            if (this.options.anmation && !reflow) {

            }
            else {
                this.draw();
                this.options.onAnimationComplete.call(this);
            }
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
            var baseDefaults = (iChart.defaults[parent.prototype.name]) ? clone(iChart.defaults[parent.prototype.name]) : {};

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

            for (var i=0; i<=this.steps; i++){
                this.yLabels.push(template(this.templateString,{value:(this.min + (i * this.stepValue)).toFixed(stepDecimalPlaces)}));
            }
            this.yLabelWidth = (this.display && this.showLabels) ? longestText(this.ctx,this.font,this.yLabels) + 10 : 0;
        },
        addXLabel : function(label){
            this.xLabels.push(label);
            this.valuesCount++;
            this.fit();
        },
        removeXLabel : function(){
            this.xLabels.shift();
            this.valuesCount--;
            this.fit();
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
            this.calculateYRange(cachedHeight);

            // With these properties set we can now build the array of yLabels
            // and also the width of the largest yLabel
            this.buildYLabels();

            this.calculateXLabelRotation();

            while((cachedHeight > this.endPoint - this.startPoint)){
                cachedHeight = this.endPoint - this.startPoint;
                cachedYLabelWidth = this.yLabelWidth;

                this.calculateYRange(cachedHeight);
                this.buildYLabels();

                // Only go through the xLabel loop again if the yLabel width has changed
                if (cachedYLabelWidth < this.yLabelWidth){
                    this.endPoint = cachedEndPoint;
                    this.calculateXLabelRotation();
                }
            }
        },
        calculateXLabelRotation : function(){
            //Get the width of each grid by calculating the difference
            //between x offsets between 0 and 1.

            this.ctx.font = this.font;

            var firstWidth = this.ctx.measureText(this.xLabels[0]).width,
                lastWidth = this.ctx.measureText(this.xLabels[this.xLabels.length - 1]).width,
                firstRotated,
                lastRotated;


            this.xScalePaddingRight = lastWidth/2 + 3;
            this.xScalePaddingLeft = (firstWidth/2 > this.yLabelWidth) ? firstWidth/2 : this.yLabelWidth;

            this.xLabelRotation = 0;
            if (this.display){
                var originalLabelWidth = longestText(this.ctx,this.font,this.xLabels),
                    cosRotation,
                    firstRotatedWidth;
                this.xLabelWidth = originalLabelWidth;
                //Allow 3 pixels x2 padding either side for label readability
                var xGridWidth = Math.floor(this.calculateX(1) - this.calculateX(0)) - 6;

                //Max label rotate should be 90 - also act as a loop counter
                while ((this.xLabelWidth > xGridWidth && this.xLabelRotation === 0) || (this.xLabelWidth > xGridWidth && this.xLabelRotation <= 90 && this.xLabelRotation > 0)){
                    cosRotation = Math.cos(toRadians(this.xLabelRotation));

                    firstRotated = cosRotation * firstWidth;
                    lastRotated = cosRotation * lastWidth;

                    // We're right aligning the text now.
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
        // Needs to be overidden in each Chart type
        // Otherwise we need to pass all the data into the scale class
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
        update : function(newProps){
            methods.extend(this, newProps);
            this.fit();
        },
        draw : function(){
            var ctx = this.ctx,
                yLabelGap = (this.endPoint - this.startPoint) / this.steps,
                xStart = Math.round(this.xScalePaddingLeft);
            if (this.display){
                ctx.fillStyle = this.textColor;
                ctx.font = this.font;
                each(this.yLabels,function(labelString,index){
                    var yLabelCenter = this.endPoint - (yLabelGap * index),
                        linePositionY = Math.round(yLabelCenter),
                        drawHorizontalLine = this.showHorizontalLines;

                    ctx.textAlign = "right";
                    ctx.textBaseline = "middle";
                    if (this.showLabels){
                        ctx.fillText(labelString,xStart - 10,yLabelCenter);
                    }

                    // This is X axis, so draw it
                    if (index === 0 && !drawHorizontalLine){
                        drawHorizontalLine = true;
                    }

                    if (drawHorizontalLine){
                        ctx.beginPath();
                    }

                    if (index > 0){
                        // This is a grid line in the centre, so drop that
                        ctx.lineWidth = this.gridLineWidth;
                        ctx.strokeStyle = this.gridLineColor;
                    } else {
                        // This is the first line on the scale
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

                },this);

                each(this.xLabels,function(label,index){
                    var xPos = this.calculateX(index) + aliasPixel(this.lineWidth),
                        // Check to see if line/bar here and decide where to place the line
                        linePos = this.calculateX(index - (this.offsetGridLines ? 0.5 : 0)) + aliasPixel(this.lineWidth),
                        isRotated = (this.xLabelRotation > 0),
                        drawVerticalLine = this.showVerticalLines;

                    // This is Y axis, so draw it
                    if (index === 0 && !drawVerticalLine){
                        drawVerticalLine = true;
                    }

                    if (drawVerticalLine){
                        ctx.beginPath();
                    }

                    if (index > 0){
                        // This is a grid line in the centre, so drop that
                        ctx.lineWidth = this.gridLineWidth;
                        ctx.strokeStyle = this.gridLineColor;
                    } else {
                        // This is the first line on the scale
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


                    // Small lines at the bottom of the base grid line
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