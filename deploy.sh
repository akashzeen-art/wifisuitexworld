#!/bin/bash
# deploy.sh — Run on Ubuntu VPS as root or sudo user
set -e

DOMAIN="yourdomain.com"
APP_DIR="/var/www/wifi-extender"
JAVA_VERSION="17"

echo "=== WiFiExtender Deployment Script ==="

# 1. System packages
apt-get update -y
apt-get install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx curl git

# 2. Java 17
apt-get install -y openjdk-${JAVA_VERSION}-jdk
java -version

# 3. Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v && npm -v

# 4. PostgreSQL setup
sudo -u postgres psql -c "CREATE DATABASE wifi_extender;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER wifiuser WITH PASSWORD 'securepassword';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE wifi_extender TO wifiuser;" 2>/dev/null || true

# 5. App directory
mkdir -p $APP_DIR/downloads
chown -R www-data:www-data $APP_DIR

# 6. Build frontend
cd $APP_DIR/frontend
npm ci
npm run build

# 7. Build backend
cd $APP_DIR/backend
./mvnw clean package -DskipTests
cp target/wifi-extender-backend-1.0.0.jar $APP_DIR/wifi-extender.jar

# 8. Systemd service for backend
cat > /etc/systemd/system/wifi-extender.service << EOF
[Unit]
Description=WiFi Extender Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/java -jar $APP_DIR/wifi-extender.jar
Restart=on-failure
RestartSec=10
Environment="SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/wifi_extender"
Environment="SPRING_DATASOURCE_USERNAME=wifiuser"
Environment="SPRING_DATASOURCE_PASSWORD=securepassword"
Environment="APP_JWT_SECRET=change_this_to_a_very_long_random_secret_in_production"

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable wifi-extender
systemctl restart wifi-extender

# 9. NGINX config
cp $APP_DIR/nginx/wifi-extender.conf /etc/nginx/sites-available/wifi-extender
ln -sf /etc/nginx/sites-available/wifi-extender /etc/nginx/sites-enabled/wifi-extender
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 10. SSL (optional — comment out if no domain yet)
# certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

echo ""
echo "=== Deployment complete! ==="
echo "Frontend: https://$DOMAIN"
echo "Backend API: https://$DOMAIN/api"
echo "Admin login: admin@wifiextender.com / admin123"
