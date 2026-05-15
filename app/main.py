from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.core.config import get_settings
from app.database.base import Base
from app.database.session import engine
from app.routes import admin, auth, bookings, favorites, messages, properties, search, web

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Move setup to startup to avoid slow/hanging import-time side effects.
    Base.metadata.create_all(bind=engine)
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    Path("app/static/css").mkdir(parents=True, exist_ok=True)
    yield
    # Shutdown: cleanup if needed


app = FastAPI(title=settings.app_name, version=settings.app_version, debug=settings.debug, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret_key)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

api_prefix = "/api/v1"
app.include_router(web.router)
app.include_router(auth.router, prefix=api_prefix)
app.include_router(properties.router, prefix=api_prefix)
app.include_router(search.router, prefix=api_prefix)
app.include_router(bookings.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)
app.include_router(favorites.router, prefix=api_prefix)
app.include_router(messages.router, prefix=api_prefix)
