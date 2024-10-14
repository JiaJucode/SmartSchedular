FROM python:3.12.4

WORKDIR /app

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt

# Download the English model for spaCy
RUN python -m spacy download en_core_web_sm

COPY . .

CMD ["python", "-m", "app"]