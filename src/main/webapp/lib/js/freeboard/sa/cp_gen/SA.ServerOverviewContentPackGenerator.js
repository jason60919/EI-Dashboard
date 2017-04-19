/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


if (typeof (ContentPackGenerator) !== 'undefined') {
    ContentPackGenerator.register('serverOverview', 'ServerOverviewContentPackGenerator');
}

var ServerOverviewContentPackGenerator = (function (log4jq) {

    var self = {};
    self.name = 'SA.ServerOverviewContentPackGenerator.js';
    var logger = log4jq.getLogger({
        loggerName: self.name
    });

    var appendServerStatusPane = function (configGenerator) {
        logger.info('appendServerStatusPane');
        //
        //create server status
        //
        var serverStatusDS = configGenerator.getDatasourceTemplate();
//        console.log(serverStatusDS);
        serverStatusDS.name = 'Server Status';
        serverStatusDS.type = 'SrvStatus';
        serverStatusDS.settings = {
            'password': decryption($.cookie('selectedTabPagepassword')),
            'serverurl':  REST.getEndpoint(),
                    //'http://localhost:8080/',
            'refresh': 5,
            'account':decryption($.cookie('selectedTabPageaccount'))
        };
        configGenerator.addDS(serverStatusDS);

        //
        // pane
        //
        var serverStatusPane = configGenerator.getPaneTemplate();
        serverStatusPane.title = 'Server Status';
//        console.log(serverStatusPane);

        //
        //progress bar
        //
        var basedDS = 'datasources[\"' + serverStatusDS.name + '\"]';
        var cpuProgressbar = configGenerator.getWidgetTemplate();

        cpuProgressbar.type = 'progressbar';
        cpuProgressbar.settings.title = 'CPU';
        cpuProgressbar.settings.value = basedDS + '[\"result\"][\"cpu\"][\"cpuLoading\"]';
        serverStatusPane.widgets.push(cpuProgressbar);

        var memProgressbar = configGenerator.getWidgetTemplate();

        memProgressbar.type = 'progressbar';
        memProgressbar.settings.title = 'MEMORY';
        memProgressbar.settings.value = 'var mem = ' + basedDS + '[\"result\"][\"memory\"][\"usage\"];\n mem = mem.toFixed(2)*100; \n return mem;';
        serverStatusPane.widgets.push(memProgressbar);

        var hddProgressbar = configGenerator.getWidgetTemplate();

        hddProgressbar.type = 'progressbar';
        hddProgressbar.settings.title = 'HDD';
        var strHDDValue = "";
        strHDDValue = strHDDValue + 'var serverHDD;\n';
        strHDDValue = strHDDValue + 'var hardisk = ' + basedDS + '[\"result\"][\"hardisk\"][\"item\"];\n';
        strHDDValue = strHDDValue + 'if ($.isArray(hardisk)){\n';
        strHDDValue = strHDDValue + '    for(var i=0;i<hardisk.length;i++){\n';
        strHDDValue = strHDDValue + '        var tmpHDD = hardisk[i];\n';
        strHDDValue = strHDDValue + '        if(tmpHDD.isSrvInstall){\n';
        strHDDValue = strHDDValue + '            serverHDD = tmpHDD;\n';
        strHDDValue = strHDDValue + '        }\n';
        strHDDValue = strHDDValue + '    }\n';
        strHDDValue = strHDDValue + '}\n';
        strHDDValue = strHDDValue + 'else{\n';
        strHDDValue = strHDDValue + 'serverHDD = hardisk;\n';
        strHDDValue = strHDDValue + '}\n';
        strHDDValue = strHDDValue + 'return serverHDD.usage.toFixed(2)*100;';
        //hddProgressbar.settings.value = 'var serverHDD;\nvar hardisk = ' + basedDS + '[\"result\"][\"hardisk\"][\"item\"];\nif ($.isArray(hardisk)){\n     for(var i=0;i<hardisk.length;i++){ \n var tmpHDD = hardisk[i]; \n if(tmpHDD.isSrvInstall){ \n serverHDD = tmpHDD;\n }\n} \n }\n else {\n serverHDD =  hardisk;\n }\n return serverHDD.usage.toFixed(2)*100;';
        hddProgressbar.settings.value = strHDDValue;

        serverStatusPane.widgets.push(hddProgressbar);
        configGenerator.addPane(serverStatusPane);

        //
        //cpu use Text Widget
        //
        var serverStatusONLYCPUPane = configGenerator.getPaneTemplate();
        serverStatusONLYCPUPane.title = 'Server Status: CPU';
        var cpuText = configGenerator.getWidgetTemplate();
        cpuText.type = 'text';
        cpuText.settings = {
            size: 'regular',
            value: basedDS + '[\"result\"][\"cpu\"][\"cpuLoading\"]',
            decimal: 0,
            comma: false,
            metric_prefix: false,
            units: '%',
            animate: true,
            chart: true,
            chart_type: 'line',
            chart_color: '#ff9900',
            chart_minmax_color: '#0496ff',
            height: 3
        };
        serverStatusONLYCPUPane.widgets.push(cpuText);
        configGenerator.addPane(serverStatusONLYCPUPane);


        var serverStatusONLYMEMPane = configGenerator.getPaneTemplate();
        serverStatusONLYMEMPane.title = 'Server Status: Mem';
        var memText = configGenerator.getWidgetTemplate();
        memText.type = 'text';
        memText.settings = {
            size: 'regular',
            value: 'var mem = ' + basedDS + '[\"result\"][\"memory\"][\"usage\"];\n mem = mem.toFixed(2)*100; \n return mem;',
            decimal: 0,
            comma: false,
            metric_prefix: false,
            units: '%',
            animate: true,
            chart: true,
            chart_type: 'line',
            chart_color: '#ff9900',
            chart_minmax_color: '#0496ff',
            height: 3
        };
        serverStatusONLYMEMPane.widgets.push(memText);
        configGenerator.addPane(serverStatusONLYMEMPane);


    };

    var appendDeviceMapPane = function (configGenerator) {
        //
        //create device map
        //
        var deviceMapDS = configGenerator.getDatasourceTemplate();
        deviceMapDS.name = 'Device Map';
        deviceMapDS.type = 'FuzzySearch';
        deviceMapDS.settings = {
            refresh: 5,
            user: null
        };
        
          REST.send({
            url: '/DeviceGroupMgmt/getGroupAndAccount',
            method: 'GET',
            data: '',
            async: false
        }, function (data) {
            logger.debug('success to get group and group data');
            
            var convAccountAndRoleArr = [];
            if(!$.isArray(data.result.Account)){
                convAccountAndRoleArr = [data.result.Account];
            }else{
                convAccountAndRoleArr = data.result.Account;
            }
            deviceMapDS.settings.user = convAccountAndRoleArr[0].accountid;
            
             configGenerator.addDS(deviceMapDS);
        }, function () {
            logger.debug('fail to get group and group data');
            
        });

        //
        // google map multiple 
        //
        var baseDS =  'datasources[\"' + deviceMapDS.name + '\"]';
        var deviceMapPane = configGenerator.getPaneTemplate();
        deviceMapPane.title = 'Device Map';
        deviceMapPane.col_width = 3;
        var multiGoogleMap = configGenerator.getWidgetTemplate();
        multiGoogleMap.type = 'multiGoogleMap';
        multiGoogleMap.settings = {
            locations: baseDS,
            zoom: 12,
            blocks: 4
        };
        deviceMapPane.widgets.push(multiGoogleMap);
        configGenerator.addPane(deviceMapPane);
    };

    //data is null in the Server Overview
    self.create = function (data,callback) {
        logger.info('create');

        var config = '';

        var configGenerator = new ConfigGenerator();

        appendServerStatusPane(configGenerator);
        appendDeviceMapPane(configGenerator);

        config = configGenerator.create();
        if(typeof(callback === 'function')){
            callback(config);
        }
//        return config;
    };


    return self;

})(log4jq);
