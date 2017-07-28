// ┌─────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                                │ \\
// ├─────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)                       │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)                             │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                  │ \\
// ├─────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                  │ \\
// └─────────────────────────────────────────┘ \\

(function() {
    
    var logger = log4jq.getLogger({
        loggerName: 'plugin.wg.html.js'
    });
    logger.info('plugin.wg.html.js loaded');
    
    'use strict';

    freeboard.addStyle('.htmlwidget', 'white-space:normal;display:table;');
    freeboard.addStyle('.htmlwidget > *',
        '-moz-box-sizing: border-box;' +
        '-webkit-box-sizing: border-box;' +
        'box-sizing: border-box;');

    var htmlWidget = function (settings) {
        
        var self = this;
        var BLOCK_HEIGHT = 60;

        var currentID = _.uniqueId('htmlwidget_');
        var htmlElement = $('<div class="htmlwidget" id="' + currentID + '"></div>');
        var currentSettings = settings;
        self.widgetType = 'html';

        function setBlocks(blocks) {
            if (_.isUndefined(blocks))
                return;
            var height = BLOCK_HEIGHT * blocks;
            htmlElement.css({
                'height': height + 'px',
                'width': '100%'
            });
        }

        this.render = function (element) {
            $(element).append('<h2 class="section-title"></h2>');
            $(element).append(htmlElement);
            self.onSettingsChanged(currentSettings);
            setBlocks(currentSettings.blocks);
        };

        this.onSettingsChanged = function (newSettings) {
            
            logger.info('onSettingsChanged');
            setBlocks(newSettings.blocks);
            htmlElement.html(newSettings.contents);

            var updateCalculate = false;
            if (currentSettings.value != newSettings.value){
                updateCalculate = true;
            }
            currentSettings = newSettings;
            //title
            htmlElement.parent().find(".section-title").html(currentSettings.title);
            htmlElement.parent().find(".section-title").prop('title', currentSettings.title);

            return updateCalculate;
        };

        this.onCalculatedValueChanged = function (settingName, newValue) {
            logger.info('onCalculatedValueChanged: ' + settingName);
            logger.info('newValue: ' + newValue);
             if (settingName == 'value') {
                htmlElement.html(newValue);
            }
        };

        this.onDispose = function () {
            htmlElement.remove();
        };

        this.getHeight = function () {
            return currentSettings.blocks;
        };

        //this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: 'html',
        display_name: $.i18n.t('plugins_wd.html.display_name'),
        description: $.i18n.t('plugins_wd.html.description'),
        fill_size: true,
        settings: [
//            {
//                name: 'contents',
//                display_name: $.i18n.t('plugins_wd.html.contents'),
//                type: 'htmlmixed',
//                validate: 'optional,maxSize[5000]',
//                description: $.i18n.t('plugins_wd.html.contents_desc')
//            },
            {
                name: 'title',
                validate: 'optional,maxSize[100]',
                display_name: $.i18n.t('global.title'),
                type: 'text'
            },
            {
                name: 'value',
                display_name:$.i18n.t('plugins_wd.html.contents'),
//                        $.i18n.t('plugins_wd.html.value'),
                validate:  'optional,maxSize[5000]',
                type: 'calculated',
// type: 'htmlmixed',
                description: $.i18n.t('global.limit_value_characters', 5000)
//                        $.i18n.t('plugins_wd.html.value_desc')
            },
            {
                name: 'blocks',
                display_name: $.i18n.t('global.plugins_wd.blocks'),
//                        $.i18n.t('plugins_wd.html.blocks'),
                type: 'number',
                validate: 'required,custom[integer],min[1],max[20]',
                style: 'width:100px',
                default_value: 4,
                description: $.i18n.t('global.plugins_wd.blocks_desc')
//                        $.i18n.t('plugins_wd.html.blocks_desc')
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new htmlWidget(settings));
        }
    });
}());