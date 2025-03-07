import os
from dotenv import load_dotenv

# Load the .env file from the backend/ directory
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")

    # Loading AWS RDS credentials from .env file
    DB_USERNAME = os.getenv("DB_USERNAME")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_NAME = os.getenv("DB_NAME")
    DB_PORT = os.getenv("DB_PORT")

    if not all([DB_USERNAME, DB_PASSWORD, DB_HOST, DB_NAME, DB_PORT]):
        raise ValueError("Missing required database environment variables")

    # build connection string for SQLAlchemy to connect to database
    SQLALCHEMY_DATABASE_URI = f"mysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    # disable event modification tracking for optimization
    SQLALCHEMY_TRACK_MODIFICATIONS = False
