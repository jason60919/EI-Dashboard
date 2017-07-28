
(function () {

    var logger = log4jq.getLogger({
        loggerName: 'plugin.wg.sparkline.js'
    });
    logger.info('plugin.wg.sparkline.js loaded');

    freeboard.addStyle('.sparkline', "width:100%;height: 75px;");

    var SPARKLINE_HISTORY_LENGTH = 100;
//    var SPARKLINE_COLORS = ["#FF9900", "#FFFFFF", "#B3B4B4", "#6B6B6B", "#28DE28", "#13F7F9", "#E6EE18", "#C41204", "#CA3CB8", "#0B1CFB"];
    //modified by ken 20151115
    //replace #FFFFFF to #EFEFE8 inorder to support white theme
    var SPARKLINE_COLORS = ["#FF9900", "#EFEFE8", "#B3B4B4", "#6B6B6B", "#28DE28", "#13F7F9", "#E6EE18", "#C41204", "#CA3CB8", "#0B1CFB"];

    function easeTransitionText(newValue, textElement, duration) {

        var currentValue = $(textElement).text();

        if (currentValue == newValue)
            return;

        if ($.isNumeric(newValue) && $.isNumeric(currentValue)) {
            var numParts = newValue.toString().split('.');
            var endingPrecision = 0;

            if (numParts.length > 1) {
                endingPrecision = numParts[1].length;
            }

            numParts = currentValue.toString().split('.');
            var startingPrecision = 0;

            if (numParts.length > 1) {
                startingPrecision = numParts[1].length;
            }

            jQuery({transitionValue: Number(currentValue), precisionValue: startingPrecision}).animate({transitionValue: Number(newValue), precisionValue: endingPrecision}, {
                duration: duration,
                step: function () {
                    $(textElement).text(this.transitionValue.toFixed(this.precisionValue));
                },
                done: function () {
                    $(textElement).text(newValue);
                }
            });
        }
        else {
            $(textElement).text(newValue);
        }
    }

    function addSparklineLegend(element, legend) {
        var legendElt = $("<div class='sparkline-legend'></div>");
        for (var i = 0; i < legend.length; i++) {
            var color = SPARKLINE_COLORS[i % SPARKLINE_COLORS.length];
            var label = legend[i];
            legendElt.append("<div class='sparkline-legend-value'><span style='color:" +
                    color + "'>&#9679;</span>" + label + "</div>");
        }
        element.empty().append(legendElt);

        freeboard.addStyle('.sparkline-legend', "margin:5px;");
        freeboard.addStyle('.sparkline-legend-value',
                'color:white; font:10px arial,san serif; float:left; overflow:hidden; width:50%;');
        freeboard.addStyle('.sparkline-legend-value span',
                'font-weight:bold; padding-right:5px;');
    }

    /*
     * 
     * @param {jquery elem} element
     * @param {Array} value
     * @param {String} legend
     * @returns {undefined}
     */
    function addValueToSparkline(element, value, legend) {
        logger.info('addValueToSparkline');
        console.log(value);
        logger.debug('update sparkline value: ' + value + ' ,legend: ' + legend);

        var values = $(element).data().values;
        var valueMin = $(element).data().valueMin;
        var valueMax = $(element).data().valueMax;
        if (!values) {
            values = [];
            valueMin = undefined;
            valueMax = undefined;
        }

        var collateValues = function (val, plotIndex) {
            logger.info('collateValues: (' + plotIndex + ') ' + val);
            if ($.isNumeric(val)) {
                if (!values[plotIndex]) {
                    values[plotIndex] = [];
                }
                if (values[plotIndex].length >= SPARKLINE_HISTORY_LENGTH) {
                    values[plotIndex].shift();
                }
                values[plotIndex].push(Number(val));

                if (valueMin === undefined || val < valueMin) {
                    valueMin = val;
                }
                if (valueMax === undefined || val > valueMax) {
                    valueMax = val;
                }
            } else {
                logger.error('invalid sparkline value (' + plotIndex + '): ' + value);
            }

        }

        if (_.isArray(value)) {
            _.each(value, collateValues);
        } else {
            collateValues(value, 0);
        }
        $(element).data().values = values;
        $(element).data().valueMin = valueMin;
        $(element).data().valueMax = valueMax;

        var tooltipHTML = '<span style="color: {{color}}">&#9679;</span> {{y}}';

        var composite = false;
        _.each(values, function (valueArray, valueIndex) {
            $(element).sparkline(valueArray, {
                type: "line",
                composite: composite,
                height: "100%",
                width: "100%",
                fillColor: false,
                lineColor: SPARKLINE_COLORS[valueIndex % SPARKLINE_COLORS.length],
                lineWidth: 2,
                spotRadius: 3,
                spotColor: false,
                minSpotColor: "#78AB49",
                maxSpotColor: "#78AB49",
                highlightSpotColor: "#9D3926",
                highlightLineColor: "#9D3926",
                chartRangeMin: valueMin,
                chartRangeMax: valueMax,
                tooltipFormat: (legend && legend[valueIndex]) ? tooltipHTML + ' (' + legend[valueIndex] + ')' : tooltipHTML
            });
            composite = true;
        });


    }

    var sparklineWidget = function (settings) {
        var self = this;

        var titleElement = $('<h2 class="section-title"></h2>');
        var sparklineElement = $('<div class="sparkline"></div>');
        var sparklineLegend = $('<div ></div>');
        var currentSettings = settings;

        this.render = function (element) {
            logger.info('render');
            $(element).append(titleElement).append(sparklineElement).append(sparklineLegend);
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
            titleElement.prop('title', titleElement.html());
            if (newSettings.include_legend) {
                addSparklineLegend(sparklineLegend, newSettings.legend.split(","));
            }
        }

        this.onCalculatedValueChanged = function (settingName, newValue, agentConnection) {
            logger.info('onCalculatedValueChanged');
            logger.debug('settingName: ' + settingName + ', newValue:' + newValue);
            
            //Add icon to specify agent connect or not
            if ((agentConnection === false && !titleElement.hasClass('agentDisconnect')) || (agentConnection === true && titleElement.hasClass('agentDisconnect'))) {
                titleElement.toggleClass('agentDisconnect');
                titleElement.removeAttr('title');
            }

            if (currentSettings.legend) {
                addValueToSparkline(sparklineElement, newValue, currentSettings.legend.split(","));
            } else {
                addValueToSparkline(sparklineElement, newValue);
            }
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            var legendHeight = 0;
            if (currentSettings.include_legend && currentSettings.legend) {
                var legendLength = currentSettings.legend.split(",").length;
                if (legendLength > 4) {
                    legendHeight = Math.floor((legendLength - 1) / 4) * 0.5;
                } else if (legendLength) {
                    legendHeight = 0.5;
                }
            }
            return 2 + legendHeight;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "sparkline",
        display_name: $.i18n.t('plugins_wd.sparkline.display_name'),
//                "Sparkline",
//    "external_scripts": [
//        "plugins/thirdparty/jquery.sparkline.min.js"
//    ],
        settings: [
            {
                name: "title",
                validate: 'optional,maxSize[100]',
                display_name: $.i18n.t('global.title'),
                type: "text"
            },
            {
                name: "value",
                display_name: $.i18n.t('global.data'),
                type: "calculated",
                multi_input: "true"
            },
            {
                name: "include_legend",
                display_name: $.i18n.t('global.plugins_wd.includeLegend'),
                type: "boolean"
            },
            {
                name: "legend",
                display_name: $.i18n.t('global.plugins_wd.legend'),
                type: "text",
                description: $.i18n.t('global.plugins_wd.legendDesc')
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new sparklineWidget(settings));
        }
    });

}());
