// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ GaugeD3.js                                                                                                                            │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                                                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                                                                        │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

GaugeD3 = function(_option) {
    'use strict';

    var self = this;
    var version = '1.0.1';

    var parentNode = null;

    var _CRITERIA_R = 112;
    var _CRITERIA_QUARTER_R = Math.floor(_CRITERIA_R*1.66);

    var _TO_RADIANS = Math.PI/180;
    var _HALF_DIV = 2;
    var _QUARTER_DIV = 1.3;
    var _DONUT_DIV = 2.15;
    var _THREEQUARTER_DIV = 2.15;

    var gaugeTypes = [
        'half', 'donut',
        'quarter-left-top', 'quarter-right-top',
        'quarter-left-bottom', 'quarter-right-bottom',
        'threequarter-left-top', 'threequarter-right-top',
        'threequarter-left-bottom', 'threequarter-right-bottom',
        'threequarter-bottom',
    ];

    // d3 variables
    var d3var = {
        svg: null,
        gCenter: null,
        arc: null,
        arc_level: null,
        scale_per: null,
        value: null,
        min: null,
        max: null,
        startArcAngle: 0,
        curArcAngle: 0
    };

    var widgetSize = {
        height: 0,
        width: 0
    };

    // default option
    var default_option = {
        // type string : this is container element id
        bindto: '',

        title: {
            // type string : gauge title
            text: '',
            // type string : color of gauge title
            color: '#999999',
            // type string : css class
            class: ''
        },

        value: {
            // type float : value gauge is showing
            val: 0,
            // type string : color of label showing current value
            color: '#010101',
            // type float : min value
            min: 0,
            // type float : max value
            max: 100,
            // type bool : convert large numbers for min, max, value to human friendly (e.g. 1234567 -> 1.23M)
            metricPrefix: false,
            // type int : number of decimal places for our human friendly number to contain
            metricPrefixDecimal: 0,
            // type bool : hide value text
            hide: false,
            // type bool : hide min and max values
            hideMinMax: false,
            // type bool : convert large numbers for min, max, value to human friendly (e.g. 1234567 -> 1.23M)
            metricPrefixMinMax: false,
            // type int : number of digits after floating point
            decimals: 0,
            // type bool : formats numbers with commas where appropriate
            comma: false,
            // type bool : enable value transition
            transition: true,
            // type string : css class
            class: ''
        },

        gauge: {
            // type float : width of the gauge element
            widthScale: 1.0,
            // type string : background color of gauge element
            color: '#edebeb',
            // type bool : whether to use gradual color change for value, or sector-based
            noGradient: false,
            // type int : gauge type
            // (half, quarter-left-top, quarter-right-top, quarter-left-bottom, quarter-right-bottom, threequarter-left-top, threequarter-right-top, threequarter-left-bottom, threequarter-right-bottom, threequarter-bottom, donut)
            type: 'half',
            // donut options
            donut: {
                // type int : start angle (0-359)
                startAngle: 0
            }
        },

        label: {
            // type string : text to show below value
            text: '',
            // type string : color of label showing label under value
            color: '#edebeb',
            // type string : css class
            class: ''
        },

        level: {
            // type string[]: colors of indicator, from lower to upper, in RGB format
            colors: ['#a9d70b', '#f9c802', '#ff0000'],
            // type bool : animate level number change
            counter: false,
            // type [] of objects : number of digits after floating point
            // ex: customSectors: [ {
            //            hi: -1000,
            //            lo: -5000,
            //            color: 'rgb(10, 10, 10)'
            //     } ]
            customSectors : []
        },

        transition: {
            // type int : length of initial transition
            startTime: 700,
            // type string : type of initial transition (linear, quad, cubic, sin, exp, circle, elastic, back, bounce) + -in -out -in-out -out-in
            startType: 'linear',
            // type int : length of refresh transition
            refreshTime: 700,
            // type string : type of refresh transition (linear, quad, cubic, sin, exp, circle, elastic, back, bounce) + -in -out -in-out -out-in
            refreshType: 'circle-out'
        }
    };

    var option = default_option;

    // Initialize
    var ret = (function(opt) {
        if (_.isNull(opt) || _.isUndefined(opt)) {
            console.error('GaugeD3: Make sure to pass options to the constructor!');
            return false;
        }
        if (_.isNull(opt.bindto) || _.isUndefined(opt.bindto)) {
            console.error('GaugeD3: No element with id : %s found', option.bindto);
            return false;
        }

        parentNode = document.getElementById(opt.bindto);
        if (!parentNode) {
            console.error('GaugeD3: No element with id : %s found', opt.bindto);
            return false;
        }

        setOption(_.merge(default_option, opt));

        createD3();

        initialTransition();

    }(_option));

    if (ret === false)
        return undefined;

    function setOption(opt) {
        option.bindto = opt.bindto;
        option.title.text = opt.title.text;
        option.title.color = opt.title.color;

        if (opt.value.min > opt.value.max) {
            var tmp = opt.value.max;
            opt.value.max = opt.value.min;
            opt.value.min = tmp;
        }
        if (opt.value.min === opt.value.max)
            opt.value.max = opt.value.min+100;

        option.value.val = Number(opt.value.val);
        option.value.color = opt.value.color;
        option.value.min = Number(opt.value.min);
        option.value.max = Number(opt.value.max);
        option.value.metricPrefix = opt.value.metricPrefix;
        option.value.metricPrefixDecimal = Number(opt.value.metricPrefixDecimal);
        option.value.hide = opt.value.hide;
        option.value.hideMinMax = opt.value.hideMinMax;
        option.value.metricPrefixMinMax = opt.value.metricPrefixMinMax;
        option.value.decimals = Number(opt.value.decimals);
        option.value.commma = opt.value.commma;
        option.value.class = opt.value.class;

        option.gauge.widthScale = Math.max(0.0, Math.min(Number(opt.gauge.widthScale), 1.0));
        option.gauge.color = opt.gauge.color;
        option.gauge.noGradient = opt.gauge.noGradient;

        option.gauge.type = opt.gauge.type;
        if (_.indexOf(gaugeTypes, option.gauge.type) === -1)
            option.gauge.type = gaugeTypes[0];

        option.gauge.donut.startAngle = Math.max(0, Math.min(Number(opt.gauge.donut.startAngle), 359));

        option.label.text = opt.label.text;
        option.label.color = opt.label.color;
        option.label.class = opt.label.class;

        option.level.colors = opt.level.colors;
        option.level.counter = opt.level.counter;
        option.level.customSectors = opt.level.customSectors;

        option.transition.startTime = Number(opt.transition.startTime);
        option.transition.startType = opt.transition.startType;
        option.transition.refreshTime = Number(opt.transition.refreshTime);
        option.transition.refreshType = opt.transition.refreshType;

        option.value.val = getValueInRange(option.value.val);
    }

    function getCenteringTransform(rc) {
        return 'translate(' + (rc.width/2) + ',' + (rc.height/2) + ')';
    }

    function getWidgetSize(rc) {
        var h, w, aspect;
        if (rc.width > rc.height) {
            h = rc.height;
            w = h * 1.25;
            if (w > rc.width) {
                aspect = w / rc.width;
                w = w / aspect;
                h = h / aspect;
            }
        } else if (rc.width < rc.height) {
            w = rc.width;
            h = w / 1.25;
            if (h > rc.height) {
                aspect = w / rc.height;
                h = h / aspect;
                width = h / aspect;
            }
        } else {
            w = rc.width;
            h = w * 0.75;
        }
        return { height: h, width: w };
    }

    function getRadius(size) {
        var r;
        switch (option.gauge.type) {
        case 'threequarter-left-top':
        case 'threequarter-right-top':
        case 'threequarter-left-bottom':
        case 'threequarter-right-bottom':
        case 'threequarter-bottom':
            r = Math.floor(Math.min(size.width, size.height) / _THREEQUARTER_DIV);
            break;
        case 'donut':
            r = Math.floor(Math.min(size.width, size.height) / _DONUT_DIV);
            break;
        case 'half':
            r = Math.floor(Math.min(size.width, size.height) / _HALF_DIV);
            break;
        case 'quarter-left-top':
        case 'quarter-right-top':
        case 'quarter-left-bottom':
        case 'quarter-right-bottom':
            r = Math.floor(Math.min(size.width, size.height) / _QUARTER_DIV);
            break;
        }
        return r;
    }

    function getValueInRange(val) {
        return Math.max(option.value.min, Math.min(option.value.max, val));
    }

    function genArc(radius) {
        var arc, engAngle;

        var ninety = Math.PI/2;
        switch (option.gauge.type) {
        case 'half':
            d3var.startArcAngle = -ninety;
            engAngle = ninety;
            break;
        case 'donut':
            d3var.startArcAngle = option.gauge.donut.startAngle * _TO_RADIANS;
            engAngle = 360 * _TO_RADIANS + d3var.startArcAngle;
            break;
        case 'quarter-left-top':
            d3var.startArcAngle = -ninety;
            engAngle = 0;
            break;
        case 'quarter-right-top':
            d3var.startArcAngle = 0;
            engAngle = ninety;
            break;
        case 'quarter-left-bottom':
            d3var.startArcAngle = Math.PI;
            engAngle = ninety*3;
            break;
        case 'quarter-right-bottom':
            d3var.startArcAngle = ninety;
            engAngle = Math.PI;
            break;
        case 'threequarter-left-top':
            d3var.startArcAngle = 0;
            engAngle = ninety*3;
            break;
        case 'threequarter-right-top':
            d3var.startArcAngle = ninety;
            engAngle = 360 * _TO_RADIANS;
            break;
        case 'threequarter-left-bottom':
            d3var.startArcAngle = -ninety;
            engAngle = Math.PI;
            break;
        case 'threequarter-right-bottom':
            d3var.startArcAngle = -Math.PI;
            engAngle = ninety;
            break;
        case 'threequarter-bottom':
            d3var.startArcAngle = -Math.PI+ninety/2;
            engAngle = ninety+ninety/2;
            break;
        }
        arc = d3.svg.arc()
            .innerRadius(radius-getGaugeWidth(radius))
            .outerRadius(radius)
            .startAngle(d3var.startArcAngle)
            .endAngle(engAngle);
        return arc;
    }

    function getTranslateString(x, y) {
        return 'translate('+x+','+y+')';
    }

    function genArcPath(radius, center, arc, color) {
        var path = center.insert('path', 'text')
            .style('fill', color)
            .attr('d', arc);

        var val = Math.floor(radius/2);
        var tstr;

        switch (option.gauge.type) {
        case 'half':
            tstr = getTranslateString(0, val);
            break;
        case 'quarter-left-top':
            tstr = getTranslateString(val, val);
            break;
        case 'quarter-right-top':
            tstr = getTranslateString(val*-1, val);
            break;
        case 'quarter-left-bottom':
            tstr = getTranslateString(val, val*-1);
            break;
        case 'quarter-right-bottom':
            tstr = getTranslateString(val*-1, val*-1);
            break;
        }
        path.attr('transform', tstr);
        return path;
    }

    function calcAttributes(radius) {
        var attr = {
            title: {
                fontsize: '',
                dy: '',
                x: 0
            },
            value: {
                fontsize: '',
                dy: '',
                x: 0
            },
            label: {
                fontsize: '',
                dy: '',
                x: 0
            },
            minmax: {
                fontsize: '',
                min_dy: '',
                max_dy: '',
                min_x: 0,
                max_x: 0
            }
        };
        var x, xt, x2, x3;

        switch (option.gauge.type) {
        case 'half':
            attr.title.fontsize = (1.3*radius/_CRITERIA_R).toFixed(2) + 'em';
            attr.value.fontsize = (2.2*radius/_CRITERIA_R).toFixed(2) + 'em';
            attr.label.fontsize = (0.9*radius/_CRITERIA_R).toFixed(2) + 'em';
            attr.minmax.fontsize = (0.9*radius/_CRITERIA_R).toFixed(2) + 'em';
            attr.title.dy = '-4.5em';
            attr.value.dy = '1.7em';
            attr.label.dy = '5.9em';
            attr.minmax.min_dy = attr.minmax.max_dy = '5.9em';
            x = radius - getGaugeWidth(radius)/2;
            attr.minmax.min_x = -x;
            attr.minmax.max_x = x;
            break;
        case 'donut':
            attr.title.fontsize = (1.3*radius/_CRITERIA_R).toFixed(2) + 'em';
            attr.value.fontsize = (2.2*radius/_CRITERIA_R).toFixed(2) + 'em';
            attr.label.fontsize = (0.9*radius/_CRITERIA_R).toFixed(2) + 'em';
            attr.minmax.fontsize = (0.9*radius/_CRITERIA_R).toFixed(2) + 'em';
            attr.value.dy = '.3em';
            attr.label.dy = '2.3em';
            attr.title.dy = '-1.3em';
            attr.minmax.min_dy = attr.minmax.max_dy = '7.5em';
            x = radius;
            attr.minmax.min_x = -x;
            attr.minmax.max_x = x;
            break;
        case 'threequarter-left-top':
        case 'threequarter-right-top':
        case 'threequarter-left-bottom':
        case 'threequarter-right-bottom':
        case 'threequarter-bottom':
            attr.title.fontsize = (1.3*radius/_CRITERIA_R).toFixed(2) + 'em';
            attr.label.fontsize = (0.9*radius/_CRITERIA_R).toFixed(2) + 'em';
            attr.value.fontsize = (2.2*radius/_CRITERIA_R).toFixed(2) + 'em';
            attr.minmax.fontsize = (0.9*radius/_CRITERIA_R).toFixed(2) + 'em';
            attr.value.dy = '.1em';
            attr.label.dy = '1.8em';
            x = radius - getGaugeWidth(radius)/2;

            switch (option.gauge.type) {
            case 'threequarter-left-top':
                attr.title.dy = '-2.8em';
                attr.minmax.max_dy = '-0.6em';
                attr.title.x = -radius/1.5;
                attr.minmax.max_x = -x;
                break;
            case 'threequarter-right-top':
                attr.title.dy = '-2.8em';
                attr.minmax.min_dy = '-0.6em';
                attr.title.x = radius/1.5;
                attr.minmax.min_x = x;
                break;
            case 'threequarter-left-bottom':
                attr.title.dy = '3.5em';
                attr.minmax.min_dy = '1.3em';
                attr.title.x = -radius/1.5;
                attr.minmax.min_x = -x;
                break;
            case 'threequarter-right-bottom':
                attr.title.dy = '3.5em';
                attr.minmax.max_dy = '1.3em';
                attr.title.x = radius/1.5;
                attr.minmax.max_x = x;
                break;
            case 'threequarter-bottom':
                attr.title.dy = '-1.3em';
                attr.value.dy = '.3em';
                attr.label.dy = '2.2em';
                attr.minmax.min_dy = attr.minmax.max_dy = '7.8em';
                attr.minmax.max_x = x - radius/4;
                attr.minmax.min_x = -x + radius/4;
                break;
            }
            break;
        case 'quarter-left-top':
        case 'quarter-right-top':
        case 'quarter-left-bottom':
        case 'quarter-right-bottom':
            attr.title.fontsize = (1.3*radius/_CRITERIA_QUARTER_R).toFixed(2) + 'em';
            attr.value.fontsize = (2.5*radius/_CRITERIA_QUARTER_R).toFixed(2) + 'em';
            attr.label.fontsize = (0.9*radius/_CRITERIA_QUARTER_R).toFixed(2) + 'em';
            attr.minmax.fontsize = (0.9*radius/_CRITERIA_QUARTER_R).toFixed(2) + 'em';

            xt = radius / 2.3;
            x = radius / 3;
            x3 = radius / 2;
            x2 = x3 - getGaugeWidth(radius) / 2;

            switch (option.gauge.type) {
            case 'quarter-left-top':
                attr.title.dy = '-5em';
                attr.value.dy = '1.9em';
                attr.label.dy = '7em';
                attr.minmax.min_dy = '8.7em';
                attr.minmax.max_dy = '-7.9em';
                attr.title.x = -xt;
                attr.value.x = x;
                attr.label.x = x;
                attr.minmax.min_x = -x2;
                attr.minmax.max_x = x3;
                break;
            case 'quarter-right-top':
                attr.title.dy = '-5em';
                attr.value.dy = '1.9em';
                attr.label.dy = '7em';
                attr.minmax.min_dy = '-7.9em';
                attr.minmax.max_dy = '8.7em';
                attr.title.x = xt;
                attr.value.x = -x;
                attr.label.x = -x;
                attr.minmax.min_x = -x3;
                attr.minmax.max_x = x2;
                break;
            case 'quarter-left-bottom':
                attr.title.dy = '5em';
                attr.value.dy = '-1.7em';
                attr.label.dy = '-3.1em';
                attr.minmax.min_dy = '8.7em';
                attr.minmax.max_dy = '-7.9em';
                attr.title.x = -xt;
                attr.value.x = x;
                attr.label.x = x;
                attr.minmax.min_x = x3;
                attr.minmax.max_x = -x2;
                break;
            case 'quarter-right-bottom':
                attr.title.dy = '5em';
                attr.value.dy = '-1.7em';
                attr.label.dy = '-3.1em';
                attr.minmax.min_dy = '-7.9em';
                attr.minmax.max_dy = '8.7em';
                attr.title.x = xt;
                attr.value.x = -x;
                attr.label.x = -x;
                attr.minmax.min_x = x2;
                attr.minmax.max_x = -x3;
                break;
            }
            break;
        }
        return attr;
    }

    function transformAttributes(radius) {
        if (option.value.hideMinMax === true)
            return;

        var rc, x, y, z;

        z = radius*6/_CRITERIA_R;

        switch (option.gauge.type) {
        case 'threequarter-left-top':
            rc = d3var.min.node().getBBox();
            y = radius - getGaugeWidth(radius)/2 - rc.height/4;
            x = rc.width/2 + z;
            d3var.min.attr('transform', getTranslateString(x*-1, y*-1));
            break;
        case 'threequarter-right-top':
            rc = d3var.max.node().getBBox();
            y = radius - getGaugeWidth(radius)/2 - rc.height/4;
            x = rc.width/2 + z;
            d3var.max.attr('transform', getTranslateString(x, y*-1));
            break;
        case 'threequarter-left-bottom':
            rc = d3var.max.node().getBBox();
            y = radius - getGaugeWidth(radius)/2 + rc.height/4;
            x = rc.width/2 + z;
            d3var.max.attr('transform', getTranslateString(x*-1, y));
            break;
        case 'threequarter-right-bottom':
            rc = d3var.min.node().getBBox();
            y = radius - getGaugeWidth(radius)/2 + rc.height/4;
            x = rc.width/2 + z;
            d3var.min.attr('transform', getTranslateString(x, y));
            break;
        }
    }

    function getGaugeWidth(radius) {
        return Math.floor(option.gauge.widthScale*(radius/2.5));
    }

    function getGaugeValueColor(val, percentage) {
        var _cutHex = function(str) {
            return (str.charAt(0)==='#') ? str.substring(1,7) : str;
        };

        if (option.level.customSectors.length > 0) {
            var res = _.findIndex(option.level.customSectors, function(cs) {
                return (val > cs.lo && val <= cs.hi);
            });
            if (res >= 0)
                return option.level.customSectors[res].color;
        }

        var colorlen = option.level.colors.length;
        if (colorlen === 1)
            return option.level.colors[0];
        var inc = (option.gauge.noGradient) ? (1 / colorlen) : (1 / (colorlen - 1));
        var colors = [];

        for (var i = 0; i < colorlen; i++) {
            colors.push({
                percentage: (option.gauge.noGradient) ? (inc * (i + 1)) : (inc * i),
                color: {
                    r: parseInt((_cutHex(option.level.colors[i])).substring(0,2), 16),
                    g: parseInt((_cutHex(option.level.colors[i])).substring(2,4), 16),
                    b: parseInt((_cutHex(option.level.colors[i])).substring(4,6), 16)
                }
            });
        }

        if (percentage === 0)
            return 'rgb(' + [colors[0].color.r, colors[0].color.g, colors[0].color.b].join(',') + ')';

        var range, rangePer, perLower, perUpper, color, lower, upper;
        for (var j = 0; j < colors.length; j++) {
            if (percentage <= colors[j].percentage) {
                if (option.gauge.noGradient) {
                    return 'rgb(' + [colors[j].color.r, colors[j].color.g, colors[j].color.b].join(',') + ')';
                } else {
                    lower = colors[j - 1];
                    upper = colors[j];
                    range = upper.percentage - lower.percentage;
                    rangePer = (percentage - lower.percentage) / range;
                    perLower = 1 - rangePer;
                    perUpper = rangePer;
                    color = {
                        r: Math.floor(lower.color.r * perLower + upper.color.r * perUpper),
                        g: Math.floor(lower.color.g * perLower + upper.color.g * perUpper),
                        b: Math.floor(lower.color.b * perLower + upper.color.b * perUpper)
                    };
                    return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
                }
            }
        }
    }

    function getValueText(value) {
        if (!_.isNumber(value))
            return 0;
        var val;
        if (option.value.metricPrefix) {
            var prefix = d3.formatPrefix(value);
            val = prefix.scale(value).toFixed(option.value.metricPrefixDecimal) + prefix.symbol;
        } else {
            var f;
            if (option.value.comma === true)
                f = d3.format(',.' + option.value.decimal + 'f');
            else
                f = d3.format('.' + option.value.decimal + 'f');
            val = f(value);
        }
        return val;
    }

    function getMinValueText() {
        var val;
        if (option.value.metricPrefix) {
            var prefix = d3.formatPrefix(option.value.min);
            val = prefix.scale(option.value.min).toFixed(option.value.metricPrefixDecimal) + prefix.symbol;
        } else {
            var f;
            if (option.value.comma === true)
                f = d3.format(',.' + option.value.decimal + 'f');
            else
                f = d3.format('.' + option.value.decimal + 'f');
            val = f(option.value.min);
        }
        return val;
    }

    function getMaxValueText() {
        var val;
        if (option.value.metricPrefix) {
            var prefix = d3.formatPrefix(option.value.max);
            val = prefix.scale(option.value.max).toFixed(option.value.metricPrefixDecimal) + prefix.symbol;
        } else {
            var f;
            if (option.value.comma === true)
                f = d3.format(',.' + option.value.decimal + 'f');
            else
                f = d3.format('.' + option.value.decimal + 'f');
            val = f(option.value.max);
        }
        return val;
    }

    function createD3() {
        var rc = parentNode.getBoundingClientRect();

        d3var.svg = d3.select('#' + option.bindto)
            .append('svg')
            .attr('width', rc.width)
            .attr('height', rc.height);

        d3var.gCenter = d3var.svg.append('g')
            .style('opacity', 0)
            .attr('transform', getCenteringTransform(rc));

        widgetSize = getWidgetSize(rc);
        var r = getRadius(widgetSize);

        d3var.arc = genArc(r);
        genArcPath(r, d3var.gCenter, d3var.arc, option.gauge.color);
        d3var.arc_level = genArcPath(r, d3var.gCenter, d3var.arc, getGaugeValueColor(option.value.val, 0));
        d3var.curArcAngle = d3var.startArcAngle;

        d3var.scale_per = d3.scale.linear()
            .domain([option.value.min, option.value.max])
            .range([0, 1]);

        var attributes = calcAttributes(r);

        if (option.title.text !== '') {
            d3var.gCenter.append('text')
                .text(option.title.text)
                .style('fill', option.title.color)
                .style('text-anchor', 'middle')
                .attr('dy', attributes.title.dy)
                .attr('x', attributes.title.x)
                .attr('font-size', attributes.title.fontsize)
                .attr('class', option.title.class);
        }

        if (option.value.hide === false) {
            d3var.value = d3var.gCenter.append('text')
                .data([{ value: option.value.val }])
                .text(getValueText())
                .style('fill', option.value.color)
                .style('text-anchor', 'middle')
                .attr('dy', attributes.value.dy)
                .attr('x', attributes.value.x)
                .attr('font-size', attributes.value.fontsize)
                .attr('class', option.value.class);

            d3var.label = d3var.gCenter.append('text')
                .text(option.label.text)
                .style('fill', option.label.color)
                .style('text-anchor', 'middle')
                .attr('dy', attributes.label.dy)
                .attr('x', attributes.label.x)
                .attr('font-size', attributes.label.fontsize)
                .attr('class', option.label.class);
        }

        if (option.value.hideMinMax === false) {
            d3var.min = d3var.gCenter.append('text')
                .text(getMinValueText())
                .style('fill', option.label.color)
                .style('text-anchor', 'middle')
                .attr('dy', attributes.minmax.min_dy)
                .attr('x', attributes.minmax.min_x)
                .attr('font-size', attributes.minmax.fontsize)
                .attr('class', option.value.class);

            d3var.max = d3var.gCenter.append('text')
                .text(getMaxValueText())
                .style('fill', option.label.color)
                .style('text-anchor', 'middle')
                .attr('dy', attributes.minmax.max_dy)
                .attr('x', attributes.minmax.max_x)
                .attr('font-size', attributes.minmax.fontsize)
                .attr('class', option.value.class);
        }

        // need to relayout
        transformAttributes(r);
    }

    function resize() {
        if (_.isNull(d3var.svg))
            return;

        var rc = parentNode.getBoundingClientRect();

        var newSize = getWidgetSize(rc);

        d3var.svg.attr('height', rc.height)
            .attr('width', rc.width);

        var x = newSize.width / widgetSize.width;
        var y = newSize.height / widgetSize.height;

        d3var.gCenter.attr('transform', getCenteringTransform(rc)+',scale('+x+', '+y+')');
    }

    function initialTransition() {
        d3var.gCenter.transition()
            .duration(option.transition.startTime)
            .ease(option.transition.startType)
            .style('opacity', 1);
    }

    function valueTransition(val) {
        d3var.value.transition()
            .duration(option.transition.refreshTime)
            .ease(option.transition.refreshType)
            .tween('text', function(d) {
                var i = d3.interpolate(d.value, val);
                d.value = val;
                return function(t) {
                    this.textContent = getValueText(i(t));
                };
            });
    }

    function levelArcTransition(val) {

        var per = d3var.scale_per(val);

        var newColor = getGaugeValueColor(val, per);

        var endAngle = (function(per) {
            var angle;

            var _calcAngle = function(perc, range, stangle) {
                return (range * perc + stangle) * _TO_RADIANS;
            };

            switch (option.gauge.type) {
            case 'half':
                angle = _calcAngle(per, 180, -90);
                break;
            case 'donut':
                angle = _calcAngle(per, 360, option.gauge.donut.startAngle);
                break;
            case 'quarter-left-top':
                angle = _calcAngle(per, 90, -90);
                break;
            case 'quarter-right-top':
                angle = _calcAngle(per, 90, 0);
                break;
            case 'quarter-left-bottom':
                angle = _calcAngle(per, 90, 180);
                break;
            case 'quarter-right-bottom':
                angle = _calcAngle(per, 90, 90);
                break;
            case 'threequarter-left-top':
                angle = _calcAngle(per, 270, 0);
                break;
            case 'threequarter-right-top':
                angle = _calcAngle(per, 270, 90);
                break;
            case 'threequarter-left-bottom':
                angle = _calcAngle(per, 270, -90);
                break;
            case 'threequarter-right-bottom':
                angle = _calcAngle(per, 270, -180);
                break;
            case 'threequarter-bottom':
                angle = _calcAngle(per, 270, -135);
                break;
            }
            return angle;
        })(per);

        d3var.arc_level.datum(endAngle);
        d3var.arc_level.transition()
            .duration(option.transition.refreshTime)
            .ease(option.transition.refreshType)
            .style('fill', newColor)
            .attrTween('d', function(d) {
                var angle = d3.interpolate(d3var.curArcAngle, d);
                return function(t) {
                    d3var.curArcAngle = angle(t);
                    return d3var.arc.endAngle(angle(t))();
                };
            });
    }

    function refresh(val, min, max) {
        if (_.isNull(d3var.svg))
            return;
        if (!_.isNumber(val))
            return;

        if (option.value.hideMinMax === false) {
            if (!_.isUndefined(min)) {
                option.value.min = min;
                d3var.min.datum(option.value.min)
                    .text(getMinValueText());
            }

            if (!_.isUndefined(max)) {
                option.value.max = max;
                d3var.max.datum(option.value.max)
                    .text(getMaxValueText());
            }
        }

        val = getValueInRange(val);

        if (option.value.hide === false) {
            if (option.value.transition === true)
                valueTransition(val);
            else
                d3var.value.text(getValueText(val));
        }

        levelArcTransition(val);

        option.value.val = val;
    }

    // Public API
    return {
        resize: function() {
            resize();
        },
        refresh: function(val, min, max) {
            refresh(Number(val), min, max);
        },
        destroy: function() {
            if (_.isNull(d3var.svg)) {
                d3var.gCenter.remove();
                d3var.svg.remove();
            }
        }
    };
};