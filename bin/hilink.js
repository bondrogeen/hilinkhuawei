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
    
    self.token = '0000';

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

// информация общая о модеме
    self.status = function(callback){
        self.info( '/api/monitoring/status',function( response ){
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

// информация о типе сети
    self.Net = function(callback){
        self.info( '/api/device/basic_information',function( response ){
            callback(response);
        });
    }

// Статистика трафика модема
    self.traffic = function(callback){
        self.info( '/api/monitoring/traffic-statistics',function( response ){
            callback(response);
        });
    }

// вкл. и откл. от мобильной сети.
    self.conect = function(type, callback){
        var xml = builder.create({
            request: {

                Action: {
                    '#text': type
                },


            }
        }).end({ pretty: true});

        self.request( '/api/dialup/dial', xml, function( response ){
            callback( response );
        });
    }

    self.desconnect  = function(callback){
        self.conect( 0,function( response ){
            callback(response);
        });
    }

    self.connect  = function(callback){
        self.conect( 1,function( response ){
            callback(response);
        });
    }

// перезугрузка модема
    self.init = function(type, callback){
        var xml = builder.create({
            request: {

                Control: {
                    '#text': type
                },


            }
        }).end({ pretty: true});

        self.request( '/api/device/control', xml, function( response ){
            callback( response );
        });
    }

    self.reboot  = function(callback){
        self.init( 1,function( response ){
            callback(response);
        });
    }


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
            callback( response );
        });

    }



}

module.exports =  new hilink();