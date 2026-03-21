# Переезд Внучка на свой VPS-сервер

## Что нужно
- VPS с Ubuntu 22.04, 1 ядро, 1 ГБ RAM, 20 ГБ SSD
- Домен (например vnuchok.online), направленный на IP сервера
- SSH-доступ к серверу (логин + пароль дадут при покупке VPS)

## Шаг 1: Подключиться к серверу

На Windows скачайте программу PuTTY или используйте PowerShell:
```
ssh root@ВАШ_IP_АДРЕС
```
Введите пароль, который дал хостер.

## Шаг 2: Установить всё необходимое

Скопируйте и вставьте эти команды по одной:

```bash
# Обновить систему
apt update && apt upgrade -y

# Установить Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Установить PostgreSQL
apt install -y postgresql postgresql-contrib

# Установить Nginx (для домена и HTTPS)
apt install -y nginx

# Установить Git
apt install -y git

# Установить PM2 (чтобы проект работал постоянно)
npm install -g pm2
```

## Шаг 3: Настроить базу данных

```bash
# Зайти в PostgreSQL
sudo -u postgres psql

# Создать пользователя и базу (замените ПАРОЛЬ на свой)
CREATE USER vnuchok WITH PASSWORD 'ПРИДУМАЙТЕ_ПАРОЛЬ';
CREATE DATABASE vnuchok OWNER vnuchok;
\q
```

Запомните пароль — он понадобится дальше.

## Шаг 4: Скачать код из GitHub

```bash
# Перейти в папку для проектов
cd /var/www

# Скачать код
git clone https://github.com/Monakhov1988/vnuk.git
cd vnuk

# Установить зависимости
npm install
```

## Шаг 5: Настроить переменные окружения

```bash
# Создать файл с настройками
nano .env
```

Вставьте (заменив значения на свои):
```
DATABASE_URL=postgresql://vnuchok:ПРИДУМАЙТЕ_ПАРОЛЬ@localhost:5432/vnuchok
OPENAI_API_KEY=ваш_ключ_openai
PERPLEXITY_API_KEY=ваш_ключ_perplexity
TELEGRAM_BOT_TOKEN=ваш_токен_бота
NODE_ENV=production
```

Нажмите Ctrl+O → Enter → Ctrl+X чтобы сохранить и выйти.

## Шаг 6: Собрать и запустить проект

```bash
# Создать таблицы в базе данных
npm run db:push

# Собрать проект
npm run build

# Запустить через PM2 (будет работать постоянно, даже после перезагрузки)
pm2 start dist/index.cjs --name vnuchok

# Настроить автозапуск при перезагрузке сервера
pm2 startup
pm2 save
```

## Шаг 7: Настроить домен и HTTPS

```bash
# Создать конфигурацию Nginx
nano /etc/nginx/sites-available/vnuchok
```

Вставьте (замените vnuchok.online на ваш домен):
```nginx
server {
    listen 80;
    server_name vnuchok.online www.vnuchok.online;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Нажмите Ctrl+O → Enter → Ctrl+X.

```bash
# Включить конфигурацию
ln -s /etc/nginx/sites-available/vnuchok /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Установить бесплатный SSL-сертификат (HTTPS)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d vnuchok.online -d www.vnuchok.online
```

Certbot спросит email — введите свой. Сертификат обновляется автоматически.

## Шаг 8: Настроить DNS домена

В панели управления доменом (REG.RU или где купили домен) создайте:
- A-запись: `vnuchok.online` → IP вашего VPS
- A-запись: `www.vnuchok.online` → IP вашего VPS

## Шаг 9: Перенести данные из Replit (если нужно)

В Replit откройте Shell и выполните:
```bash
pg_dump $DATABASE_URL > backup.sql
```
Скачайте файл backup.sql, загрузите на сервер и выполните:
```bash
psql postgresql://vnuchok:ПАРОЛЬ@localhost:5432/vnuchok < backup.sql
```

## Как обновлять код

После изменений в Replit (или Cursor), когда код запушен в GitHub:
```bash
cd /var/www/vnuk
git pull
npm install
npm run build
pm2 restart vnuchok
```

## Полезные команды

```bash
# Посмотреть статус проекта
pm2 status

# Посмотреть логи
pm2 logs vnuchok

# Перезапустить
pm2 restart vnuchok

# Остановить
pm2 stop vnuchok
```

## Автоматическое обновление (по желанию)

Можно настроить GitHub Webhook — при каждом пуше в GitHub сервер сам подтянет новый код и перезапустится. Это настраивается отдельно.

## Стоимость

- VPS: 200-500₽/мес
- Домен: ~200₽/год
- SSL: бесплатно (Let's Encrypt)
- OpenAI API: по использованию
- Perplexity API: по использованию
