/* 
 * SA3 Service is REST SDK 
 * @date 20141219
 *  @requires 
 *  js/libs/log4javascript/log4javascript.min.js
 *  js/sa/utils/log4jq.js
 *  js/libs/utils/aes.js
 *  js/libs/utils/pad-zeropadding
 */

//;(function($){

//SA3 REST Service
function Service(options) {

    var sa3 = this;

    sa3.authorization = '';//base auth

    sa3.xmlRoot = '<request></request>';

    sa3.options = $.extend({}, sa3.defaults, options);
    sa3.applicationType = sa3.options.applicationType;
    //    sa3.dataType = sa3.options.dataType;

    //api endpoint
    sa3.endpoint = sa3.options.host + sa3.options.rest;
    
    sa3.currRequest = null;
    
    sa3.logger = log4jq.getLogger({
        loggerName: 'service.js'
    });

    sa3.init();

    return sa3;

}
;

Service.prototype.version = '0.1';

Service.prototype.defaults = {
    host: '',
    rest: '/webresources',
    applicationType: 'application/xml',
    acceptType: 'application/xml',
    //    dataType: 'xml',
    async: true,
    timeout: 60 * 1000//1 min
};

Service.prototype.init = function () {
    var sa3 = this;

    sa3.logger.info('init');
    var user = $.cookie('selectedTabPageaccount');
    if (user == null) {
        user = $.cookie('mobileloginName');
    }
    var password = $.cookie('selectedTabPageaccount');
    if (password == null) {
        password = $.cookie('mobileloginPassword');
    }
    if (((user != '') && (user != null)) || ((password != '') && (password != null))) {
        sa3.setAuthorization(user, password);
    } else {
        //alert('cannot detect authorization');
        sa3.logger.error('cannot detect authorization');
    }

};

Service.prototype.setApplicationType = function (applicationType) {
    var sa3 = this;
    sa3.logger.info('call setApplicationType func: ' + applicationType);
    sa3.applicationType = applicationType;
};

Service.prototype.setAcceptType = function (acceptType) {
    var sa3 = this;
    sa3.logger.info('call setAcceptType func: ' + acceptType);
    sa3.acceptType = acceptType;
};

Service.prototype.getCurrRequest = function(){
    var sa3 = this;
    sa3.logger.info('call getCurrRequest func:');
    return sa3.currRequest;
};

