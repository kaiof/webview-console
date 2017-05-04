var ecpup_queue = [];
var ecpup_ready=false;
var ecpup_CSSlines = false;
var ecpup_JSlines = false;
var ecpup_console;
var ecpup_cssStart = false;
var ecpup_jsStart = false;
var ecpup_jsEnd = false;
var ecpup_adjustJS = 2; // skip doctype and html start tag
var ecpup_callback = false;
var ecpup_autopopup = true;
var ecpup_silencePromiseRejections = true;

function ecpup_count(o) {
  switch (typeof o) {
    case 'string':
      return o.split(/\r\n|\r|\n/).length;
      break;
    case 'object':
      return o.innerHTML.split(/\r\n|\r|\n/).length;
      break;
  }
}  
function ecpup_newSpan(c, t) {
  var spann = document.createElement("span");
  spann.class = c;
  spann.text = t;
  return spann;
}

function ecpup_insertConsole() {
  var doc = window.document;

  var divv = doc.createElement("div");
  
  divv.setAttribute("class", "ecpupScroll");
    var pree = doc.createElement("pre");
    var spann = doc.createElement("span");
    spann.setAttribute("class", "ecpupg");
    spann.innerHTML="Line:Col ";
    pree.appendChild(spann);
    var spann = doc.createElement("span");
    spann.setAttribute("class", "ecpupc");
    spann.innerHTML="Section";
    pree.appendChild(spann);    
    var txtEl=doc.createTextNode("   Message  ");
    pree.appendChild(txtEl);
    spann = doc.createElement("span");
    spann.setAttribute("class", "ecpupb");
    spann.innerHTML = "(document)";
    pree.appendChild(spann);
  divv.appendChild(pree);

    spann = doc.createElement("span");
    spann.setAttribute("id", "ecpup_console");
    spann.innerHTML="";
  divv.appendChild(spann);

    aa = doc.createElement("a");
    aa.setAttribute("class", "ecpupclose");
    aa.href = "#stub";
    aa.text = ""; // set by ::before
  divv.appendChild(aa); // change class and it unhides
 
  var divvv = doc.createElement("div");
  divvv.setAttribute("class", "ecpupbox");
  var divvvv = doc.createElement("div");
  divvvv.setAttribute("class", "ecpup");
  divvvv.setAttribute("id", "ecpup1");
  divvv.appendChild(divv);
  divvvv.appendChild(divvv);
  
  try {
    doc.body.appendChild(divvvv);
  } catch(e) {
    ecpup_altcomms("appendChild failed: " + e.message);
  }
}

function ecpup_altcomms(msg) {
  // TODO: Anyone care?  
  //  Choose between console.error or alerts()
  alert("Error Console: " + msg);
}

function ecpup_getLineAndSection(line) {
  var calcline, errloc;
  if(line < ecpup_jsStart) {
    calcline = line;
    errloc = "&lt;head&gt;";
  } else if(line <= ecpup_jsEnd) {
    calcline = line - ecpup_jsStart + 1; // offset in [JS] tab.
    errloc = "[JS]";
  } else {
    calcline = line - ecpup_JSlines - ecpup_CSSlines + ecpup_adjustJS; // accommodate injections
    errloc = "&lt;body&gt;";
  }
  
  return {ln:calcline, loc:errloc};
}

