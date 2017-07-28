/*
 * fork https://github.com/daleroy1/freeboard-table
 */
(function ()
{
    var logger = log4jq.getLogger({
        loggerName: 'SA.wg.table.js'
    });
    logger.info('SA.wg.table.js loaded');

    if (typeof (i18n) != 'undefined') {
//       i18n.addResource('en', 'translation', '<i18n_KEY>', '<i18n_VALUE>');
    }

    //Setting white-space to normal to override gridster's inherited value
    freeboard.addStyle('table.list-table', "width: 100%; white-space: normal !important; ");
    //freeboard.addStyle('table.list-table tbody', "background-color: aliceblue;");
    //freeboard.addStyle('table.list-table th', "border:#a2a3a6 1px solid; background: azure;");
    freeboard.addStyle('table.list-table th', "border:#a2a3a6 1px solid;");
    freeboard.addStyle('table.list-table td, table.list-table th', "padding: 2px 2px 2px 2px; vertical-align: top;  border-bottom:#a2a3a6 1px solid;");

    var tableWidget = function (settings) {

        var self = this;
        var titleElement = $('<h2 class="section-title"></h2>');
        var stateElement = $('<div><table class="list-table"><thead/></table></div>');
        var currentSettings = settings;
        //store our calculated values in an object
        var stateObject = {};
        self.widgetType = 'table';

        function updateState() {
            logger.info('updateState');
            stateElement.find('thead').empty();
            stateElement.find('tbody').remove();
            var bodyHTML = $('<tbody/>');

            var headerRow = $('<tr/>');
            headerRow.append($('<th/>').html("sensorId"));
            headerRow.append($('<th/>').html("ts"));
            headerRow.append($('<th/>').html("v"));
            stateElement.find('thead').append(headerRow);
            try
            {
                for (var i=0; i<stateObject.value.itemList.length; i++)
                {
                    var bodyHTML = $('<tr/>');
                    bodyHTML.append($('<td/>').html(stateObject.value.itemList[i].sensorId).addClass("td-0"));
                    bodyHTML.append($('<td/>').html(stateObject.value.itemList[i].ts).addClass("td-1"));
                    if (typeof stateObject.value.itemList[i].v != "undefined")
                        bodyHTML.append($('<td/>').html(stateObject.value.itemList[i].v).addClass("td-2"));
                    if (typeof stateObject.value.itemList[i].bv != "undefined")
                        bodyHTML.append($('<td/>').html(stateObject.value.itemList[i].bv).addClass("td-2"));
                    if (typeof stateObject.value.itemList[i].sv != "undefined")
                        bodyHTML.append($('<td/>').html(stateObject.value.itemList[i].sv).addClass("td-2"));
                    stateElement.find('table').append(bodyHTML);
                }
            }
            catch (e){}

            //show or hide the header based on the setting
            if (currentSettings.show_header) {
                stateElement.find('thead').show();
            } else {
                stateElement.find('thead').hide();
            }

            var nHeight = 0;
            for(var i=1 ; i<currentSettings.height ; i++)
            {
                //nHeight = nHeight + 50 + i*2;
                nHeight = nHeight + 70 - i*(1.8);
            }
            stateElement.css({'max-height': nHeight + 'px', 'overflow': 'auto'});
        }

        this.render = function (element) {
            $(element).append(titleElement).append(stateElement);

        };

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
            titleElement.prop('title', titleElement.html());
            updateState();
        };

        this.onCalculatedValueChanged = function (settingName, newValue, agentConnection) {
            //whenver a calculated value changes, stored them in the variable 'stateObject'
            stateObject[settingName] = newValue;
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
//            var height = Math.ceil(stateElement.height() / 55);
//            logger.debug('current table height: ' + height);
//            return (height > 0 ? height : 2);//default二格
            var currentHeight = parseInt(currentSettings.height);
            return currentHeight;
        };

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "table",
        display_name: $.i18n.t('plugins_wd.table.display_name'),
        description: $.i18n.t('plugins_wd.table.description'),
//        external_scripts: [
//            'js/FreeBoard/plugins/thirdparty/jquery.freezeheader.js'
//        ],
        settings: [
            {
                name: "title",
                validate: 'optional,maxSize[100]',
                display_name: $.i18n.t('global.title'),
                //$.i18n.t('plugins_wd.table.title'),
                type: "text"
            },
            {
                name: "value",
                display_name: $.i18n.t('global.data'),
                //$.i18n.t('plugins_wd.table.value'),
                type: "calculated"
//                ,
//                default_value: "{header:[\"Drink\",\"Taste\",\"Rating\"],data:[{\"Drink\":\"Beer\",\"Taste\":\"Awesome\"},{\"Drink\":\"Vodka\",\"Taste\":\"Bland\",\"Rating\":\"8\"}]}"
            },
            {
                name: "show_header",
                display_name: $.i18n.t('plugins_wd.table.show_header'),
                default_value: true,
                type: "boolean",
                addClass: 'advancedSetting'
            },
            {
                name: "replace_value",
                display_name: $.i18n.t('plugins_wd.table.replace_value'),
                type: "text",
                addClass: 'advancedSetting'
            },
            {
                name: "height",
                display_name: $.i18n.t('global.plugins_wd.blocks'),
                validate: "required,custom[integer],min[1],max[20]",
                type: "number",
                default_value: 5,
                description: $.i18n.t('global.plugins_wd.blocks_desc'),
                addClass: 'advancedSetting'
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new tableWidget(settings));
        }
    });
}());	