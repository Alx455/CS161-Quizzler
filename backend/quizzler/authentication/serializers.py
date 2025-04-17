from rest_framework import serializers
#import used to save, validate and transform model information/data
from .models import CustomUser
#import custom user to let serializers know what they are working with 

from django.contrib.auth import authenticate
#Django authentication method to check if email and password math the user

#this method handles sign up logic
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'password']
        # password set to write only such that it can only be provided when creating a user but not in API responses
        extra_kwargs = {'password': {'write_only': True}}
    #prohubits password from being returned to API responses no read

    #create method overrride to handle the user creation manually
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            username=validated_data['username']
        )
        
        return user
        #custom manager to save and hash password and create user and return user object
    
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    #valid email format required
    password = serializers.CharField(write_only=True)
    #write only 
    
    def validate(self, credentials):
        # retuns CustomUser object if account is present in DB, returns None if not present in DB
        user = authenticate(email=credentials['email'], password=credentials['password'])
        
        # raise Error if account it not in DB
        if user is None:
            raise serializers.ValidationError("Invalid login credentials")
            #error checking for credentials
        
        # Return the existing validated user in a dict for further processing in LoginView
        data = {
        'user': user,
        }
        return data