
/* 
 * Device convert to Content pack 
 * HDDMonitor, 
 * power_onoff, 
 * screenshot, 
 * NetMonitor, 
 * ProcessMonitor, 
 * protection, 
 * recovery, 
 * remote_kvm, 
 * SUSIControl, 
 * terminal
 * @date 2015/11/09
 */
var Device2ContentPackGenerator = (function (log4jq) {

    var self = {};

    var logger = log4jq.getLogger({
        loggerName: 'SA.Device2ContentPackGenerator.js'
    });
    logger.info('init Device2ContentPackGenerator');


//    var REFRESH_TIME_unit = 5;
    var REFRESH_TIME = 5;
//    var REFRESH_TIME = 50;
    var LIMIT_DATA_SOURCES = 25;

    var NUMERICAL_TYPE = 'numerical';

    var $document = $(document);
//    self.createdEventCallback = null;
//    self.setCreatedEventCallback = function (newCallback) {
//        logger.debug('setCreatedEventCallback');
//        self.createdEventCallback = newCallback;
//    };

    //get all sensor Id
    //if gateway your need to combine
    var groupSensorIds = {};//group sensorIds

    //
    // parse SensorID
    //
    var getSensorID = function (agentId, handler, success, error) {
        logger.info('getSensorID');
        var postBody = {request: {agentId: agentId, handler: handler}};

        REST.send({
            url: '/DeviceCtl/getSensorID',
            method: 'POST',
            data: JSON.stringify(postBody)
        }, function (data) {
            logger.debug('success to get fuzzySearch data');
            success(data);
        }, function () {
            logger.debug('fail to get fuzzySearch data');
            error();
        });
    };

    //
    // get value of first slash
    //
    var getFirstLevelOfPath = function (fullPathOfSensorID) {
//        /Hardware Monitor/Voltage/5V Standby
        var spiltResult = fullPathOfSensorID.split('/');
        var firstLevel = spiltResult[1];
        logger.debug('getFirstLevelOfPath: ' + firstLevel);
        return firstLevel;
    };


    //
    // get Bn name
    //
    var getBNOfPath = function (fullPathOfSensorID) {
        var getLastSlash = fullPathOfSensorID.lastIndexOf('/');
        var bn = fullPathOfSensorID.substring(0, getLastSlash);
        logger.debug('getBNOfPath: ' + bn);
        return bn;
    };

    //add data sources and widget
    var addDatasourcesAndWidget = function (device, handlerName, sensorID, dataSourcesType, configGenerator) {
        logger.debug('addDatasourcesAndWidget');

        var newDS = null;
        if (typeof (device) != 'undefined') {
            newDS = configGenerator.getDatasourceTemplate();

            switch(dataSourcesType)
            {
                case "dataAnalyze" :
                    newDS.name = getDSNameFromSensorId(sensorID)+ "(DA)";
                    newDS.type = dataSourcesType;
                    newDS.settings = {
                        "handler": handlerName,
                        "refresh": 60,
                        "source": sensorID.sensorID,
                        "user": device.accountid,
                        "method":"getAvgHistData",
                        "timerange": "hour"
                    };
                    break;
                default :    
                    newDS.name = getDSNameFromSensorId(sensorID);
                    newDS.type = dataSourcesType;
                    newDS.settings = {
                        "handler": handlerName,
                        "refresh": REFRESH_TIME,
                        "source": sensorID.sensorID,
                        "user": device.accountid,
                        "method":"getAvgHistData",
                        "timerange": "hour"
                    };
                    break;
            }
            
            if (device.agentType == 'SenHub') {
                newDS.settings.device = device.parentAgentId;
                newDS.settings.senhub = device.agentId;
            } else {
                //alert( device.agentId);
                newDS.settings.senhub = device.agentId;
                newDS.settings.device = device.agentId;
            }
            configGenerator.addDS(newDS);
        }
    };

    //append datasources and panes into config generator
    var appendDatasourcesAndPanes = function (device, handlerName, groupSensorIds, configGenerator) {
        logger.info('appendDatasourcesAndPanes: ' + handlerName);
        logger.debug(device);
        var isPaneCreated = [];//for check pane is exist or NOT
        var countOfSensorGroupKey = 0;
        
        //RealTime widget
        for (sensorGroupKey in groupSensorIds) {
            logger.debug('sensorGroupKey: ' + sensorGroupKey);
            countOfSensorGroupKey++;
            var sensorIdsArr = groupSensorIds[sensorGroupKey];
            for (var i = 0; i < sensorIdsArr.length; i++) {
                //create pane
                var isExistPane = isPaneCreated.indexOf(sensorGroupKey + " : " + sensorIdsArr[i].name);
                var newPane = null;//pane of freeboard
                if (isExistPane < 0) {
                    //create pane
                    newPane = configGenerator.getPaneTemplate();
                    newPane.title = sensorGroupKey + " : " + sensorIdsArr[i].name;
                    logger.debug('create pane');
                    configGenerator.addPane(newPane);
                } else {
                    //find pane
                    logger.debug('find prev pane');
                    newPane = configGenerator.getPane(sensorGroupKey + " : " + sensorIdsArr[i].name);
                }
                var sensorID = sensorIdsArr[i];// JSON object, sensorID
                //create ds
                addDatasourcesAndWidget(device, handlerName, sensorID, 'realtimedata', configGenerator);
                //create new widget to pane
                addWidgetToPane(newPane, sensorID, configGenerator);
            }
        }

        //Data Analytic widget
        for (sensorGroupKey in groupSensorIds) {
            logger.debug('sensorGroupKey: ' + sensorGroupKey);
            countOfSensorGroupKey++;
            
            //Only for type == "v"
            var sensorIdsArr = groupSensorIds[sensorGroupKey];
            var bValid = false;
            for (var i = 0; i < sensorIdsArr.length; i++) {
                var sensorID = sensorIdsArr[i];// JSON object, sensorID
                if (sensorID.type == "v")
                {
                    bValid = true;
                    break;
                }
            }
            
            if (!bValid) continue;
            //
            //create pane
            //
            var isExistPane = isPaneCreated.indexOf(sensorGroupKey + "(DA)");
            var newPane = null;//pane of freeboard
            if (isExistPane < 0) {
                //create pane
                newPane = configGenerator.getPaneTemplate();
                newPane.title = sensorGroupKey + "(DA)";
                newPane.col_width = 2;
                logger.debug('create pane');
                configGenerator.addPane(newPane);
            } else {
                //find pane
                logger.debug('find prev pane');
                newPane = configGenerator.getPane(sensorGroupKey + "(DA)");
            }
            var sensorIdsArr = groupSensorIds[sensorGroupKey];
            for (var i = 0; i < sensorIdsArr.length; i++) {
                var sensorID = sensorIdsArr[i];// JSON object, sensorID
                addDatasourcesAndWidget(device, handlerName, sensorID, 'dataAnalyze', configGenerator);
            }
            addWidgetToPaneDA(newPane, sensorIdsArr, configGenerator);
        }
        if(countOfSensorGroupKey == 0){
            logger.warn('CANNOT find sensors from "groupSensorIds"');
        }
    };

    //generate ds name from sensor id
    var getDSNameFromSensorId = function (sensorID) {
        logger.info('getDSNameFromSensorId');
        return sensorID.bn + '/' + sensorID.name;
    };

    //add sensorID's widget into pane
    var addWidgetToPane = function (pane, sensorID, configGenerator) {
        //{
//                    name: 5V Standby,
//                    unit: V,
//                    type: v,
//                    asm: r,
//                    sensorID: /Hardware Monitor/Voltage/5V Standby,
//                    bn: /Hardware Monitor/Voltage
        //}
        //
        logger.debug('addWidgetToPane');
        logger.debug(sensorID);

        //get prev data sources
//        var ds = configGenerator.getDS(sensorID.sensorID);
        var ds = configGenerator.getDS(getDSNameFromSensorId(sensorID));

        logger.debug('get ds: ');
        logger.debug(ds);

        var newWidget = null;

        logger.debug('create an NEW widget: ' + sensorID.name);

        //create an new widget 
        newWidget = getWidgetValueType(sensorID);

        newWidget.settings.title = sensorID.name;
        newWidget.settings.value = getDatasourceSrc(ds);
        newWidget.settings.legend = sensorID.name;
        
        if ((g_agentID != "") && (sensorID.sensorID == "/Input Registers/Temperature"))
        {
            //newWidget.settings.value = 'return (' + newWidget.settings.value + '["result"]["itemList"]["0"]["v"] - 100)/2;';
            newWidget.settings.value = 'return (' + newWidget.settings.value + '["result"]["itemList"]["0"]["v"] - 100);';
        }
        if ((g_agentID != "") && (sensorID.sensorID == "/Input Registers/Humidity"))
        {
            //newWidget.settings.value = 'return (' + newWidget.settings.value + '["result"]["itemList"]["0"]["v"])/1.286;';
            newWidget.settings.value = 'return (' + newWidget.settings.value + '["result"]["itemList"]["0"]["v"]);';
        }
        
        if (sensorID.hasOwnProperty('unit')) {
            if(sensorID.unit !== null){
                newWidget.settings.units = sensorID.unit;
//                if (newWidget.settings.units == "ppm")
//                    newWidget.settings.max_value = 2000;
            }
        }
        
        configGenerator.addWidgetToPane(pane, newWidget);
        logger.debug('widget.settings.value: ' + newWidget.settings.value);
        //add widget to pane
    };

    var addWidgetToPaneDA = function (pane, sensorIdsArr, configGenerator) {
        var newWidget = null;
        //create an new widget 
        newWidget = {
            type: 'c3js',
            settings: {
                title: '',
                blocks: '4',
//                value1: 'datasources["CO2/CO2(DA)"]',
//                value2: 'datasources["CO2/Humidity(DA)"]',
//                value3: 'datasources["CO2/Temperature(DA)"]',
                value1: '',
                value2: '',
                value3: '',
                value4: '',
                value5: '',
                options: '{\n\"data": {\n\"type": "line"\n\}\n\}'
            }
        };

        var nIndex = 0;
        for (var i = 0; i < sensorIdsArr.length; i++) {
            var sensorID = sensorIdsArr[i];// JSON object, sensorID
            if (sensorID.type == "v")
            {
                var ds = configGenerator.getDS(getDSNameFromSensorId(sensorID));
                var strVaule = 'datasources[\"' + ds.name + '\(DA)"]';
                newWidget.settings["value" + (nIndex+1)] = strVaule;
                nIndex = nIndex + 1;
            }
        }
        configGenerator.addWidgetToPane(pane, newWidget);
    };

    //get widget tempate from value type
    var getWidgetValueType = function (sensor) {
        var widget_type = {};
        switch (sensor.type) {
            case 'v':
                widget_type = {
                    type: 'gauge',
                    settings: {
                        "show_minmax": true,
                        "blocks": 4,
                        "gauge_width": 50,
                        "value_fontcolor": "#d3d4d4",
                        "units": "",
                        "title": "",
                        "type": "half",
                        "animate": true,
                        "gauge_color": "#edebeb",
                        "min_value": 0,
                        "comma": false,
                        "gauge_upper_color": "#ff0000",
                        "decimal": 2,
                        "value": "",
                        "gauge_lower_color": "#a9d70b",
                        "metric_prefix": false,
                        "gauge_mid_color": "#f9c802",
                        "max_value": 100}
                };
                break;
//            case 'v':
//                widget_type = {
//                    type: 'text',
//                    settings: {
//                        title: '',
//                        value: '', //datasource
//                        size: 'regular',
//                        units: '',
//                        animate: true,
//                        comma: false,
//                        chart_color: '#ff9900',
//                        chart_type: 'line',
//                        decimal: 2,
//                        chart: true,
//                        metric_prefix: false,
//                        chart_minmax_color: '#0496ff',
//                        height: 2
//                    }
//                };
//                break;
            case 'sv':
                widget_type = {
                    type: 'text',
                    settings: {
                        title: '',
                        value: '', //datasource
                        size: 'regular',
                        units: '',
                        animate: false,
                        comma: false,
                        chart_color: '#ff9900',
                        chart_type: 'line',
                        decimal: 10,
                        chart: false,
                        metric_prefix: false,
                        chart_minmax_color: '#0496ff',
                        height: 2
                    }
                };
                break;
            case 'bv':
                if (sensor.asm == "rw")
                    widget_type = {
                        type: 'OnOff',
                        settings: {
                            title: '',
                            value: ''//datasource
                        }
                    };
                else
                    widget_type = {
                        type: 'indicator',
                        settings: {
                            title: '',
                            value: ''//datasource
                        }
                    };
                break;
            default:
                widget_type = {
                    type: 'text',
                    settings: {
                        title: '',
                        value: '', //datasource
                        size: 'regular'
                    }
                };
                break;
        }
        return widget_type;
    };

    //get data source query 
    var getDatasourceSrc = function (ds) {
        logger.debug('getDatasourcesSrc: ' + ds.name);
        return 'datasources[\"' + ds.name + '\"]';
    };

    //
    // callback
    //
    var triggerCallback = function (callback, config, error_msg) {
        logger.info('triggerCallback');
        $(document).clearQueue();
        if (typeof (callback) === 'function') {
            logger.error(error_msg);
            callback(config, error_msg);
        } else {
            alert('CANNOT trigger callback');
        }

        groupSensorIds = {};//reset group
    };

    var getDeviceSensorIds = function (configGenerator, device, handlerName, filters, callback) {
        logger.info('getDeviceSensorIds');
        var alldevices = [];//query device and sensor hub devices
        device.handler = handlerName;
        alldevices.push(device);
        if (device.agentType.indexOf('IoTGW')>=0) {
            //need to get SenHub devices
            if (device.hasOwnProperty('IoTGW')) {

                if (device.IoTGW != null) {
                    if (!device.IoTGW.hasOwnProperty('interface')) {
                        logger.error('Cannot find interface property from IoTGW');
                    } else {
                        logger.debug('find interface');
                        var sensorHub = device.IoTGW.interface.sensorHub;
                        for (var i = 0; i < device.IoTGW.interface.length; i++) {
                            if (device.IoTGW.interface[i].hasOwnProperty('sensorHub'))
                            {
                                sensorHub = device.IoTGW.interface[i].sensorHub;
                                break;
                            }
                        }
                        if ($.isArray(sensorHub)) {
                            for (var i = 0; i < sensorHub.length; i++) {
                                var tmpSensorHub = sensorHub[i];

                                tmpSensorHub.handler = 'SenHub';
                                tmpSensorHub.parentAgentId = device.agentId;
                                tmpSensorHub.accountid = device.accountid;
                                alldevices.push(tmpSensorHub);
                            }
                        } else {
                            sensorHub.handler = 'SenHub';
                            alldevices.push(sensorHub);
                        }
                    }
                } else {
                    logger.error('IoTGW property is null');
                }
            } else {
                logger.error('CANNOT find IoTGW property');
            }
        };

        logger.debug('Scan Devices as below');
        if (alldevices.length == 0)
        {
            device.handler = handlerName;
            alldevices.push(device);
        }
        logger.debug(alldevices);
        var indexOfDevice = 0;
        var countOfDevice = alldevices.length;
        var queueCount = 0;
        for (indexOfDevice = 0; indexOfDevice < countOfDevice; indexOfDevice++) {
            $document.queue(function (next) { //內建傳入 next 方便作dequeue  
                logger.debug('start queue: ' + queueCount);
                var tmpDevice = alldevices[queueCount];
                var device = tmpDevice;
                getSensorID(
                    tmpDevice.agentId,
                    tmpDevice.handler,
                    function (data) {
                        var itemList = [];
                        if (data.result.hasOwnProperty('ErrorCode')) {
                            triggerCallback(callback, configGenerator.create(), data.result.Description);
                        } else {
                            if (data.result.itemList.hasOwnProperty('item')) {
                                //avoid single result
                                if (!$.isArray(data.result.itemList.item)) {
                                    itemList = [data.result.itemList.item];
                                } else {
                                    itemList = data.result.itemList.item;
                                }
                                //fitler items from filters
                                var filterItemList = [];
                                var countOfFilterSensorId = itemList.length;
                                for (var i = 0; i < countOfFilterSensorId; i++) {
                                    var currSensorId = itemList[i];
                                    var inFilter = 0;

                                    inFilter = filters.indexOf(getFLP);
                                    var getFLP = getFirstLevelOfPath(currSensorId.sensorID);
                                    inFilter = filters.indexOf(getFLP);

                                    if (inFilter >= 0) {
                                        filterItemList.push(currSensorId);
                                    }
                                }
                                //replace old itemList
                                itemList = filterItemList;

                                //do sort
                                itemList = sortResults(itemList, 'sensorID',true);

                                var nItem = 0;
                                for (var i = 0; i < itemList.length; i++) {
                                    var currSensorId = itemList[i];
                                    var inFilter = 0;
                                    var getFLP = getFirstLevelOfPath(currSensorId.sensorID);
                                    inFilter = filters.indexOf(getFLP);
                                    if (inFilter >= 0) {
                                        var oriBn = getBNOfPath(currSensorId.sensorID);
                                        //extend bn and bn's name
                                        bn = oriBn.replace(filters[inFilter], device.name);
                                        bn = bn.substring(1, bn.length);
                                        if (typeof (groupSensorIds[bn]) === 'undefined') {
                                            groupSensorIds[bn] = [];//create group array
                                        }
                                        currSensorId.bn = bn; // for pane title
                                        currSensorId.name = currSensorId.sensorID.replace(oriBn + '/', '');
                                        groupSensorIds[bn].push(currSensorId);
                                        nItem = nItem + 1;
                                        if (nItem >= LIMIT_DATA_SOURCES)
                                            break;
                                    }
                                }
                                appendDatasourcesAndPanes(device, device.handler, groupSensorIds, configGenerator);
                                if (queueCount < countOfDevice - 1) {
                                    queueCount++;
                                    next();//do next queue
                                } else {
                                    triggerCallback(callback, configGenerator.create());
                                }
                            } else {
                                logger.error('CANNOT find itemList property from getSensorId');
                                if (queueCount < countOfDevice - 1) {
                                    queueCount++;
                                    next();//do next queue
                                } else {
                                    triggerCallback(callback, configGenerator.create());
                                }
                            }
                        }
                    }, 
                    function () {
                        if (queueCount < countOfDevice - 1) {
                            queueCount++;
                            next();//do next queue
                        } else {
                            triggerCallback(callback, configGenerator.create(), 'fail to get sensor Ids');
                        }
                    }
                );
            });//end of sensorId Queue
        }//end of alldevices
    };

    /*
     * 
     * @param {JSON Object} device info
     * @param {String} Handler Name
     * @param {Array} filters
     * @returns {String}
     * 
     */
    self.create = function (device, handlerName, filters, callback) {
        logger.info('create');
        logger.debug('handler name: ' + handlerName);
        logger.debug(filters);
        var config = '';

        var configGenerator = new ConfigGenerator();

        getDeviceSensorIds(configGenerator, device, handlerName, filters, callback);

    };

    window.Device2ContentPackGenerator = self;
    return self;

})(log4jq);

