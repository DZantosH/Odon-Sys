# deploy.ps1
Write-Host "Actualizando código local..."
git pull origin main

Write-Host "Compilando frontend..."
Set-Location frontend
npm run build
Set-Location ..

Write-Host "Subiendo frontend compilado..."
scp -i "C:\Users\brand\Downloads\UACMApp.pem" -r frontend/build/* ubuntu@ec2-98-82-131-153.compute-1.amazonaws.com:~/frontend-build/

Write-Host "Actualizando backend en VPS..."
ssh -i "C:\Users\brand\Downloads\UACMApp.pem" ubuntu@ec2-98-82-131-153.compute-1.amazonaws.com @"
sudo mv ~/frontend-build/* /srv/odon-sys/frontend/ 2>/dev/null || sudo cp -r ~/frontend-build/* /srv/odon-sys/frontend/
rm -rf ~/frontend-build/
cd /srv/odon-sys
git pull origin main
cd backend
npm ci --omit=dev
pm2 restart odon-backend
"@

Write-Host "Deploy completado!"