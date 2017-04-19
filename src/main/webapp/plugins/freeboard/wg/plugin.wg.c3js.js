// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                                                                                      │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                                                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                                                                        │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function () {

    var logger = log4jq.getLogger({
        loggerName: 'plugin.wg.c3js.js'
    });
    logger.info('plugin.wg.c3js.js loaded');
    'use strict';

    var c3jsWidget = function (settings) {
        var self = this;

        var BLOCK_HEIGHT = 60;
        var PADDING = 10;

        var currentID = _.uniqueId('c3js_');
        var titleElement = $('<h2 class="section-title"></h2>');
        var chartElement = $('<div id="' + currentID + '"></div>');
        var currentSettings;
        var chart = null;
        self.widgetType = 'c3js';
        function setBlocks(blocks) {
            if (_.isUndefined(blocks))
                return;
            var titleMargin = (titleElement.css('display') === 'none') ? 0 : titleElement.outerHeight();

            var height = (BLOCK_HEIGHT) * blocks - PADDING - titleMargin;

            chartElement.css({
                'max-height': height + 'px',
                'height': height + 'px',
                'width': '100%',
            });
            if (!_.isNull(chart))
                chart.resize();
        }

        function createWidget(data, chartsettings) {
            logger.info('createWidget');
            try {
                if (_.isNull(chart)) {
                    var aX = ["x"];
                    var aData = ["Data"];
                    chart = c3.generate({
                        bindto: '#' + currentID,
                        data: {
                            x: 'x',
                            xFormat: '%Y-%m-%d %H:%M:%S',
                            columns: [
                                aX,
                                aData
                            ],
                            types: {
                                SystemTemperature: 'area',
                            }
                        },
                        axis: {
                            x: {
                                type: 'timeseries',
                                tick: {
                                    format: "%H:%M:%S"
                                }
                            }
                        },
                        padding: {
                            right: 30
                        }
                    });
                }
                else
                {
                    var aX = ["x"];
                    var aData = ["Data"];
                    for (var i = 0; i < data.itemList.length; i++)
                    {
                        aData[0] = data.itemList[i].sensorId;
                        var aDate = data.itemList[i].ts.split(" ")[0].split("-");
                        var aTime = data.itemList[i].ts.split(" ")[1].split(":");
                        var dDate = new Date(aDate[0], aDate[1]-1, aDate[2], aTime[0], aTime[1], aTime[2]);
                        var nOffset = dDate.getTimezoneOffset();
                        var dLocal = new Date(dDate - (nOffset * 60 * 1000));
                        var strLocal = dLocal.getFullYear() + "-" + (dLocal.getMonth() + 1) + "-" + dLocal.getDate() + " " + dLocal.getHours() + ":" + dLocal.getMinutes() + ":" + dLocal.getSeconds();
                        aX.push(strLocal);
                        aData.push(data.itemList[i].v);
                    }
                    chart.load({
                        columns: [
                            aX,
                            aData
                        ]
                    });
                }
            } catch (e) {
                logger.error('Invalid format: ' + e);
                chartElement.html($.i18n.t('global.invaliddataformat'));
                return;
            }
        }

        function destroyChart() {
            logger.info('destroyChart');
            if (!_.isNull(chart)) {
                chart.destroy();
                chart = null;
            }
        }

        this.render = function (element) {
            $(element).append(titleElement).append(chartElement);
            titleElement.html((_.isUndefined(currentSettings.title) ? '' : currentSettings.title));
            setBlocks(currentSettings.blocks);
        };

        this.onSettingsChanged = function (newSettings) {
            if (titleElement.outerHeight() === 0) {
                currentSettings = newSettings;
                return;
            }

            titleElement.html((_.isUndefined(newSettings.title) ? '' : newSettings.title));
            if (_.isUndefined(newSettings.title) || newSettings.title === '')
                titleElement.css('display', 'none');
            else
                titleElement.css('display', 'block');

            setBlocks(newSettings.blocks);

            var updateCalculate = false;
            updateCalculate = true;
            currentSettings = newSettings;
            return updateCalculate;
        };

        this.onCalculatedValueChanged = function (settingName, newValue, agentConnection) {
            logger.info('onCalculatedValueChanged: ' + settingName);
            logger.debug(newValue);

            //Add icon to specify agent connect or not
            if ((agentConnection === false && !titleElement.hasClass('agentDisconnect')) || (agentConnection === true && titleElement.hasClass('agentDisconnect'))) {
                titleElement.toggleClass('agentDisconnect');
                titleElement.removeAttr('title');
            }

            if (!_.isObject(newValue))
                return;

//            var dDate = new Date();
//            var nOffset = dDate.getTimezoneOffset();
//            var dLocal = dDate - (nOffset * 60 * 1000);
//            for (var i = 1; i < newValue.data.columns[1].length; i++)
//            {
//                newValue.data.columns[1][i] = newValue.data.columns[1][i] - nOffset * 60 * 1000;
//            }
            createWidget(newValue, currentSettings);
        };

        this.onDispose = function () {
            destroyChart();
        };

        this.onSizeChanged = function () {
            if (!_.isNull(chart))
                chart.resize();
        };

        this.getHeight = function () {
            return currentSettings.blocks;
        };

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: 'c3js',
        display_name: $.i18n.t('plugins_wd.c3js.display_name'),
        description: $.i18n.t('plugins_wd.c3js.description'),
        settings: [
            {
                name: 'title',
                display_name: $.i18n.t('global.title'),
                //$.i18n.t('plugins_wd.c3js.title'),
                validate: 'optional,maxSize[100]',
                type: 'text',
                description: $.i18n.t('global.limit_value_characters', 100)
                        //$.i18n.t('plugins_wd.c3js.title_desc')
            },
            {
                name: 'blocks',
                display_name: $.i18n.t('global.plugins_wd.blocks'),
                //$.i18n.t('plugins_wd.c3js.blocks'),
                validate: 'required,custom[integer],min[2],max[20]',
                type: 'number',
                style: 'width:100px',
                default_value: 4,
                description: $.i18n.t('global.plugins_wd.blocks_desc')
//                                        $.i18n.t('plugins_wd.c3js.blocks_desc')
            },
            {
                name: 'value1',
                display_name: $.i18n.t('global.data'),
//                                        $.i18n.t('plugins_wd.c3js.value'),
                validate: 'optional,maxSize[5000]',
                type: 'calculated',
                description: $.i18n.t('global.limit_value_characters', 5000)
//                                        $.i18n.t('plugins_wd.c3js.value_desc')
            },
            {
                name: 'value2',
                display_name: $.i18n.t('global.data'),
//                                        $.i18n.t('plugins_wd.c3js.value'),
                validate: 'optional,maxSize[5000]',
                type: 'calculated',
                description: $.i18n.t('global.limit_value_characters', 5000)
//                                        $.i18n.t('plugins_wd.c3js.value_desc')
            },
            {
                name: 'value3',
                display_name: $.i18n.t('global.data'),
//                                        $.i18n.t('plugins_wd.c3js.value'),
                validate: 'optional,maxSize[5000]',
                type: 'calculated',
                description: $.i18n.t('global.limit_value_characters', 5000)
//                                        $.i18n.t('plugins_wd.c3js.value_desc')
            },
            {
                name: 'value4',
                display_name: $.i18n.t('global.data'),
//                                        $.i18n.t('plugins_wd.c3js.value'),
                validate: 'optional,maxSize[5000]',
                type: 'calculated',
                description: $.i18n.t('global.limit_value_characters', 5000)
//                                        $.i18n.t('plugins_wd.c3js.value_desc')
            },
            {
                name: 'value5',
                display_name: $.i18n.t('global.data'),
//                                        $.i18n.t('plugins_wd.c3js.value'),
                validate: 'optional,maxSize[5000]',
                type: 'calculated',
                description: $.i18n.t('global.limit_value_characters', 5000)
//                                        $.i18n.t('plugins_wd.c3js.value_desc')
            },
            {
                name: 'options',
                display_name: $.i18n.t('plugins_wd.c3js.options'),
                validate: 'optional,maxSize[5000]',
                type: 'json',
                default_value: '{\n\"data": {\n\"type": "line"\n\}\n\}',
                description:
                        $.i18n.t('global.limit_value_characters', 5000),
                addClass: 'advancedSetting'
//                                        $.i18n.t('plugins_wd.c3js.options_desc')
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new c3jsWidget(settings));
        }
    });
}());
