# backend/Dockerfile
FROM python:3.9.6

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y cron postgresql-client

WORKDIR /usr/src/app

COPY requirements.txt /usr/src/app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY . /usr/src/app/
COPY crontab /etc/cron.d/crontab

RUN chmod 0644 /etc/cron.d/crontab

EXPOSE 8000

CMD ["sh", "/usr/src/app/entrypoint.sh"]