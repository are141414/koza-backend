New-NetFirewallRule -DisplayName "Koza App Port 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
Write-Host "Firewall rule added for Port 8000!" -ForegroundColor Green
Pause
