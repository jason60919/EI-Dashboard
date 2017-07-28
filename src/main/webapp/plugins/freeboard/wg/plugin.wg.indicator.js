// ┌────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                                              │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)                                     │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)                                           │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                                │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                                │ \\
// └────────────────────────────────────────────────┘ \\

(function () {
    'use strict';

    var logger = log4jq.getLogger({
        loggerName: 'plugin.wg.indicator.js'
    });

    logger.info('plugin.wg.indicator.js loaded');

    freeboard.addStyle('.indicator-light', 'border-radius:50%;width:22px;height:22px;border:2px solid #3d3d3d;margin-top:5px;float:left;background-color:#222;margin-right:10px;');
    freeboard.addStyle('.indicator-light.on', 'background-color:#FFC773;box-shadow: 0px 0px 15px #FF9900;border-color:#FDF1DF;');
    freeboard.addStyle('.indicator-text', 'margin-top:10px;');

    var indicatorWidget = function (settings) {
        var self = this;
        var titleElement = $('<h2 class="section-title"></h2>');
        var stateElement = $('<div class="indicator-text"></div>');
        var stateText = {};
        var indicatorElement = $('<div class="indicator-light"></div>');
        var currentSettings = settings;
        var isOn = false;
        self.widgetType = 'indicator';

        function updateState() {
            indicatorElement.toggleClass('on', isOn);

            if (isOn) {
                stateElement.text((_.isUndefined(stateText.on_text) ? '' : stateText.on_text));
            }
            else {
                stateElement.text((_.isUndefined(stateText.off_text) ? '' : stateText.off_text));
            }
        }

        this.render = function (element) {
            $(element).append(titleElement).append(indicatorElement).append(stateElement);
        };

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? '' : newSettings.title));
            titleElement.prop('title', titleElement.html());
            updateState();
            return true;
        };

        this.onCalculatedValueChanged = function (settingName, newValue, agentConnection) {
            if (settingName === 'value') {
                logger.debug('newValue: ' + newValue);
                isOn = Boolean(newValue);
                if (newValue == "undefined") isOn = false;
                logger.debug('isOn: ' + isOn);
            }
            if (newValue == "undefined")
                stateText[settingName] = currentSettings[settingName];
            else    
                stateText[settingName] = newValue;

            //Add icon to specify agent connect or not
            if ((agentConnection === false && !titleElement.hasClass('agentDisconnect')) || (agentConnection === true && titleElement.hasClass('agentDisconnect'))) {
                titleElement.toggleClass('agentDisconnect');
                titleElement.removeAttr('title');
            }

            updateState();
        };

        this.onDispose = function () {
        };

        this.getHeight = function () {
            return 1;
        };

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: 'indicator',
        display_name: $.i18n.t('plugins_wd.indicator.display_name'),
        description: $.i18n.t('plugins_wd.indicator.description'),
        settings: [
            {
                name: 'title',
                display_name: $.i18n.t('global.title'),
//                        $.i18n.t('plugins_wd.indicator.title'),
                validate: 'optional,maxSize[100]',
                type: 'text',
                description:
                        $.i18n.t('global.limit_value_characters', 100)
//                        $.i18n.t('plugins_wd.indicator.title_desc')
            },
            {
                name: 'value',
                display_name: $.i18n.t('global.value'),
//                        $.i18n.t('plugins_wd.indicator.value'),
                validate: 'optional,maxSize[2000]',
                type: 'calculated',
                description: $.i18n.t('global.limit_value_characters', 2000)
//                        $.i18n.t('plugins_wd.indicator.value_desc')
            },
            {
                name: 'on_text',
                display_name: $.i18n.t('plugins_wd.indicator.on_text'),
                validate: 'optional,maxSize[500]',
                type: 'calculated',
                description: $.i18n.t('global.limit_value_characters', 500)
//                        $.i18n.t('plugins_wd.indicator.on_text_desc')
            },
            {
                name: 'off_text',
                display_name: $.i18n.t('plugins_wd.indicator.off_text'),
                validate: 'optional,maxSize[500]',
                type: 'calculated',
                description: $.i18n.t('global.limit_value_characters', 500)
//                        $.i18n.t('plugins_wd.indicator.off_text_desc')
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new indicatorWidget(settings));
        }
    });
}());
