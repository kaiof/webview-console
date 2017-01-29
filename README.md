# webview-console
SoloLearn embeds the Chromium webview but it's tricky to get to errors. If you do, the reported line numbers have a variable offset and certain types of errors will just land you on a blank page with no feedback at all. This code injects an error console that's reasonably robust against the previous issues.

working on this.... 

Instructions
At the top of the SoloLearn <HEAD> section, import the distributable javascript and css.
<link rel="">
<script src=""></script>

You'll need some way to activate the panel - how you do that and where it is is up to you. 

This code will pop up the console on EVERY error. You should place it in its own <script> block in <body> to protect it from errors in other <script> blocks.


This code will place a link on your page:

  <div style="float:left;"><a href="#ecpup1" id="#stub">Error Popup</a></div>
  <div id="ecpup1" class="ecpup">
    <div class="ecpupbox">
      <div class="ecpupScroll">
        <h5>Line:Col</h5>
        <span id="ecpup_console"></span>
        <a href="#stub" class="ecpupclose"><span>Close</span></a>
      </div>
    </div>
  </div>
