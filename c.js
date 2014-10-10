// TODO: Don't use jquery directly or call jQuery object methods

if (typeof Capture === "undefined") {
  Capture = function(account, site, uniq, session_id, transport, frequency, log) {
    var q = [];
    var interval = null;

    var push = function(data) {
      if (typeof(data) != "object") data = { "data": data };
      if (!data['id'])     data['id']     = uniq();
      if (!data['offset']) data['offset'] = timeStamp();
      q.push(data);
    }

    /*
      empty the queue and sync it
    */
    var sync = function(async) {
      async = typeof(async) === "undefined" ? true : async;

      if (q.length > 0) {
        log("syncing...");
        var entries = q;
        q = [];
        transport({ session_id:sid(), site_id:site, account_id:account, events:entries }, async);
      } else {
        log("nothing to sync.");
      }
    };

    /*
      getter method for the private q
    */
    var queue = function() {
      return q;
    }

    /*
      getter method for the private session id
    */
    var sid = function() {
      var i,x,y,cookies=document.cookie.split(";");
      for (i=0;i<cookies.length;i++) {
        x=cookies[i].substr(0,cookies[i].indexOf("="));
        y=cookies[i].substr(cookies[i].indexOf("=")+1);
        x=x.replace(/^\s+|\s+$/g,'');

        if (x==session_id) {
          return unescape(y);
        }
      }
      // if no session cookie is present, make one up.
      var cookie = uniq()
      document.cookie=session_id+"="+escape(cookie);
      return cookie;
    };

    /*
      start periodically syncing the queue
    */
    var start = function() {
      if (frequency > 0) {
        log("starting...")
        interval = window.setInterval(sync, frequency);
      } else {
        log("not starting, no frequency set.");
      }
    }

    /*
      stop periodically syncing the queue
    */
    var stop = function() {
      if (interval) {
        log("stopping...")
        window.clearInterval(interval);
      } else log("nothing to stop.")
    };

    var snapshot = function(el) {
      if (!el) el = document.documentElement;

      push({ kind:   "snapshot",
             group:  el.nodeName,
             target: id_el(el),
             path:   path_to(el),
             data:   $(el).html(),
             x:      el.pageX,
             y:      el.pageY,
             offset: timeStamp() });
    }

    var id_el = function(el){
      var id = $(el).data("elid");
      id = id || $(el).attr("id");
      id = id || $(el).attr("name");
    //  id = id || $(el).attr("href");
    //  id = id || $(el).attr("class");
      return id;
    };

    // http://stackoverflow.com/questions/2631820/im-storing-click-coordinates-in-my-db-and-then-reloading-them-later-and-showing/2631931#2631931
    var path_to = function(element) {
      if (element.id !== '') return 'id("'+element.id+'")';
      if (element === document.body) return element.tagName;

      var ix = 0;
      var siblings = element.parentNode.childNodes;

      for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];

        if (sibling === element)
          return path_to(element.parentNode)+'/'+element.tagName+'['+(ix+1)+']';

        if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
          ix++;
      }
    };

    var default_callback = function(ev){
      var data = $(ev.target).val() || '';
      push({ kind:   ev.type,
             group:  ev.target.nodeName,
             target: id_el(ev.target),
             path:   path_to(ev.target),
             data:   data,
             x:      ev.pageX,
             y:      ev.pageY,
             offset: timeStamp(ev.timeStamp) });
    };

    var click_callback = function(ev){
      var data = $(ev.target).attr('href') || '';
      push({ kind:   ev.type,
             group:  ev.target.nodeName,
             target: id_el(ev.target),
             path:   path_to(ev.target),
             data:   data,
             x:      ev.pageX,
             y:      ev.pageY,
             offset: timeStamp(ev.timeStamp) });
    };

    var which_callback = function(ev) {
      var data = $(ev.target).val() || '';
      push({ kind:   ev.type,
             group:  ev.target.nodeName,
             target: id_el(ev.target),
             path:   path_to(ev.target),
             data:   data,
             which:  ev.which,
             offset: timeStamp(ev.timeStamp) });
    };

    var form_callback = function(ev) {
      var data = $(ev.target).val() || '';
      push({ kind:   ev.type,
             group:  ev.target.nodeName,
             target: id_el(ev.target),
             path:   path_to(ev.target),
             data:   data,
             x:      ev.pageX,
             y:      ev.pageY,
             offset: timeStamp(ev.timeStamp) });
    };

    var location = function(ev) {
      push({ kind:   'location',
             group:  'href',
             path:   'window',
             target: window.location.href,
             data:   document.referrer,
             source: document.title });
    };

    var hash_change = function(ev) {
      push({ kind:   'location',
             group:  'hashchange',
             target: window.location.href,
             data:   document.referrer });
    };

    var path = function(path) {
      push({ kind:   'path',
             group:  'load',
             target: path });
    };

    var meta = function(key, value) {
      push({ kind:  'meta',
             group: key,
             data:  value });
    };

    var ready = function(callback){
      log("ready");
      $().ready(callback);
    };

    var timeStamp = function(time) {
      if (typeof(time) != 'number') time = new Date().getTime();
      return time / 1000;
    }

    /*
      public interface
    */
    var pub = {
      ready: ready,
      sync: sync, push: push,
      queue: queue,
      start: start, stop: stop,
      sid: sid,
      snapshot:snapshot,
      location:location,
      hash_change:hash_change,
      path:path,
      meta:meta,
      click:click_callback,
      change:default_callback,
      mousedown: which_callback,
      keydown:which_callback,
      focusin: form_callback,
      time: time,
    };

    // sync any queued data before unloading the page
    window.onbeforeunload = function(ev){
      push({ kind:   ev.type,
             group:  'unload',
             target: 'beforeunload',
             path:   'window',
             data:   window.location.href,
             offset: timeStamp(ev.timeStamp) });

      sync(false);
    };

    // you forgot your train of thought here.

    // start syncing
    start();

    return pub;
  }
};
