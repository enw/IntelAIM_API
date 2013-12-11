var naim =require('./lib/naim');
var MS_BETWEEN_POLLS = 1000;

naim.connect(null,null,function(err) {
    console.log('connected');
    // poll
    function pollForDetails() {
        var enable='remote_action.exe condition -e 1 -n "Group"',
            disable = 'remote_action.exe condition -e 0 -n "Group"';
        
        naim.getAudienceDetails(function (err, details) {
            if (err) { console.log('ERR',err); return err; }
            
            var cmd = (details.length>1)?enable:disable;
            console.log('call',details.length,cmd);
        });
    };
    setInterval(pollForDetails, MS_BETWEEN_POLLS);
  })
