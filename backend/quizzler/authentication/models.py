from django.db import models
#import model base class

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
#import custom classes for authentication: core authentication methods, creating user custom logic, groups and permisisions
from django.core.validators import EmailValidator, MinLengthValidator, MaxLengthValidator
#email format, and min/max fields


#method for making a user
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('email field cannot be empty')
            #email must be provided
        if not password:
            raise ValueError('password field cannot be empty')
            #make sure password is not empty
        user = self.model(email=email, **extra_fields)
            #instance creation for custom user (email and extra fiels) like a username
        user.set_password(password)
            #password securing (Hashing)
        user.save(using=self._db)
            #save user to database
        return user
            #created user obeject successful 

    #method to create admin user
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        #set admin priveldges
        return self.create_user(email, password, **extra_fields)
        #reuses create user method to make the superuser for admin capabilities
    

    #make own user
class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, validators=[EmailValidator()])
    #email required
    username = models.CharField(unique=True, max_length=50, validators=[MinLengthValidator(1), MaxLengthValidator(50)])
    #username with length between 1 and 50 characters
    date_joined = models.DateField(auto_now_add=True)
    #set date of user creation

    objects = CustomUserManager()
    #lets django know to use the custom manager for the create_user and create superuser

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    #login must occur with email and a username is required when creating users on CL or by admin

    def __str__(self):
        return f'{self.id} - {self.email}'

        #display format for email