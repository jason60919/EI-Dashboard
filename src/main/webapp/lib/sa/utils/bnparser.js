/* 
 * Convert device info spec for Web UI data-binding
 * parseGroup and parseElement reference DeviceInfoSpec.java by jelly
 * @date 2015/02/13
 * @required
 *  js/libs/log4javascript/log4javascript.min.js
 *  js/sa/utils/log4jq.js
 */
var bnparser  = (function(log4jq,SA3){
    
    var bnparser = {};
    
    bnparser.SA3 = SA3;
    
    var dataSet = [];
    var threadhold = 100;
    var recursiveCount = 0;
    
    bnparser.logger = log4jq.getLogger({
        loggerName: 'bnparser.js'
    });
    
    bnparser.version = '0.1';
    bnparser.author = 'bigd';
    
    bnparser.getDataSet = function(){
        return dataSet;
    };
    
    bnparser.getHandlers = function(jsonOfInfoSpec){
        bnparser.logger.info('call getHandlers func');
        bnparser.logger.debug(jsonOfInfoSpec);
        var handlers = [];
        for(var key in jsonOfInfoSpec) {
            bnparser.logger.debug('handler: ' + key);
            handlers.push(key);
        }
        return handlers;
    };
    
    //from IoTGW device
    bnparser.getSenNodeList = function(handler,jsonOfInfoSpec){
        bnparser.logger.info('call getSenNodeList func');
        //only get data with bn: SenNodeList
        var dataSet = bnparser.json2DataSet(handler,jsonOfInfoSpec, 'SenNodeList');
        return dataSet;
    }
    
    //from SenNodeDevice
    bnparser.getSensorNodeList = function(jsonOfInfoSpec){
        bnparser.logger.info('call getSensorNodeList func: ' + bnparser.SA3.device.SenNode);
        var dataset = bnparser.json2DataSet(bnparser.SA3.device.SenNode,jsonOfInfoSpec);
//        console.log(dataset);
        var senNodeDataSet = [];
        for(var iSenNode=0;iSenNode<dataset.length;iSenNode++){
            var senNode = dataset[iSenNode];
            
            if(senNode.id.indexOf(bnparser.SA3.device.SenData) >= 0){
                senNodeDataSet.push(senNode);
            }
            
        }
        return senNodeDataSet;
    };
    
    /*
     * @param {string}: SUSIControl or IoTGw
     * @parame {json object}:
     * @parame {json string}: bn filter (只指定具體的element name會被取出)
     **/
    bnparser.json2DataSet = function(handler,jsonOfInfoSpec,filter){
        
        bnparser.logger.info('call json2DataSet func');
        bnparser.logger.debug(jsonOfInfoSpec);
        bnparser.logger.debug('handler: ' + handler);
        bnparser.logger.debug('filter: ' + filter);
        
        //        console.log(jsonOfInfoSpec);
        dataSet = [];//reset
        recursiveCount = 0;
        
        if(jsonOfInfoSpec.hasOwnProperty(handler)){
            bnparser.logger.debug('find hander: ' + handler);
            //first level 1
            parseGroup(jsonOfInfoSpec[handler],'',filter);
        }else{
            bnparser.logger.error('cannot find handler: ' + handler);
        }
         
        bnparser.logger.info('covert completely');
        return dataSet;
    };
    
    var parseGroup = function(group, currentIdPath,filter){
        bnparser.logger.info('call parseGroup func: ');
        bnparser.logger.debug('currentIdPath: ' + currentIdPath);
        bnparser.logger.debug('filter: ' + filter);
        var updateIdPath = '';
        recursiveCount++;
        
        if(recursiveCount == threadhold){
            bnparser.logger.debug('detect infini loop' );
            return;
        }
        bnparser.logger.info('call parserGroup func');
         
        bnparser.logger.info('current id path: ' + currentIdPath);
        bnparser.logger.debug('group content as below:');
        bnparser.logger.debug(group);
         
        var enableFilter = false;
        for(var key in group) {
            bnparser.logger.debug('for key: ' + key );
            var subGroup = group[key];

            bnparser.logger.debug('current val as below: ');
            bnparser.logger.debug(subGroup);
            
            if( subGroup.hasOwnProperty('bn')){
                 
                bnparser.logger.debug('find bn from ' + key);
                bnparser.logger.debug(subGroup);     
                bnparser.logger.warn(subGroup['bn'] + ' match');
                if(currentIdPath == ''){
                    updateIdPath = "/" + subGroup.bn;
                //                        updateIdPath = "/" + subGroup.bn;
                }else{
                    updateIdPath = currentIdPath + '/' + subGroup.bn ;
                }
                
                if(subGroup.hasOwnProperty('e')){
                    bnparser.logger.info('find e array from ' + key);
                    parseElement(subGroup.e,updateIdPath,filter);
                }else{
                     
                    bnparser.logger.warn('cannot find e key , go to parse group');  
                    bnparser.logger.debug('update Id path: ' + updateIdPath);  
                    
                    bnparser.logger.debug(subGroup);  
                    delete subGroup['bn'];
                    bnparser.logger.debug('after remove bn key as below');  
                    bnparser.logger.debug(subGroup);  
                    parseGroup(subGroup,updateIdPath,filter);
                }
                
                 
            }else{
                 
                bnparser.logger.warn('cannot find bn key from ' + key + ' , go to parse group');
                
                if($.isArray(subGroup)){
                    bnparser.logger.warn('find array object');
                    updateIdPath = "";
                }else{
                    updateIdPath = "/" + key;
                }
                bnparser.logger.warn('update id path: ' + updateIdPath + ', recursve parse group');
                parseGroup(subGroup,updateIdPath,filter);

            }
              
        }
    };
    
    var parseElement = function(elem,currentIdPath,filter){
        bnparser.logger.info('call parserElement func');
        bnparser.logger.info('current id path: ' + currentIdPath);
        bnparser.logger.info('current filter: ' + filter);
        recursiveCount++;
        var enableFilter = false;
        if(typeof(filter) != 'undefined'){
        
            enableFilter = true;
        }
        
        bnparser.logger.debug('enableFilter: ' + enableFilter);
        for(var i=0;i<elem.length;i++){
             
            var deviceLv2 = elem[i];
            bnparser.logger.debug(deviceLv2);
             
            var finalIdPath = currentIdPath + '/' + deviceLv2.n;
            //for web ui data-binding
            var newDeviceL2 = {
                n: deviceLv2.n,
                id: finalIdPath,
                v: deviceLv2Val,
                vtype: valueType
            }
             
            //sv => string value
            //bv => boolean value
            //v => normal value => support avg,max,min
             
            var deviceLv2Val;
            var valueType;
            if(deviceLv2.hasOwnProperty('sv')){
                deviceLv2Val = deviceLv2.sv;
                valueType = 'string'
            }else if(deviceLv2.hasOwnProperty('bv')){
                deviceLv2Val = deviceLv2.bv;
                if(deviceLv2.bv){
                    deviceLv2Val = 1;
                }else{
                    deviceLv2Val = 0;
                }
                valueType = 'boolean'
            }else if(deviceLv2.hasOwnProperty('v')){
                deviceLv2Val = deviceLv2.v;
                valueType = 'value'
            }
            newDeviceL2.v = deviceLv2Val;
            newDeviceL2.vtype = valueType;
            if(deviceLv2.hasOwnProperty('min')){
                newDeviceL2.min = deviceLv2.min;
            }
            if(deviceLv2.hasOwnProperty('max')){
                newDeviceL2.max = deviceLv2.max
            }
            if(deviceLv2.hasOwnProperty('type')){
                newDeviceL2.type = deviceLv2.type;
            }
            if(deviceLv2.hasOwnProperty('u')){
                newDeviceL2.unit = deviceLv2.u;
            }
   
             
            bnparser.logger.debug('last bn: ' + deviceLv2.n);
            if(enableFilter){
                if(filter  == deviceLv2.n){
                    bnparser.logger.debug('find match bn: ' + filter);
                    //push
                    dataSet.push(newDeviceL2);
                }
            }else{
                //push
                dataSet.push(newDeviceL2);
            }
            
            
             
        }
    };
    
    window.bnparser = bnparser;

    return bnparser;
    
})(log4jq,SA3);