function ecpup_waitready() {
  var s,j;
  var timeout_count=0;
  s=document.getElementById("style-from-editor");
  j=document.getElementById("script-from-editor");

  if(s) ecpup_CSSlines = ecpup_count(s);
  if(j) ecpup_JSlines = ecpup_count(j);
  if(!(s && j)) {
    timeout_count += 1;
    if(timeout_count == 12) {
      ecpup_altcomms("Unable to connect to document after 3 seconds; console will disconnect after 10 seconds.");
    }
    if(timeout_count > 40) {
      ecpup_altcomms("ErrorConsole: Unable to connect to document after 10 seconds. Disconnecting.");
    } else {
      setTimeout(ecpup_ready, 250); // count-dependency
      return false;
    }
  }
  // document is ready enough to adjust event line numbers and identify locations

  ecpup_insertConsole();
  ecpup_console = document.getElementById('ecpup_console');
  var c = ecpup_console;

  var hd = document.getElementsByTagName("html")[0].innerHTML; // Assume <doctype>, and no intervening code before <html>.
  var hd = hd.split('<'+'/head>'); // drop the end of the document
  
  if(hd.length < 2) {
    ecpup_altcomms("At least one <head> section is expected");
  }
  if(hd.length > 2) {
    ecpup_altcomms("More than one <'+'/head> endtag; assuming first one found is correct.");
  }
  hd=hd[0];

  var hdbits = hd.split('<'+'/style><script id="script-from-editor">'); // There should only be two bits
  if(hdbits.length != 2) {
    ecpup_altcomms('webview-console: One--and only one: <'+'/style><script id="script-from-editor"> block expected. \nZero is "not SoloLearn"; multiple ID\'s is an error. This sometimes occurs if BODY html is in HEAD!');
    // at least try to truncate
    hdbits = [hdbits[0],hdbits[1]]; // TODO: try..catch
  }
  ecpup_beforeJS = ecpup_count(hdbits[0]); // At what line does inserted JS start?

  ecpup_jsStart = ecpup_beforeJS + ecpup_adjustJS;
  ecpup_jsEnd = ecpup_jsStart + ecpup_JSlines;

  // handle queued script errors + adjusting lineno
  var l = ecpup_queue.length;

  if(l>0){
    var line, calcline, errloc;
    for(var i=0;i<l;i++) {
      s = ecpup_queue[i][0];
      line = ecpup_queue[i][1];

      var repaired = ecpup_getLineAndSection(line); 
      
      s = s.replace("{ln}", repaired.ln); // can't chain replaces...
      s = s.replace("{loc}", repaired.loc);

      c.innerHTML += s;
    } 
  }
  
  ecpup_ready = true; // if async, set this as soon as possible to keep new events out of queue
  return true;
}

function ecpup_doAutopop() {
    document.location.href="#ecpup1";
}

window.onerror=function(msg, srcdoc, ln, col, errmsg) {
  var ins;
  var pre_ins = "<span class='ecpupg'>"; 
  var post_ins= " [" + errmsg + "] <span class='ecpupb'>(" + srcdoc + ")</span><hr />";
  var css_ln = ecpup_CSSlines;
  var js_ln = ecpup_JSlines;

  var adjloc="{loc}";
  var adjline="{ln}";
  if(ecpup_ready) {
    // var adjline = ln-(css_ln+js_ln)+2;
    var repaired = ecpup_getLineAndSection(ln);
    adjloc = repaired.loc;
    adjline = repaired.ln;
  }
  ins = pre_ins + adjline + ":" + col + " </span><span class='ecpupc'>" + adjloc + "</span>" + post_ins;

  if(ecpup_ready) {
    ecpup_console.innerHTML += ins;
  }
  else { // errors that occur before the console is ready (calculate line/location later)
    ecpup_queue.push([ins, ln, col, css_ln, js_ln]); 
    // css_ln and js_ln have both been === false
  }

  if(ecpup_callback) {
    var obj = {
       message:msg,
       source:srcdoc,
       original_line:ln,
       adjusted_line:adjline,
       adjusted_location:adjloc,
       column:col,
       consoleReady:ecpup_ready,
       consoleHTML:ins,
    }
    try { // can't have errors re-entering the error handler
      ecpup_callback(obj);
    } catch(e) {
      ecpup_altcomms("Unable to execute callback: " + e.message + "\n" + JSON.stringify(obj)) 
    }
  }
  if(ecpup_autopopup) { setTimeout(ecpup_doAutopop, 500); }
  return true; // set to false to cancel the event bubble 
}

window.onunhandledrejection = function(event) {
   if(ecpup_silencePromiseRejections){event.preventDefault();}
   throw(new Error("(Unhandled Promise rejection; Use bluebird for stack traces) " + event.promise + " | "+ event.reason));
}

setTimeout(ecpup_waitready, 250);
