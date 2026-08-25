FROM python:alpine3.12

WORKDIR /app

COPY requireent.txt

RUN python3 --version
RUN pip3 install --no-cache-dir -r requireent.txt

COPY . .

CMD ["python3", "/app/main.py"]