var naim = require('../lib/naim'),
    MS_BETWEEN_POLLS = 5000,
    path = require('path'),
    isWin = !!process.platform.match(/^win/),
    BSBIN = ((isWin)?'"C:\\Program Files (x86)\\BroadSign\\bsp\\bin':'/opt/broadsign/suite/bsp/bin') + path.sep + 'remote_action' + (isWin?'.exe"':''),
    ENABLE_CMD = BSBIN + ' condition -e 1 -n "Group"',
    DISABLE_CMD = BSBIN + ' condition -e 0 -n "Group"',
    HOST = 'think-a',
    exec = require('child_process').exec;
    
naim.connect(HOST,null,function(err) {
    console.log('connected');
    // poll
    function pollForDetails() {        
        naim.getAudienceDetails(function (err, details) {
            if (err) { console.log('ERR',err); return err; }
            
            var cmd = (details.length>1)?ENABLE_CMD:DISABLE_CMD;
            console.log('calling',details.length,cmd);
            exec(cmd,  
                function (error, stdout, stderr) {
                    if(stdout) console.log('stdout: ' + stdout);
                    if(stderr)console.log('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    }
                });
        });
    };
    setInterval(pollForDetails, MS_BETWEEN_POLLS);
  })