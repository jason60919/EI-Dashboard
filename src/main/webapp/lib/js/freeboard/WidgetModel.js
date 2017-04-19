// ┌────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                                              │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)                                     │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)                                           │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                                │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                                │ \\
// └────────────────────────────────────────────────┘ \\

function WidgetModel(theFreeboardModel, widgetPlugins) {
    'use strict';

    //added by ken 2015/10/16
    var logger = log4jq.getLogger({
        loggerName: 'WidgetModel.js'
    });

    function disposeWidgetInstance() {

        logger.info('disposeWidgetInstance');

        if (!_.isUndefined(self.widgetInstance)) {
            if (_.isFunction(self.widgetInstance.onDispose)) {
                self.widgetInstance.onDispose();
            }
            self.widgetInstance = undefined;
        }
    }

    var self = this;

    this.datasourceRefreshNotifications = {};
    this.calculatedSettingScripts = {};//user pass calculated function
    this.scriptGlobalVariables = {};

    this.isEditing = ko.observable(false); // editing by PluginEditor
    this.title = ko.observable();
    this.fillSize = ko.observable(false);

    this.type = ko.observable();
    this.type.subscribe(function (newValue) {
        disposeWidgetInstance();

        if ((newValue in widgetPlugins) && _.isFunction(widgetPlugins[newValue].newInstance)) {
            var widgetType = widgetPlugins[newValue];

            var finishLoad = function () {
                //self.settings() => plugin fields setting 
                //widgetInstance => widget class object
                widgetType.newInstance(self.settings(), function (widgetInstance) {

                    logger.debug('after init widgetInstance (' + self.type() + ')');
                    self.fillSize((widgetType.fill_size === true));
                    self.widgetInstance = widgetInstance;
                    self.shouldRender(true);
                    self._heightUpdate.valueHasMutated();
                });
            };

            // Do we need to load any external scripts?
            if (widgetType.external_scripts)
                head.js(widgetType.external_scripts.slice(0), finishLoad); // Need to clone the array because head.js adds some weird functions to it
            else
                finishLoad();
        }
    });

    this.settings = ko.observable({});
    this.settings.subscribe(function (newValue) {
        var updateCalculate = true;
        if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onSettingsChanged))
            updateCalculate = self.widgetInstance.onSettingsChanged(newValue);

        if (_.isUndefined(updateCalculate) || updateCalculate === true)
            self.updateCalculatedSettings();
        self._heightUpdate.valueHasMutated();
    });

    this.datasourceTypeName = '';//added by ken
    this.processDatasourceUpdate = function (datasourceName, datasourceModel) {

        logger.info('processDatasourceUpdate: ' + datasourceName);

        //改直接由freeboardmodel.js帶入，加速查詢速度
        //added by ken 2015/10/19
//        var datasourceInstance = theFreeboardModel.getDatasouceByName(datasourceName);
//        if(typeof(datasourceInstance) == 'undefined' && datasourceInstance != null){
//            logger.error('CANNOT get ds instance: ' + datasourceName);
//            return ;
//        }
//        self.datasourceTypeName = 
//                datasourceInstance.type();

        if (typeof (datasourceModel) != 'undefined') {
            self.datasourceTypeName = datasourceModel.type();

            //找出widget dialog有沒有設計此ds綁定的caculated 欄位名稱
            var refreshSettingNames = self.datasourceRefreshNotifications[datasourceName];

            //["value"]
            if (_.isArray(refreshSettingNames)) {
                _.each(refreshSettingNames, function (settingName) {

                    logger.debug('trigger processCalculatedSetting: ' + settingName + ', ds name (' + self.datasourceTypeName + '): ' + datasourceName);
                    self.processCalculatedSetting(settingName);
                });
            } else {
                logger.warn('CANNOT set caculated field (refreshSettingNames) on the ds name (' + self.datasourceTypeName + '): ' + datasourceName);
            }
        }




    };

    this.callValueFunction = function (theFunction, globalVariables) {
        logger.info('callValueFunction theFunction: ' + theFunction + ', globalVariables: ' + globalVariables);
        try
        {
            return theFunction.call(undefined, theFreeboardModel.datasourceData, globalVariables);
        }
        catch (e)
        {
            return "undefined";
        }
    };

    this.processSizeChange = function () {
        if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onSizeChanged))
            self.widgetInstance.onSizeChanged();
    };

    this.onPaneWidgetChanged = function (col_width) {
        if (!_.isUndefined(self.onPaneWidgetChanged) && _.isFunction(self.widgetInstance.onPaneWidgetChanged))
            self.widgetInstance.onPaneWidgetChanged(col_width);
    };



    //!!IMPORTANT
    /*
     * procress calculated setting CORE FUNC
     * @param {type} settingName
     * @returns {String} 
     */
    this.processCalculatedSetting = function (settingName) {
        logger.info('processCalculatedSetting:');

        logger.debug('calcuated field key: ' + settingName);

        if (_.isFunction(self.calculatedSettingScripts[settingName])) {
            //FINAL: calculated value
            var returnValue;
            var agentConnection = true;

            try {

                returnValue =
                        self.callValueFunction(
                                self.calculatedSettingScripts[settingName],
                                self.scriptGlobalVariables[settingName]);
                //data adapter process
                /*
                 {
                 'ds': '<data source>',
                 'wg': '<widget name>',
                 'data': '<response from data source>'
                 }*/
                //added by ken 2015/10/17

//                    logger.debug('self.settings() as below');

                if (self.datasourceTypeName != '') {


                    logger.debug('ds type: ' + self.datasourceTypeName + ', wg type:' + self.type());
                    //
//!IMPORTANT:
                    //if widget have multi_input, returnValue will be array 
                    var processConfig = {
                        ds: self.datasourceTypeName,
                        wg: self.type(),
                        data: returnValue
                    };
                    logger.debug(processConfig);
                    logger.debug('start to call DataSourceAdapter.process');

                    var dataSourceName = self.calculatedSettingScripts[settingName].toString().split('datasources["')[1].split('"]')[0];
                                                                        
                    for (var i in theFreeboardModel.datasourceData) {
                        if(i === dataSourceName){
                            agentConnection = theFreeboardModel.datasourceData[i].result.connected;
                            break;
                        }
                    }
                    
                    returnValue = DataSourceAdapter.process(processConfig);
                    DataSourceAdapter.setExceptionEventCallback(function (err) {
                        //                        alert(err);
                        logger.error(err);
                    });
                }


                logger.debug(' self.callValueFunction: ' + returnValue);

            } catch (e) {
                logger.debug('processCalculatedSetting catch (1): ' + e.toString());
                var rawValue = self.settings()[settingName];

                // If there is a reference error and the value just contains letters and numbers, then
                if (e instanceof ReferenceError && (/^.*/).test(rawValue))
                    returnValue = rawValue;
                else if (e instanceof TypeError && e.message.indexOf('Cannot read property') != -1)
                    ;
            }
            //trigger widget's onCalculatedValueChanged
            if (!_.isUndefined(self.widgetInstance)
                    && _.isFunction(self.widgetInstance.onCalculatedValueChanged)
                    && !_.isUndefined(returnValue)) {
                try {
                    //trigger calculated value change event after response 
                    logger.debug('trigger onCalculatedValueChanged (return value: ' + returnValue + ')');

                    self.widgetInstance.onCalculatedValueChanged(settingName, returnValue, agentConnection);

                } catch (e) {
                    logger.error('processCalculatedSetting catch (2): ' + e.toString());
                }
            }
        }
    };

    this.updateDatasourceNameRef = function (newDatasourceName, oldDatasourceName) {
        if (_.isUndefined(self.type()))
            return;

        var settingsDefs = widgetPlugins[self.type()].settings;
        var oldRegex = new RegExp('datasources\\[[\'\"]' + _.escapeRegExp(oldDatasourceName) + '[\'\"]\\]', 'g');
        var rep = 'datasources[\"' + newDatasourceName + '\"]';
        var currentSettings = self.settings();

        _.each(settingsDefs, function (settingDef) {
            if (settingDef.type === 'calculated') {
                var script = currentSettings[settingDef.name];

                if (!_.isUndefined(script)) {
                    script = script.replace(oldRegex, rep);
                    currentSettings[settingDef.name] = script;
                    self.settings(currentSettings);
                }
            }
        });
    };

    this.updateCalculatedSettings = function () {
        self.datasourceRefreshNotifications = {};
        self.calculatedSettingScripts = {};

        if (_.isUndefined(self.type())) {
            return;
        }

        // Check for any calculated settings
        var settingsDefs = widgetPlugins[self.type()].settings;
        var datasourceRegex = new RegExp('datasources.([\\w_-]+)|datasources\\[[\'\"]([^\'\"]+)', 'g');
        var currentSettings = self.settings();

        _.each(settingsDefs, function (settingDef) {

            if (settingDef.type === 'calculated') {

                var script = currentSettings[settingDef.name];

                if (!_.isUndefined(script)) {

                    // clear global variable
                    self.scriptGlobalVariables[settingDef.name] = {};

                    if (_.isArray(script))
                        script = '[' + script.join(',') + ']';

                    // If there is no return, add one
                    if ((script.match(/;/g) || []).length <= 1 && script.indexOf('return') == -1)
                        script = 'return ' + script;

                    var valueFunction;

                    //new function
                    try {
                        logger.debug('SUC to create valueFunction instance as below:');
                        logger.debug(script);
                        valueFunction = new Function('datasources', '_global', script);
                    } catch (e) {
                        logger.debug('FAIL to create valueFunction instance as below:');
                        try {
                            var literalText = currentSettings[settingDef.name].replace(/"/g, '\\"').replace(/[\r\n]/g, ' \\\n');
                            // If the value function cannot be created, then go ahead and treat it as literal text
                            valueFunction = new Function('datasources', '_global', 'return \"' + literalText + '\";');
                        } catch (e) {
//                            alert(e);
                            logger.error(e);
                            //避免用戶亂改datasources的字串造成parse錯誤
                        }



                    }

                    self.calculatedSettingScripts[settingDef.name] = valueFunction;
                    self.processCalculatedSetting(settingDef.name);

                    // Are there any datasources we need to be subscribed to?
                    var matches;
                    while (matches = datasourceRegex.exec(script)) {
                        var dsName = (matches[1] || matches[2]);
                        var refreshSettingNames = self.datasourceRefreshNotifications[dsName];

                        if (_.isUndefined(refreshSettingNames)) {
                            refreshSettingNames = [];
                            self.datasourceRefreshNotifications[dsName] = refreshSettingNames;
                        }

                        // Only subscribe to this notification once.
                        if (_.indexOf(refreshSettingNames, settingDef.name) === -1)
                            refreshSettingNames.push(settingDef.name);
                    }
                }
            }
        });
    };

    this._heightUpdate = ko.observable();
    this.height = ko.computed({
        read: function () {
            self._heightUpdate();
            if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.getHeight)) {
                return self.widgetInstance.getHeight();
            }
            return 1;
        }
    });

    this.shouldRender = ko.observable(false);
    this.render = function (element) {
        self.shouldRender(false);
        if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.render)) {
            self.widgetInstance.render(element);
            self.updateCalculatedSettings();
        }
    };

    this.dispose = function () {
        if (!_.isUndefined(self.widgetInstance) && _.isFunction(self.widgetInstance.onDispose))
            self.widgetInstance.onDispose();
    };

    this.serialize = function () {
        return {
            title: self.title(),
            type: self.type(),
            settings: self.settings()
        };
    };

    this.deserialize = function (object) {
        self.title(object.title);
        self.settings(object.settings);
        self.type(object.type);
    };
}
