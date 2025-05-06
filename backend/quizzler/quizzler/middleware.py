import logging

logger = logging.getLogger(__name__)

class LogRequestsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        logger.info(f"{request.method} {request.get_full_path()} from {request.META.get('REMOTE_ADDR')}")
        return self.get_response(request)
