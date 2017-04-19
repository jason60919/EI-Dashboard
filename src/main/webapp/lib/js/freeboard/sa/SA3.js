/* 
 * Glboal Config/function
 * !!! IMPORTANT , DONOT REMOVE ANY KEY
 * @author ken.tsai@advantech.com.tw
 * @date 2015/03/26
 */

var SA3 = {
    //for IoTGW device 
    widget :{
        interval: 60,//refresh interval
        limitedLines: 10,
        defaultRow: 1,
        defaultCol:1,
        defaultSizeX: 2, 
        defaultSizeY:8 //tow column
    },
    device:{
        /*agent type*/
        IPC: 'IPC',
        IPC_IoTGW: 'IPC_IoTGW',
        IPC_SenNode: 'IPC_SenHub',
        IoTGW: 'IoTGW',
        SenNode: 'SenHub', //for bnparse.js
        SenData: 'SenData',//for bnparse.js
        SenNodeList: '/Info/SenHubList',   
        sortBy: 1,
        HandlerUnitForDA :['v','rpm','cel','percent','on/off']
    },
    noty:{
        Layout: 'topCenter',
        Timeout: 2000
    }
};

