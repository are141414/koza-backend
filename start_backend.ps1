$ErrorActionPreference = "Continue"
$backendPath = "C:\Users\Enes\Desktop\happy mom\koza_project"
$venv = "$backendPath\.venv\Scripts\python.exe"
$workingDir = "C:\Users\Enes\Desktop\happy mom"

Set-Location $workingDir
& $venv -m uvicorn koza_project.api.main:app --host 0.0.0.0 --port 8001
