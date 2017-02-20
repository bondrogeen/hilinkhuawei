var hilink = require('hilinkhuawei');

hilink.ussd( '*100#', function( response ){
    console.log(JSON.stringify(response) );
});