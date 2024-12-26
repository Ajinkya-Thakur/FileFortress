class SessionDebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        print("\n=== Session Debug ===")
        print(f"Path: {request.path}")
        print(f"Session ID: {request.session.session_key}")
        print(f"Session data: {dict(request.session)}")
        
        response = self.get_response(request)
        
        print("\n=== After Response ===")
        print(f"Session data: {dict(request.session)}")
        return response 