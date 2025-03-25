Set WshShell = CreateObject("WScript.Shell") 
WshShell.Run "cmd /c cd /d " & chr(34) & WScript.ScriptFullName & "\.." & chr(34) & " && npm start", 0, False
