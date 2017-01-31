# webview-console
SoloLearn embeds the Chromium webview but it's tricky to get to errors. If you do, the reported line numbers have a variable offset and certain types of errors will just land you on a blank page with no feedback at all. This code injects an error console that's reasonably robust against the previous issues.

Working sample.html while I organize the repo.
