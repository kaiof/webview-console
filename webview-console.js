//"use strict"; 
var ecpup_queue = [];
var ecpup_ready=false;
var ecpup_CSSlines = ecpup_JSlines = false;
var ecpup_console;
var ecpup_cssStart = ecpup_jsStart = ecpup_jsEnd = false;
var ecpup_adjustJS = 2; // skip doctype and html start tag
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

function ecpup_insertConsole(c) {
  var doc = window.document;

  var divv = doc.createElement("div");
  
  /*divv.setAttribute("innerHTML", '<div style="float:left;"><a href="#ecpup1" id="stub">Errors</a></div>' +
  '<div id="ecpup1" class="ecpup">' +
    '<div class="ecpupbox">' +
      '<div class="ecpupScroll">' +
        '<pre><span class=\'ecpupg\'>Line:Col Section</span>   Message  <span class=\'ecpupb\'>(document)</span></pre>' +
        '<span id="ecpup_console"></span>' +
        '<a href="#stub" class="ecpupclose"><span>Close</span></a>' +
      '</div>' +
    '</div>' +
  '</div>');*/
   
  //divv.className="ecpupScroll";
  divv.setAttribute("class", "ecpupScroll");
    var pree = doc.createElement("pre");
    var spann = doc.createElement("span");
    spann.setAttribute("class", "ecpupg");
    spann.innerHTML="Line:Col Section";
    pree.appendChild(spann);
    var txtEl=doc.createTextNode("   Message  ");
    pree.appendChild(txtEl);
    spann = doc.createElement("span");
    spann.setAttribute("class", "ecpupb");
    spann.innerHTML = "(document)";
    pree.appendChild(spann);
  divv.appendChild(pree);  // this is all good

    spann = doc.createElement("span");
    spann.setAttribute("id", "ecpup_console");
    spann.innerHTML="";
  divv.appendChild(spann);

    aa = doc.createElement("a");
    aa.setAttribute("class", "ecpupclose");
    aa.href = "#stub";
    aa.text = "Close";
  divv.appendChild(aa); // appears to be working (change class and it unhides);
 
  var divvv = doc.createElement("div");
  divvv.setAttribute("class", "ecpupbox");
  var divvvv = doc.createElement("div");
  divvvv.setAttribute("class", "ecpup");
  divvvv.setAttribute("id", "ecpup1");
  divvv.appendChild(divv);
  divvvv.appendChild(divvv);
  
  try {
    doc.body.replaceChild(divvvv, c);
  } catch(e) {
    ff(e);
  }
  
  var ldivv = doc.createElement("div");
  ldivv.id = "ecpup_link";
    aa = doc.createElement("a");
    aa.setAttribute("id", "stub");
    aa.href = "#ecpup1"; // javascript:alert('f');//
    aa.text = "Errors";
  ldivv.appendChild(aa);
  
  try {
    divvvv.parentNode.insertBefore(ldivv, divvvv.nextSibling); // emulate insertAfter()
  } catch(e) {
    alert(e);
  }
  
}

