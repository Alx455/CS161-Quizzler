from django.apps import AppConfig
#import AppConfig, this is the base class for configuration, needed for Django

class AuthenticationConfig(AppConfig):
    #custom config class definition for app Authentication
    default_auto_field = 'django.db.models.BigAutoField'
    #set default type for primary key? Ask alex.. 
    name = 'authentication'
    #import path
