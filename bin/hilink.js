var http = require('http');
var builder = require('xmlbuilder');
var dateFormat = require('dateformat');
var parseString = require('xml2js').parseString;

var hilink = function(){
    var self = this;

// port
    self.port = 80;

//ip def.
    self.ip = '192.168.8.1';

//ip def.
    self.trafficInfo = 'auto'

    self.token = '0000';


    self.setTrafficInfo = function (TrafficInfo) {
        self.trafficInfo = TrafficInfo;
    }

//изменения ip
    self.setIp = function( ip ){
        self.ip = ip;
    }

// Получаем token
    function getToken( callback) {

        http.get('http://'+self.ip+'/api/webserver/token', (res) => {

        var body = [];
        res.on('data', function (chunk) {
            body.push(chunk);
        }).on('end', function() {
            body = Buffer.concat(body).toString();
            parseString(body, function (err, result) {
                var token = result.response.token[0]
                self.token = token;
                callback (token);
            });
         });
    res.resume();
    }).on('error', (e) => {
            console.log(`error: ${e.message}`);
    });
    }

    self.request = function( path, xml, callback ){       // post запросы модему

        getToken(function( token ){
            self.token = token;
            var postRequest = {
                host: self.ip,
                path: path,
                port: self.port,
                method: "POST",
                headers: {
                    'Content-Type' : 'application/x-www-form-urlencoded',
                    'Cookie': "cookie",
                    'Content-Type': 'text/xml',
                    'Content-Length': Buffer.byteLength(xml),
                    '__RequestVerificationToken':self.token
                }
            };

            var buffer = "";

            var req = http.request( postRequest, function( res )    {
                var buffer = "";
                res.on( "data", function( data ) {
                    buffer = buffer + data;
                });
                res.on( "end", function( data ) {
                    parseString( buffer, function (err, result) {
                        callback( result );
                    });
                });
            });

            req.write( xml );
            req.end();
        } );

    }

    self.send = function( number, text, callback ){
        var xml = builder.create({
            request: {

                Index: {
                    '#text': '1'
                },
                Phones: {
                    Phone: {
                        '#text': number
                    }
                },
                Sca: {
                    '#text': ''
                },
                Content: {
                    '#text': text
                },
                Length: {
                    '#text': text.length
                },
                Reserved: {
                    '#text': '1'
                },
                Date: {
                    '#text': dateFormat(new Date(), 'yyyy-MM-dd hh:mm:ss')
                }
            }
        }).end({ pretty: true});

        self.request( '/api/sms/send-sms', xml, function( response ){
            callback( response );
        });

    }

    self.setRead = function (index, callback) {
        var xml = builder.create({
            request: {
                Index: {
                    '#text': index
                }

            }
        }).end({pretty: true});

        self.request('/api/sms/set-read', xml, function (response) {
            callback(response);
        });
    }

    self.readAll = function (callback) {
        self.list(1, function (results) {
            response = []
            var k = 0
            for (i = 0; i < results.response.Count[0]; i++) {
                if (results.response.Messages[0].Message[i].Smstat[0] == 0) {
                    self.setRead(results.response.Messages[0].Message[i].Index[0], function (res) {
                    });
                    k = k + 1
                    response[k] = results.response.Messages[0].Message[i].Index[0]

                }
            }

            if (response.length == 0) {
                response[0] = {"response": "no_new_sms"};
            } else {
                response[0] = {"response": "OK"};
            }

            callback(response);
            /*
             results["response"]["Messages"][0]["Message"].forEach(function (message) {
             if (message.Smstat == 0) {
             self.setRead(message.Index[0], function (response) {
             response.index =  message.Index[0];
             //callback( response );
             });
             }
             })

             */


        });
    };

    self.list = function(type, callback){
        var xml = builder.create({
            request: {

                PageIndex: {
                    '#text': '1'
                },
                ReadCount: {
                    '#text': '20'
                },
                BoxType: {
                    '#text': type
                },
                SortType: {
                    '#text': '2'
                },
                Ascending: {
                    '#text': '0'
                },
                UnreadPreferred: {
                    '#text': '0'
                }

            }
        }).end({ pretty: true});

        self.request( '/api/sms/sms-list', xml, function( response ){
            callback( response );
        });
    }


    self.listNew = function (callback) {
        self.list(1, function (results) {
            response = []
            for (i = 0; i < results.response.Count[0]; i++) {
                if (results.response.Messages[0].Message[i].Smstat[0] == 0) {
                    response[i + 1] = results.response.Messages[0].Message[i];
                }
            }

            if (response.length == 0) {
                response[0] = {"response": "no_new_sms"};
            } else {
                response[0] = {"response": "OK"};
            }
            callback(response);
        });
    }

    self.listInbox = function(callback){
        self.list( 1,function( response ){
            callback(response);
        });
    }

    self.listOutbox = function(callback){
        self.list( 2,function( response ){
            callback(response);
        });
    }

    self.delete = function( index, callback ){
        var xml = builder.create({
            request: {
                Index: {
                    '#text': index
                }

            }
        }).end({ pretty: true});

        self.request( '/api/sms/delete-sms', xml, function( response ){
            callback( response );
        });
    }


    self.deleteAll = function(type){
        self.list( type, function(results){
            if( results["response"]["Count"][0] > 0 ){
                results["response"]["Messages"][0]["Message"].forEach(function(message){
                    self.delete( message.Index[0], function( response ){
                        console.log( response );
                    });
                });
            }
            else{
                console.log( results["response"]["Count"][0] );
            }
        });
    }

    self.clearInbox = function(){ // чистить входящих смс
        self.deleteAll( 1 );
    }

    self.clearOutbox = function(){   // чистить исходящих смс
        self.deleteAll( 2 );
    }

    self.sendAndDelete = function(number, text, callback){
        self.send(number, text, function(sendResponse){
            if( sendResponse.response === 'OK' ){
                self.listOutbox( function( listResponse ){
                    self.delete( listResponse["response"]["Messages"][0]["Message"][0].Index[0], function( deleteResponse ){
                        callback( sendResponse, deleteResponse );
                    });
                });
            }
            else{
                console.log(sendResponse);
            }
        });
    }

// get запросы модему
    self.info = function(val, callback) {
        http.get('http://'+self.ip+val, (res) => {
            //console.log(`Got response: ${res.statusCode}`);
            var buffer = "";
        res.on('data', function (data) {
            buffer = buffer + data;
        }).on('end', function(data) {
            parseString( buffer, function (err, result) {
                callback( result );
            });
        });
        res.resume();
    }).on('error', (e) => {
            console.log(`Got error: ${e.message}`);
    });
    }


    self.jsonNet = {
        "0": "NOSERVICE",
        "1": "GSM",
        "2": "GPRS",
        "3": "EDGE",
        "21": "IS95A",
        "22": "IS95B",
        "23": "CDMA1x",
        "24": "EVDO_REV_0",
        "25": "EVDO_REV_A",
        "26": "EVDO_REV_A",
        "27": "HYBRID_CDMA1x",
        "28": "HYBRID_EVDO_REV_0",
        "29": "HYBRID_EVDO_REV_A",
        "30": "HYBRID_EVDO_REV_A",
        "31": "EHRPD_Rel_0",
        "32": "EHRPD_Rel_A",
        "33": "EHRPD_Rel_B",
        "34": "HYBRID_EHRPD_Rel_0",
        "35": "HYBRID_EHRPD_Rel_A",
        "36": "HYBRID_EHRPD_Rel_B",
        "41": "WCDMA",
        "42": "HSDPA",
        "43": "HSUPA",
        "44": "HSPA",
        "45": "HSPA_PLUS",
        "46": "DC_HSPA_PLUS",
        "61": "TD_SCDMA",
        "62": "TD_HSDPA",
        "63": "TD_HSUPA",
        "64": "TD_HSPA",
        "65": "TD_HSPA_PLUS",
        "81": "802.16E",
        "101": "LTE",
    }
    self.jsonNetStatsu = {
        "900": "CONNECTING",
        "901": "CONNECTED",
        "902": "DISCONNECTING",
        "904": "DISCONNECTED",
    }


// информация общая о модеме

    self.status = function(callback){
        self.info('/api/monitoring/status', function (response) {

            self.jsonNet[response.response.CurrentNetworkType[0]] = self.jsonNet[response.response.CurrentNetworkType[0]] || response.response.CurrentNetworkType[0]
            response.response.CurrentNetworkType[0] = self.jsonNet[response.response.CurrentNetworkType[0]]

            self.jsonNetStatsu[response.response.ConnectionStatus[0]] = self.jsonNetStatsu[response.response.ConnectionStatus[0]] || response.response.ConnectionStatus[0]
            response.response.ConnectionStatus[0] = self.jsonNetStatsu[response.response.ConnectionStatus[0]]

            callback(response);
        });

    }

// информация о уведомлениях  сети
    self.notifications = function(callback){
        self.info( '/api/monitoring/check-notifications',function( response ){
            callback(response);
        });
    }

// информация о операторе сети
    self.statusNet = function(callback){
        self.info( '/api/net/current-plmn',function( response ){
            callback(response);
        });
    }

// информация кол. сообщений
    self.smsCount = function(callback){
        self.info( '/api/sms/sms-count',function( response ){
            callback(response);
        });
    }

// информация о сигнале сети
    self.signal = function(callback){
        self.info( '/api/device/signal',function( response ){
            callback(response);
        });
    }

// информация о ip сети
    self.settingsNet = function(callback){
        self.info( '/api/dhcp/settings',function( response ){
            callback(response);
        });
    }

// информация о модеме
    self.basicInfo = function (callback) {
        self.info( '/api/device/basic_information',function( response ){
            callback(response);
        });
    }


// статистика

    function formatFloat(src, pos) {
        return Math.round(src * Math.pow(10, pos)) / Math.pow(10, pos);
    }


    function getTrafficInfo(bit) {

        var g_monitoring_dumeter_kb = 1024;
        var g_monitoring_dumeter_mb = 1024 * 1024;
        var g_monitoring_dumeter_gb = 1024 * 1024 * 1024;
        var g_monitoring_dumeter_tb = 1024 * 1024 * 1024 * 1024;
        var final_number = 0;
        var final_str = '';
        if (g_monitoring_dumeter_kb > bit) {
            final_number = formatFloat(parseFloat(bit), 2);
            final_str = final_number + ' B';
        } else if (g_monitoring_dumeter_kb <= bit && g_monitoring_dumeter_mb > bit) {
            final_number = formatFloat(parseFloat(bit) / g_monitoring_dumeter_kb, 2);
            final_str = final_number + ' KB';
        } else if (g_monitoring_dumeter_mb <= bit && g_monitoring_dumeter_gb > bit) {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_mb), 2);
            final_str = final_number + ' MB';
        } else if (g_monitoring_dumeter_gb <= bit && g_monitoring_dumeter_tb > bit) {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_gb), 2);
            final_str = final_number + ' GB';
        } else {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_tb), 2);
            final_str = final_number + ' TB';
        }
        return final_str;
    }


    function getCurrentTime(time) {
        var final_time = '';
        var times = parseInt(time, 10);
        var hours = parseInt((times / 3600), 10);
        if (hours > 9) {
            final_time += hours + ':';
        } else if (hours >= 0) {
            final_time += '0' + hours + ':';
        }
        times = times - hours * 3600;

        var minutes = parseInt(times / 60, 10);
        if (minutes > 9) {
            final_time += minutes + ':';
        } else if (minutes > 0) {
            final_time += '0' + minutes + ':';
        } else if (minutes == 0) {
            final_time += '00' + ':';
        }
        times = times - minutes * 60;

        //handle second display
        if (times > 9) {
            final_time += times;
        } else if (times > 0) {
            final_time += '0' + times;
        } else if (times == 0) {
            final_time += '00';
        }

        return final_time;
    }

