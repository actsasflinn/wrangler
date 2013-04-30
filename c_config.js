var c = null;
jQuery(function(){
  /*
    Your account id
  */
  var account = "TestAccount";

  /*
    Your site id
  */
  var site = window.location.hostname;
  /*
    how frequently to sync
    default is 30 seconds
  */
  var frequency = 5000;

  /*
    unique id generation function
    default is Math.random based
    override examples:
      #1: jQuery.Guid
      var uid = function() { return jQuery.Guid(); };
      A({ "uid": uid })

      #2: MurmurHash https://gist.github.com/588423
      var uid = function() { return doHash(); };
      A({ "uid": uid })
  */
  var uniq = function() { return Math.floor(Math.random() * 100000) };

  /*
    session id
    default falls back to unique id generation which is persistant only to one page
  */
  var session_id = 'a_sid';

  /*
    transport function, takes (data)
    override examples:
      #1: jQuery.ajax with JSONP
      var t = function(data) { jQuery.ajax("http://example.com/", { dataType:"jsonp", data:data }) };
      A({ "transport": t });

      #2: socket.io
      var socket = io.connect('http://localhost/');
      var t = function(data) { config['socket'].emit(data) };
      A({ "transport": t, "socket": socket });
  */
  //var transport = function(d){ jQuery.ajax(config['url'], d) };
  var transport = function(data, async){
    //jQuery.post("http://0.0.0.0/capture",data,{async:async})

    jQuery.ajax({
      type:'POST',
      url:'http://0.0.0.0:3000/capture',
      data:data,
      async:async
    });

    /*
    jQuery.ajax({
      type: 'GET',
      url: "http://0.0.0.0/capture",
      data: data,
      dataType: "jsonp",
      async: async
    });
    */

  /*
    // Add the iframe with a unique name
    var iframe = document.createElement("iframe");
    var uniqueString = uniq();
    //iframe.style.display = "none";
    //iframe.contentWindow.name = uniqueString;
    iframe.name = uniqueString;

    // construct a form with hidden inputs, targeting the iframe
    var form = document.createElement("form");
    form.target = uniqueString;
    form.action = "http://0.0.0.0/capture";
    form.method = "POST";

    for(var i=0;i<data.length;i++) {
      var val = data[i];
      for(var k in val) {
        var input = document.createElement("input");
        input.name = "e["+i+"]["+k+"]";
        input.value = val[k];
        form.appendChild(input);
      }
    }

    document.body.appendChild(iframe);
    iframe.document.body.appendChild(form);
    //form.submit();
  */
  };

  /*
      var transport = function(data){
        var $log = $('#log'+this.sid);
        if ($log.length == 0) {
          $('body').append($('<div id="log'+this.sid+'"></div>'));
          $log = $('#log'+this.sid);
        }
        for(var i in data) {
          data[i].data = escape(data[i].data);
          $log.append(JSON.stringify(data[i]));
          $log.append(",<br />");
        }
      };
  */

  /*
    logging function
    default is /dev/null
    override examples:
    #1. console.log
    if (console && console.log) logging = function(s){ console.log(s); }  // one liners? yeah.we.got.a.lot.of.em!
  */
  var log = function(){};

  c = Capture(account, site, uniq, session_id, transport, frequency, log);
  c.meta('initialize', new Date().getTime());
  c.meta('user_agent', navigator.userAgent);
  c.meta('user_time.tz', (new Date).getTimezoneOffset());
  c.meta('window.screen.availHeight', window.screen.availHeight);
  c.meta('window.screen.availWidth', window.screen.availWidth);

  var plugins = [];
  for(var i = 0;i<navigator.plugins.length;i++) {
    plugins.push(navigator.plugins[i].name);
  }
  c.meta('navigator.plugins', plugins.sort().join(";"))

  jQuery(window).bind('hashchange', c.hash_change); // Log hashchange
  jQuery("body").on("click", c.click);
  jQuery("body").on("change", c.change);

  jQuery("body").on("mousedown", c.mousedown);
  jQuery("body").on("keydown", c.keydown);
  jQuery("body").on("focusin", c.focusin);

  c.location();
  console.log('capturing analytics');

  // create an invisible iframe and cookie to create a span id
  // or use a cookie to represent the span id,
  // this will work with Layer 7 LB but not on the real internet.
})
