from flask import Flask
from flask_cors import CORS
from app.common.db import db

#from app.auth import auth_bp
#from app.game_play import game_playbp
#from app.game_create import game_createbp

def create_app():
    app = Flask(__name__)

    app.config.from_object("app.config.Config")

    db.init_app(app)

    CORS(app, resources={r"/*": {"origins": "*"}})

    #app.register_blueprint(auth_bp)

    return app