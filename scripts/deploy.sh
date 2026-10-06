#!/bin/bash
# Despliegue en el servidor: pull + install + build + static + restart
set -e
export PATH="$HOME/node24/bin:$PATH"
cd "$HOME/inventario-ipuc"
git pull
npm ci --no-audit --no-fund
npm run build
cp -r .next/static .next/standalone/.next/static
sudo systemctl restart inventario-ipuc
sleep 8
sudo systemctl is-active inventario-ipuc
curl -s -o /dev/null -w 'local:%{http_code}\n' http://localhost:3000/login