// Статистика трафика за месяц

    self.trafficMonth = function (callback) {
        self.info('/api/monitoring/month_statistics', function (response) {

            if (self.trafficInfo == 'auto') {
                response.response.MonthDuration[0] = getCurrentTime(response.response.MonthDuration[0])
                response.response.CurrentMonthDownload[0] = getTrafficInfo(response.response.CurrentMonthDownload[0])
                response.response.CurrentMonthUpload[0] = getTrafficInfo(response.response.CurrentMonthUpload[0])
            callback(response);
            } else {
                callback(response);
            }
        });
    }

// Статистика трафика модема
    self.traffic = function (callback) {
        self.info('/api/monitoring/traffic-statistics', function (response) {

            if (self.trafficInfo == 'auto') {
                response.response.CurrentConnectTime[0] = getCurrentTime(response.response.CurrentConnectTime[0])
                response.response.TotalConnectTime[0] = getCurrentTime(response.response.TotalConnectTime[0])
                response.response.CurrentUpload[0] = getTrafficInfo(response.response.CurrentUpload[0])
                response.response.CurrentDownload[0] = getTrafficInfo(response.response.CurrentDownload[0])
                response.response.TotalUpload[0] = getTrafficInfo(response.response.TotalUpload[0])
                response.response.TotalDownload[0] = getTrafficInfo(response.response.TotalDownload[0])
                response.response.CurrentDownloadRate[0] = getTrafficInfo(response.response.CurrentDownloadRate)
                response.response.CurrentUploadRate[0] = getTrafficInfo(response.response.CurrentUploadRate[0])
                callback(response);
            } else {
                callback(response);
            }
        });
    }


    self.control = function (value, callback) {

        // перезугрузка модема
        if (value == 'reboot') {
            var xml = builder.create({
                request: {
                    Control: {
                        '#text': 1
                    },
                }
            }).end({pretty: true});

            self.request('/api/device/control', xml, function (response) {
                callback(response);
            });

            // вкл. и откл. от мобильной сети.
        } else if (value == 'conect') {
            var xml = builder.create({
                request: {
                    Action: {
                        '#text': 1
                    },
                }
            }).end({pretty: true});

            self.request('/api/dialup/dial', xml, function (response) {
                callback(response);
            });

        } else if (value == 'desconect') {
            var xml = builder.create({
                request: {
                    Action: {
                        '#text': 0
                    },
                }
            }).end({pretty: true});

            self.request('/api/dialup/dial', xml, function (response) {
                callback(response);
            });
        } else {
            callback(response = {"response": "ERROR"});
        }




    }

// запрос USSD

    self.ussd = function( number, callback ){
        var xml = builder.create({
            request: {

                content: {
                    '#text': number
                },
                codeType: {
                    '#text' : 'CodeType'
                },

            }
        }).end({ pretty: true});

        self.request( '/api/ussd/send', xml, function( response ){

            if (response.response == 'OK') {
                function func() {
                    self.info('/api/ussd/get', function (response) {
                        response.response.response = 'OK'
                        callback(response);
                    });
                }

                setTimeout(func, 5000);
            } else {
                callback(response);
            }

        });

    }



}

module.exports =  new hilink();