function testDeviceHardwareStatusContentPackGenerator() {
    var device = {
        "did": 6,
        "agentId": "0000000BAB3C6E78",
        "name": "xpe01",
        "status": "Connected",
        "ip": "172.22.12.218",
        "serial": "0000000BAB3C6E78",
        "accountid": 2,
        "accountname": "admin",
        "mapid": 1,
        "upgrade": false,
        "hwState": "Normal",
        "hddState": "Normal",
        "netState": "Normal",
        "swState": "Normal",
        "groupid": 1,
        "groupname": "unassign",
        "description": null,
        "osversion": "Windows XP Service Pack 3 X86",
        "biosversion": "V1.11",
        "agentversion": "3.1.15.2820",
        "latestagentversion": "3.1.0",
        "icon": "default",
        "lock": "None",
        "cpuname": "Intel(R) Core(TM)2 Duo CPU     E7400  @ 2.80GHz",
        "platformname": "AIMB-267-KIOSK",
        "memsize": 2061484,
        "autoReport": null,
        "reportInterval": 0,
        "handlerList": {
            "handler": [{
                    "handlerName": "HDDMonitor",
                    "aliasName": "HDDMonitor"
                }, {
                    "handlerName": "NetMonitor",
                    "aliasName": "NetMonitor"
                }, {
                    "handlerName": "ProcessMonitor",
                    "aliasName": "ProcessMonitor"
                }, {
                    "handlerName": "SUSIControl",
                    "aliasName": "SUSIControl"
                }]
        },
        "agentType": "IPC",
        "ts": "2015-11-09 14:28:50.854",
        "powertime": null,
        "mac": "00:0B:AB:3C:6E:78;00:0B:AB:3C:6E:77",
        "amtsupport": false,
        "KVMmode": "default",
        "custPort": 5900,
        "custPassword": null,
        "kvmFunction": "default,repeater",
        "terminalFunction": "internal",
        "protectInstall": true,
        "recoveryInstall": true
    };

    var config = Device2ContentPackGenerator.create(device, 'SUSIControl', ['Hardware Monitor']);
}

