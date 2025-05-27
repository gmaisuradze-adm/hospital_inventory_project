# Version: 1.2 - 2025-05-26 08:43:56 UTC - gmaisuradze-adm - Comprehensive settings.
from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
# TODO: შეცვალეთ ეს გასაღები უნიკალური და რთული მნიშვნელობით.
# არასდროს გაუშვათ პროდუქშენში ამ სტანდარტული გასაღებით.
# შეგიძლიათ გამოიყენოთ Django secret key generator-ები.
SECRET_KEY = 'django-insecure-your-secret-key' 

# SECURITY WARNING: don't run with debug turned on in production!
# შენიშვნა: DEBUG = True კარგია განვითარებისთვის, მაგრამ პროდუქშენში აუცილებლად False უნდა იყოს.
DEBUG = True

# შენიშვნა: ALLOWED_HOSTS ცარიელია, რაც DEBUG=True რეჟიმში დასაშვებია.
# პროდუქშენისთვის აქ უნდა მიუთითოთ თქვენი დომენ(ებ)ი.
ALLOWED_HOSTS = ["10.0.10.107", "localhost", "127.0.0.1"]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'crispy_forms',
    "crispy_bootstrap5",

    # My apps
    'core.apps.CoreConfig',
    'inventory.apps.InventoryConfig',
    'warehouse.apps.WarehouseConfig',
    'requests_app.apps.RequestsAppConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'hospital_inventory.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'], # For project-level templates
        'APP_DIRS': True, # ეს პარამეტრი ეძებს შაბლონებს თითოეული აპლიკაციის 'templates' საქაღალდეში.
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'hospital_inventory.wsgi.application'

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators
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
# https://docs.djangoproject.com/en/4.2/topics/i18n/
LANGUAGE_CODE = 'en-us' # შეგიძლიათ შეცვალოთ 'ka' ქართული ენისთვის, თუ თარგმანებს დაამატებთ.
TIME_ZONE = 'UTC' # შეგიძლიათ შეცვალოთ თქვენი რეგიონის დროის სარტყლით, მაგ. 'Asia/Tbilisi'.
USE_I18N = True
USE_TZ = True # რეკომენდებულია True მნიშვნელობის დატოვება დროის ზონებთან კორექტული მუშაობისთვის.

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/
STATIC_URL = 'static/'
STATICFILES_DIRS = [
    BASE_DIR / "static", # For project-level static files
]
# STATIC_ROOT = BASE_DIR / "staticfiles_collected" # For production (გამოიყენება collectstatic ბრძანებისთვის)

# Media files (User-uploaded content)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Crispy Forms settings
CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"
CRISPY_TEMPLATE_PACK = "bootstrap5"

# Authentication settings
LOGIN_URL = '/login/' # დარწმუნდით, რომ გაქვთ URL და view სახელად 'login' ან შეცვალეთ ეს.
LOGIN_REDIRECT_URL = '/' # შესვლის შემდეგ გადამისამართების URL.
LOGOUT_REDIRECT_URL = '/login/' # გამოსვლის შემდეგ გადამისამართების URL.

# AUTH_USER_MODEL = 'core.CustomUser' # If you decide to use a custom user model later
# შენიშვნა: თუ მომავალში დაგჭირდებათ მომხმარებლის მოდელის გაფართოება (მაგ. დამატებითი ველები),
# Custom User Model-ის გამოყენება პროექტის დასაწყისშივე ჯობია.
# ამ ეტაპზე, თუ არ გეგმავთ, Django-ს სტანდარტული User მოდელი გამოიყენება.
