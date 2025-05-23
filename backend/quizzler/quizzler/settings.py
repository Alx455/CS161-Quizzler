"""
Django settings for quizzler project.

Generated by 'django-admin startproject' using Django 5.2.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.2/ref/settings/
"""

from pathlib import Path

# Custom imports
import os
from dotenv import load_dotenv
from datetime import timedelta


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-2wgrg2_q+^#1j21=79&l$(*#yr7h_&wu*pegy-)nrn=h^s5e^2'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = [
    'localhost', 
    '127.0.0.1',
    "cs161-quizzler.onrender.com",
    ]

CSRF_TRUSTED_ORIGINS = [
    'https://cs161-quizzler.onrender.com',
    "https://cs-161-quizzler.vercel.app",
    ]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    # Custom apps below
    'authentication',
    'games',
    'live_game_session',

]

# REST and JWT imports
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=3),
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'quizzler.middleware.LogRequestsMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000", # allow connection to React frontend on port 3000
    "http://localhost:5173", # allow requests from Vite on port 5173
    "https://cs161-quizzler.onrender.com",
    "https://cs-161-quizzler.vercel.app",
]

ASGI_APPLICATION = 'quizzler.routing.application'

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    }
}

ROOT_URLCONF = 'quizzler.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'quizzler.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

load_dotenv()

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DB_NAME'),          # Load from .env
        'USER': os.getenv('DB_USER'),          # Load from .env
        'PASSWORD': os.getenv('DB_PASSWORD'),  # Load from .env
        'HOST': os.getenv('DB_HOST'),          # Load from .env
        'PORT': os.getenv('DB_PORT', '3306'),  # Default MySQL port 3306
    }
}
AUTH_USER_MODEL = 'authentication.CustomUser'



# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'


# Logging Configuration
import sys

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'stream': sys.stdout,  # Ensures logs are sent to stdout (necessary for Render logs)
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',  # Adjust to 'DEBUG' for more detailed logs
        },
        'channels': {
            'handlers': ['console'],
            'level': 'DEBUG',  # WebSocket-related logs
        },
        'quizzler.live_game_session.consumers': {
            'handlers': ['console'],
            'level': 'DEBUG',  # Specific logging for GameSessionConsumer
            'propagate': False,  # Prevent duplicate logging
        },
    },
}





# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
