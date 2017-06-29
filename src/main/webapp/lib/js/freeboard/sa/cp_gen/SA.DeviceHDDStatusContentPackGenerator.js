/*
 *  content pack generator template
 *  @date 2015/11/11
 */
if (typeof (ContentPackGenerator) !== 'undefined') {
    ContentPackGenerator.register('deviceHDDStatus', 'DeviceHDDStatusContentPackGenerator');
}

var DeviceHDDStatusContentPackGenerator = (function (log4jq) {

    var self = {};
    self.name = 'SA.DeviceHDDStatusContentPackGenerator.js';

    var logger = log4jq.getLogger({
        loggerName: self.name
    });

    /*
     * Sample create function
     * dsGenerator.create = function (pack_type,data) {};
    */
    self.create = function (data,callback) {
        logger.info('create');
     
        logger.debug(data);
          
        //SUSIControl
        Device2ContentPackGenerator.create(
                data,
                'HDDMonitor',
                ['hddInfoList'],
                function(config){
                    if(typeof(callback === 'function')){
                        callback(config);
                    }
                });
    };
    
    window[self.name] = self;

    return self;
})(log4jq);

function testDeviceNetworkStatusContentPackGenerator(device) {
   
    var config = Device2ContentPackGenerator.create(device,   
                'HDDMonitor',
                ['hddInfoList']);
}