function ecpup_waitready() {
  var s,j,c;
  s=document.getElementById("style-from-editor");
  j=document.getElementById("script-from-editor");
  c=document.getElementById("error_console");
  if(s) ecpup_CSSlines = ecpup_count(s);
  if(j) ecpup_JSlines = ecpup_count(j);
  if(!(s && j && c)) {
    setTimeout(ecpup_ready, 250);
    // TODO: If user doesn't put the correct element in, it will wait forever. After a time, alert?
    return false;
  }
  // document is ready enough to adjust event line numbers and identify locations

  ecpup_insertConsole(c);
  ecpup_console = document.getElementById('ecpup_console');
  c = ecpup_console;

  // TODO: Reduce user requirement to 1 div, then construct the receiving window
  //var doc = window.document; 
  //var script = doc.createElement("script"); 
  //script.text = code; 
  //doc.head.appendChild(script).parentNode.removeChild(script); 
  
  var hd = document.getElementsByTagName("html")[0].innerHTML; // Assume <doctype>, and no intervening code before <html>.
  var hd = hd.split('</head>'); // drop the end of the document
  
  // I don't anticipate these actually firing.
  if(hd.length > 2) {
    for(i=0; i<hd.length; i++){
    alert(JSON.stringify(hd[i]));
    }
    alert("TODO: More than one </head> endtag; assuming first one found is correct.");
  }
  if(hd.length < 2) {
    alert("TODO: (?) This script isn't designed for documents without a <head></head> block.");
  }
  hd=hd[0];

  var hdbits = hd.split('</style><script id="script-from-editor">'); // There should only be two bits
  if(hdbits.length != 2) {
    // TODO: 
    alert('TODO: webview-console: One--and only one: </style><script id="script-from-editor"> block expected. Zero is "not SoloLearn"; multiple ID\'s is an error.');
    alert("This alert sometimes occurs if you put HTML intended for BODY into HEAD!");
    // at least try to truncate
    hdbits = [hdbits[0],hdbits[1]]; // TODO: try..catch
  }
  ecpup_beforeJS = ecpup_count(hdbits[0]); // work towards: At what line does inserted JS start?

/* Don't care about CSS right now
  
  // TODO: Should verify this is here
  stylebits = hdbits[0].split('\n<style id="style-from-editor">');
  //scriptbit = hdbits[1];
  
  var ecpup_beforeCSS = ecpup_count(stylebits[0]);
  // stylebits[1] is in ecpup_CSSlines (verified same already)
  // var script_lines = ecpup_count(scriptbit); // unnecessary; use ecpup_JSlines
    
  alert(ecpup_beforeCSS + "," + style_lines + "," + ecpup_JSlines + "," + script_lines);
  
  alert(ecpup_beforeCSS);
*/

  ecpup_jsStart = ecpup_beforeJS + ecpup_adjustJS;
  ecpup_jsEnd = ecpup_jsStart + ecpup_JSlines;

  // handle queued script errors + adjusting lineno
  var l = ecpup_queue.length;

  if(l>0){
    var line, calcline, errloc;
    for(var i=0;i<l;i++) {
      s = ecpup_queue[i][0];
      line = ecpup_queue[i][1];
      if(line < ecpup_jsStart) {
        calcline = line;
        errloc = "&lt;head&gt;";
      } else if(line <= ecpup_jsEnd) {
        calcline = line - ecpup_jsStart + 1; // offset in [JS] tab TODO: 1 off bug / couldn't duplicate?
        errloc = "[JS]";
      } else {
        calcline = line - ecpup_JSlines - ecpup_CSSlines + ecpup_adjustJS; // accommodate injections
        errloc = "&lt;body&gt;";
      }
      s = s.replace("{ln}", calcline); // can't chain replaces...
      s = s.replace("{loc}", errloc);

      c.innerHTML += s;
    } 
  }
  
  ecpup_ready = true; // if async, set this as soon as possible so new events don't end up in queue
  return true;
}

window.onerror=function(msg, srcdoc, ln, col, errmsg) {
  var ins;
  var pre_ins = "<span class='ecpupg'>"; 
  var post_ins= " {loc}</span> [" + errmsg + "] <span class='ecpupb'>(" + srcdoc + ")</span><hr />";
  var css_ln=ecpup_CSSlines;
  var js_ln=ecpup_JSlines;
  
  if(!ecpup_ready) {
    ins = pre_ins + "{ln}:" + col + post_ins;
    ecpup_queue.push([ins, ln, col, css_ln, js_ln]); // css_ln and js_ln have both been ===false
  }
  else {
    ins = pre_ins + (ln-(css_ln+js_ln)+2) + ":" + col + post_ins
    ecpup_console.innerHTML += s;
  }
  return true; // set to false to cancel the event bubble [Original snippet: https://code.sololearn.com/WnfK9ry02dkS/?ref=app]
}

setTimeout(ecpup_waitready, 250);

// insert order: error_console. [css tab] . [js tab] (css lines is 11, then err line 1 js = -css - 1)
