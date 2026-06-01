Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "node index.js --cron", 0, false