//
// Auth
//
Service.prototype.login = function (account, password, success, error) {

    var sa3 = this;

    sa3.logger.debug('call login api');

    var endpoint = sa3.endpoint + '/AccountMgmt/login';

    //create a root
    var xmlDoc = $.parseXML(sa3.xmlRoot);

    //login body
    var itemNodeContent = '<item name="username" value="' + account + '"></item>';
    var itemNode = $.parseXML(itemNodeContent);
    $(xmlDoc).children(0).append($(itemNode).children(0));

    itemNodeContent = '<item name="password" value="' + password + '"></item>';
    itemNode = $.parseXML(itemNodeContent);
    $(xmlDoc).children(0).append($(itemNode).children(0));

    sa3.request(
            endpoint,
            'post',
            xmlDoc,
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.setAuthorization = function (authorizedKey) {
    var sa3 = this;
    sa3.authorization = 'Basic ' + authorizedKey;
};

Service.prototype.setAuthorization = function (account, password) {
    var sa3 = this;    
    sa3.authorization = 'Basic ' + $.base64.encode(sa3.decryption(account) + ':' + sa3.decryption(password));
    sa3.logger.debug('authoriztion: ' + sa3.authorization);

};

//
// Server Mgnt.
//
Service.prototype.srvStatus = function (success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/ServerMgmt/getWebSrvStatus';
    sa3.logger.info('call srvStatus api: ' + endpoint);

    sa3.request(
            endpoint,
            'get',
            '',
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

//
// Dashboard Mgnt.
//
Service.prototype.createWidget = function (
        type,
        title,
        description,
        query,
        row,
        col,
        size_x,
        size_y,
        interval,
        enable,
        success, error) {
    var sa3 = this;

    sa3.logger.debug('call createWidget api');

    var endpoint = sa3.endpoint + '/WidgetMgmt/Create';
    var jBody = JSON.stringify({request: {
            type: type,
            title: title,
            description: description,
            query: query,
            row: row,
            col: col,
            size_x: size_x,
            size_y: size_y,
            interval: interval,
            enable: enable
        }

    });

    sa3.request(
            endpoint,
            'post',
            jBody,
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.gettokenId = function (tokenId, success, error) {
    var sa3 = this;
    sa3.logger.info('call ActivateAccount api');

    var endpoint = sa3.endpoint + '/AccountMgmt/activateAccount';
    var jBody = {
        request: {account:
                    [{"token": tokenId
                        }
                    ]}};

    sa3.logger.info(jBody);

    sa3.request(
            endpoint,
            'POST',
            JSON.stringify(jBody),
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.addUserAccount = function (name, password, description, email1, email2, phone, localUrl, lan, success, error) {
    var sa3 = this;
    sa3.logger.info('call addUserAccount api');

    var endpoint = sa3.endpoint + '/AccountMgmt/registerAccount';
    var jBody = {
        request: {account: {item:
                        [{"@name": "username",
                                "@value": name
                            },
                            {"@name": "password",
                                "@value": password
                            },
                            {"@name": "desc",
                                "@value": description
                            },
                            {"@name": "email1",
                                "@value": email1
                            },
                            {"@name": "email2",
                                "@value": email2
                            },
                            {"@name": "phone",
                                "@value": phone
                            },
                            {"@name": "serverip",
                                "@value": localUrl
                            },
                            {"@name": "lang",
                                "@value": lan
                            }
                        ]}}};

    sa3.logger.info(jBody);

    sa3.request(
            endpoint,
            'POST',
            JSON.stringify(jBody),
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.updateWidgetText = function (wid, title, description, success, error) {
    var sa3 = this;
    sa3.logger.info('call updateWidgetLayout');

    var endpoint = sa3.endpoint + '/WidgetMgmt/UpdateText/' + wid;
    var inputBody = {
        request: {
            title: title,
            description: description
        }
    };
    sa3.request(
            endpoint,
            'put',
            JSON.stringify(inputBody),
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });

};

Service.prototype.updateWidgetLayout = function (widgets, success, error) {
    var sa3 = this;
    sa3.logger.info('call updateWidgetLayout');

    var endpoint = sa3.endpoint + '/WidgetMgmt/UpdateLayout';
    var inputBody = {
        request: {
            widgets: widgets}
    };
    sa3.request(
            endpoint,
            'put',
            JSON.stringify(inputBody),
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });

};

Service.prototype.delWidget = function (wid, success, error) {
    var sa3 = this;

    sa3.logger.debug('call delWidget api');

    var endpoint = sa3.endpoint + '/WidgetMgmt/Delete/' + wid;
    sa3.request(
            endpoint,
            'delete',
            '',
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.listWidget = function (success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/WidgetMgmt/GetList';
    sa3.logger.info('call listWidget api: ' + endpoint);

    sa3.request(
            endpoint,
            'get',
            '',
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.listWidgetWithEnable = function (success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/WidgetMgmt/GetListWithEnable';
    sa3.logger.info('call listWidget api: ' + endpoint);

    sa3.request(
            endpoint,
            'get',
            '',
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.enableWidget = function (widget_id, success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/WidgetMgmt/Enable/' + widget_id;
    sa3.logger.info('call enableWidget api: ' + endpoint);

    sa3.request(
            endpoint,
            'put',
            '',
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.disableWidget = function (widget_id, success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/WidgetMgmt/Disable/' + widget_id;
    sa3.logger.info('call disableWidget api: ' + endpoint);

    sa3.request(
            endpoint,
            'put',
            '',
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.updateWidgetTheme = function (widget_id, theme, success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/WidgetMgmt/UpdateTheme/' + widget_id;
    sa3.logger.info('call disableWidget api: ' + endpoint);
    var jBody = JSON.stringify(
            {request: {
                    theme: theme
                }

            });
    sa3.request(
            endpoint,
            'put',
            jBody,
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.getGroupAndAccount = function (success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/DeviceGroupMgmt/getGroupAndAccount';
    sa3.logger.info('call getGroupAndAccount api: ' + endpoint);

    sa3.request(
            endpoint,
            'get',
            '',
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};


//
// Device Info Mgnt.
//
Service.prototype.getInfoSpec = function (agent_id_Or_sensor_node_id, success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/DeviceMgmt/getSensorInfo/' + agent_id_Or_sensor_node_id;
    sa3.logger.info('call getInfoSpec api: ' + endpoint);

    sa3.request(
            endpoint,
            'get',
            '',
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};


/*Analytics APIs*/
Service.prototype.accEventData = function (agent_id_Or_sensor_node_id, handler, sensorId, severity,
        beginTs,
        endTs,
        success,
        error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/EventMgmt/getAccEventData';
    sa3.logger.info('call accEventData api: ' + endpoint);

    var jBody = JSON.stringify({
        request: {
            beginTs: beginTs,
            endTs: endTs,
            item: {
                agentId: agent_id_Or_sensor_node_id,
                handler: handler,
                sensorId: sensorId,
                severity: severity
            }
        }
    });

    sa3.request(
            endpoint,
            'post',
            jBody,
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.list = function (
        agent_id_Or_sensor_node_id,
        handler,
        idArr,
        sortBy,
        order,
        pIndex,
        pSize,
        beginTs,
        endTs,
        success,
        error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/DeviceCtl/qrySeneorData';
    sa3.logger.info('call list api: ' + endpoint);
    /*
     
     */
    var jBody = JSON.stringify({
        request: {
            agentId: agent_id_Or_sensor_node_id,
            handler: handler,
            sensorId: idArr,
            sortBy: sortBy,
            order: order,
            pIndex: pIndex,
            pSize: pSize,
            beginTs: beginTs,
            endTs: endTs
        }
    });

    sa3.request(
            endpoint,
            'post',
            jBody,
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.max = function (
        agent_id_Or_sensor_node_id,
        handler,
        idArr,
        sortBy,
        order,
        pIndex,
        pSize,
        beginTs,
        endTs,
        success,
        error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/DeviceCtl/getMaxHistData';
    sa3.logger.info('call max api: ' + endpoint);


    var jBody = JSON.stringify(
            {request:
                        {
                            beginTs: beginTs,
                            endTs: endTs,
                            item: {
                                "agentId": agent_id_Or_sensor_node_id,
                                "handler": handler,
                                "sensorId": idArr
                            }
                        }});

    sa3.request(
            endpoint,
            'post',
            jBody,
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.min = function (
        agent_id_Or_sensor_node_id,
        handler,
        idArr,
        sortBy,
        order,
        pIndex,
        pSize,
        beginTs,
        endTs,
        success,
        error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/DeviceCtl/getMinHistData';
    sa3.logger.info('call min api: ' + endpoint);

    var jBody = JSON.stringify(
            {request:
                        {
                            beginTs: beginTs,
                            endTs: endTs,
                            item: {
                                agentId: agent_id_Or_sensor_node_id,
                                handler: handler,
                                sensorId: idArr
                            }
                        }});

    sa3.request(
            endpoint,
            'post',
            jBody,
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.avg = function (
        agent_id_Or_sensor_node_id,
        handler,
        idArr,
        sortBy,
        order,
        pIndex,
        pSize,
        beginTs,
        endTs,
        success,
        error) {

    var sa3 = this;
    var endpoint = sa3.endpoint + '/DeviceCtl/getAvgHistData';
    sa3.logger.info('call avg api: ' + endpoint);

    var jBody = JSON.stringify(
            {request:
                        {
                            beginTs: beginTs,
                            endTs: endTs,
                            item: {
                                agentId: agent_id_Or_sensor_node_id,
                                handler: handler,
                                sensorId: idArr
                            }
                        }});


    sa3.request(
            endpoint,
            'post',
            jBody,
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.getSensorID = function (agent_id_Or_sensor_node_id, handler, success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/DeviceCtl/getSensorID';
    sa3.logger.info('call getSensorID api: ' + endpoint);

    var jBody = JSON.stringify({
        request: {
            agentId: agent_id_Or_sensor_node_id,
            handler: handler
        }
    });

    sa3.request(
            endpoint,
            'post',
            jBody,
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.getDeviceData = function (agent_id_Or_sensor_node_id, handler, idArr, success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/DeviceCtl/getDeviceData';
    sa3.logger.info('call getLatestRecords api: ' + endpoint);

    var inputJson =
            {
                request: {
                    agentId: agent_id_Or_sensor_node_id,
                    handler: handler
//            sensorId: idArr
                }
            };
            
         
    if (typeof (idArr) != 'undefinend' && idArr != '' && idArr != null) {
        inputJson.request.sensorId = idArr;
    }

    var jBody = JSON.stringify(inputJson);

    sa3.request(
            endpoint,
            'post',
            jBody,
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.getDeviceDataRT = function (agent_id_Or_sensor_node_id, handler, idArr, success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/DeviceCtl/getDeviceDataRT';
    sa3.logger.info('call getDeviceDataRT api: ' + endpoint);

    var inputJson =
            {
                
                request: {
                    item:{
                    agentId: agent_id_Or_sensor_node_id,
                    handler: handler
//            sensorId: idArr
                    }
                }
            };
            
         
    if (typeof (idArr) != 'undefinend' && idArr != '' && idArr != null) {
        inputJson.request.item.sensorId = idArr;
    }

    var jBody = JSON.stringify(inputJson);

    sa3.request(
            endpoint,
            'post',
            jBody,
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.setDeviceData = function (agent_id_Or_sensor_node_id, handler, sensorId, success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/DeviceCtl/setDeviceData';
    sa3.logger.info('call  setDeviceData api: ' + endpoint);

    var jBody = JSON.stringify({
        request: {
            item: {
                agentId: agent_id_Or_sensor_node_id,
                handler: handler,
                sensorId: sensorId
            }
        }
    });

    sa3.request(
            endpoint,
            'post',
            jBody,
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.getHandlerData = function (agent_id_Or_sensor_node_id, handler, success, error) {
    var sa3 = this;

    var endpoint = sa3.endpoint;
    switch (handler) {
        //HW
        case 'SUSIControl':
            endpoint += '/HWMonitorMgmt/getHWData/' + agent_id_Or_sensor_node_id;
            break;
        case 'HDDMonitor':
            endpoint += '/HWMonitorMgmt/getHDDData/' + agent_id_Or_sensor_node_id;
            break;
        case 'NetMonitor':
            endpoint += '/HWMonitorMgmt/getNetworkData/' + agent_id_Or_sensor_node_id;
            break;
            //SW
        case 'ProcessMonitor':
            endpoint += '/SWMonitorMgmt/getSWData/' + agent_id_Or_sensor_node_id;
            break;
    }

    sa3.logger.info('call getHandlerData api: ' + endpoint);

    sa3.request(
            endpoint,
            'get',
            '',
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.getRequestData = function (path, agent_id_Or_sensor_node_id, success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + path;
    sa3.logger.info('call getRequestData api: ' + endpoint);
    /*
     {
     agentID:"0000000BAB578432",
     handler: "HWM",
     id: ["/Hardware Monitor/Temperature/CPU","/Hardware Monitor/Temperature/CPU 2","/Hardware Monitor/Temperature/Chipset","/Hardware Monitor/Voltage/Voltage"],
     }*/
    var jBody = JSON.stringify({
        request: {
            agentId: agent_id_Or_sensor_node_id
        }
    });
    
    if(typeof(IE) != 'undefiend'){
        jBody = encodeURI(jBody);
    }

    sa3.request(
            endpoint,
            'get',
            jBody,
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.startRegularReport = function (agent_id, intervalTime, oHandlers , success, error) {

    var sa3 = this;
    var endpoint = sa3.endpoint + '/DeviceCtl/startRegularReport';
    sa3.logger.info('call startRegularReport');

    var inputBody = {
        request: {
            agentId: agent_id,
            intervalTime: intervalTime
        }
    };

    if (oHandlers != null)
        inputBody.request.requestItem = oHandlers;
    
    sa3.request(
            endpoint,
            'post',
            JSON.stringify(inputBody),
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.stopRegularReport = function (agent_id, success, error) {

    var sa3 = this;
    var endpoint = sa3.endpoint + '/DeviceCtl/stopRegularReport';
    sa3.logger.info('call stopRegularReport');
    var inputBody = {
        request: {
            agentId: agent_id
        }
    };
    sa3.request(
            endpoint,
            'post',
            JSON.stringify(inputBody),
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.getRegularReportParams = function (agent_id, success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/DeviceCtl/getRegularReportParams/' + agent_id;
    sa3.logger.info('call getRegularReportParams');
    sa3.request(
            endpoint,
            'get',
            '',
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};

Service.prototype.startRegularReportRT = function (agent_id, intervalTime, timeout, handlerName, success, error) {
    var sa3 = this;
    var endpoint = sa3.endpoint + '/DeviceCtl/startRegularReportRT';
    sa3.logger.info('call startRegularReportRT');

    var jBody = JSON.stringify(
            {request:
                {
                    agentid: agent_id,
                    intervalTime: intervalTime,
                    timeout: timeout,
                    handlerName: handlerName
                }});
    if (handlerName == "ProcessMonitor")
    {
        jBody = JSON.stringify(
            {request:
                {
                    agentid: agent_id,
                    intervalTime: intervalTime,
                    timeout: timeout,
                    handlerName: handlerName,
                    requestItem: {
                                e: [
                                    {
                                        n: "ProcessMonitor/System Monitor Info"
                                    },
                                    {
                                        n: "ProcessMonitor/Process Monitor Info"
                                    }
                                ]
                            },
                }});
    }
    sa3.request(
            endpoint,
            'post',
            jBody,
            function (response, textStatus, xhr) {
                //suc
                sa3.logger.debug(response);
                success(response, textStatus, xhr);
            },
            function (xhr, textStatus, errorThrown) {
                //err
                sa3.logger.debug(errorThrown);
                error(xhr, textStatus, errorThrown);
            });
};
//
//
// Utiity
//

Service.prototype.decryption = function (data) {
    var key = CryptoJS.enc.Latin1.parse('TYScottSephiroth');
    var iv = CryptoJS.enc.Latin1.parse('TYScottSephiroth');
    var decrypted;
    try
    {
        decrypted = CryptoJS.AES.decrypt(data, key, {
            iv: iv,
            padding: CryptoJS.pad.ZeroPadding
        });
        return decrypted.toString(CryptoJS.enc.Utf8).replace(/^\s+|\s+$/g, '');
    }
    catch (e)
    {
        return '';
    }
};

Service.prototype.xml2String = function (xmlData) {
    var sa3 = this;
    sa3.logger.info('call xml2String func');
    var xmlString;
    //IE
    if (window.ActiveXObject)
    {
        xmlString = xmlData.xml;
        //xmlString = xmlData.xml ? xmlData.xml : (new XMLSerializer()).serializeToString(xmlData);
    }
    else
    {
        xmlString = (new XMLSerializer()).serializeToString(xmlData);
    }
    return xmlString;
};

Service.prototype.isString = function (str) {
    return ((typeof str == 'string') && (str.constructor == String));
};

Service.prototype.string2Xml = function (xmlString) {

    var sa3 = this;

    sa3.logger.info('call string2Xml func: ' + xmlString);

    if (!isString(xmlString))
        return xmlString;
    if (window.ActiveXObject) {
        var doc = new ActiveXObject('Microsoft.XMLDOM');
        doc.async = 'false';
        doc.loadXML(xmlString);
    } else {
        var parser = new DOMParser();
        var doc = parser.parseFromString(xmlString, 'text/xml');
    }
    return doc;
};

Service.prototype.request = function (endpoint, httpMethod, postBody, success_callback, error_callback) {

    var sa3 = this;
    var opts = sa3.options;
    
    
    sa3.logger.info('call request func');

    var ajaxOpts = {
        cache: false,
        type: httpMethod,
        url: endpoint,
        async: opts.async,
        timeout: opts.timeout,
        error: function (jqXHR, textStatus, errorThrown) {
            sa3.logger.error('error thrown: ' + errorThrown);
            sa3.logger.error('error status: ' + textStatus);
            sa3.logger.error('error response: ' + jqXHR.responseText);
            if ((error_callback != 'undefined') && (typeof (error_callback) === 'function')) {
                error_callback(jqXHR, textStatus, errorThrown);
            } else {
                sa3.logger.warn('err callback not found');
            }

        },
        beforeSend: function (xhr) {
            //            sa3.logger.debug('before send: ' + sa3.authorization);
            xhr.setRequestHeader('Authorization', sa3.authorization);
            xhr.setRequestHeader('Accept', sa3.acceptType);

        },
        success: function (response, textStatus, xhr) {
            sa3.logger.debug('response as below: ');
            sa3.logger.debug(response);

            if (success_callback != 'undefined' && typeof (success_callback) === 'function') {
                success_callback(response, textStatus, xhr);
            } else {
                sa3.logger.warn('suc callback not found');
            }
        }
    };

    if (sa3.applicationType == 'application/xml') {

        //old REST for xml
        if (postBody != '') {

            //append authorization element into request of root
            $(postBody).find('request').attr('Authorization', sa3.authorization);
            var postBodyStr = sa3.xml2String(postBody);

            ajaxOpts.data = postBodyStr;
            sa3.logger.debug('post body: ' + ajaxOpts.data);
        }
        ajaxOpts.contentType = sa3.applicationType;
        ajaxOpts.dataType = 'xml';

    } else if (sa3.applicationType == 'application/json') {

        if (postBody != '') {
            ajaxOpts.data = postBody;
            sa3.logger.debug('post body: ' + ajaxOpts.data);
        }
        ajaxOpts.contentType = sa3.applicationType;
        ajaxOpts.dataType = 'json';
    }

    if (m_SubServerName != "")
        ajaxOpts.headers = {'SubServer': m_SubServerName}

//    ajaxOpts.accept = {};
//    if(sa3.acceptType == 'application/xml'){
//        ajaxOpts.accept.xml = sa3.acceptType;
//        delete    ajaxOpts.accept.json;
//    }else if(sa3.acceptType == 'application/json'){
//        ajaxOpts.accept.json = sa3.acceptType;
//        delete    ajaxOpts.accept.xml;
//    }

    //submit ajax    
    //    sa3.logger.debug(ajaxOpts);
     sa3.currRequest  = 
             $.ajax(ajaxOpts);
};


