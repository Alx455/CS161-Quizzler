from rest_framework.views import APIView
#base class for handling API requests
from rest_framework import status
#standardized HTTP status code 
from rest_framework.response import Response
#build and return the HTTP responses from views
from rest_framework.permissions import AllowAny
#allows the users to access the view, this is primarily for users that arent logged in when registering
from rest_framework_simplejwt.tokens import RefreshToken
#JWT tokens for authenticated users

from .serializers import RegisterSerializer
from .serializers import LoginSerializer
#import the custom serializers which ensure data validation and create users that are authenticated

#handles user sign up
class RegisterView(APIView):
    permission_classes = [AllowAny]
    #no authentication required allow anyone to access
    
    #Post request to create a user
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            # Django REST internally calls create() from RegisterSerializer when save() is called, passing data from request to the create function
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'username': user.username,
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    #Class based view this handles the user log in using email and password
class LoginView(APIView):
    permission_classes=[AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        # Django REST insternally calls validate() within is_valid()
        if serializer.is_valid():
            # Data dict returned from validate() is merged into validated_data dict
            user = serializer.validated_data['user']
            #this gets the authenticated user that is returned the validate method
            refresh = RefreshToken.for_user(user)
            #new access token from logged in useer
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'username': user.username,
            }, status=status.HTTP_200_OK)
            #user is considered logged in
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            #if log in fails then return error in response