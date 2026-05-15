from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session, joinedload

from app.core.security import hash_password, verify_password
from app.database.session import get_db
from app.models import Booking, BookingStatus, Property, PropertyImage, PropertyStatus, User, UserRole

router = APIRouter(tags=["Web"])
templates = Jinja2Templates(directory="app/templates")


def _current_user(request: Request, db: Session) -> User | None:
    user_id = request.session.get("user_id")
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id).first()


def _image_src(path: str | None) -> str:
    if not path:
        return "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80"
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return f"/uploads/{path.split('/')[-1]}"


templates.env.globals["image_src"] = _image_src


@router.get("/")
def home(request: Request, db: Session = Depends(get_db)):
    user = _current_user(request, db)
    featured = (
        db.query(Property)
        .options(joinedload(Property.images))
        .filter(Property.status == PropertyStatus.available)
        .order_by(Property.created_at.desc())
        .limit(6)
        .all()
    )
    return templates.TemplateResponse("home.html", {"request": request, "user": user, "featured": featured})


@router.get("/login")
def login_page(request: Request, db: Session = Depends(get_db)):
    return templates.TemplateResponse("login.html", {"request": request, "user": _current_user(request, db), "error": None})


@router.post("/login")
def login_submit(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return templates.TemplateResponse(
            "login.html",
            {"request": request, "user": None, "error": "Invalid email or password"},
            status_code=400,
        )
    request.session["user_id"] = user.id
    return RedirectResponse(url="/dashboard", status_code=303)


@router.get("/register")
def register_page(request: Request, db: Session = Depends(get_db)):
    return templates.TemplateResponse("register.html", {"request": request, "user": _current_user(request, db), "error": None})


@router.post("/register")
def register_submit(
    request: Request,
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == email).first():
        return templates.TemplateResponse(
            "register.html",
            {"request": request, "user": None, "error": "Email already registered"},
            status_code=400,
        )
    try:
        role_value = UserRole(role)
    except ValueError:
        return templates.TemplateResponse(
            "register.html",
            {"request": request, "user": None, "error": "Invalid role selected"},
            status_code=400,
        )
    user = User(full_name=full_name, email=email, hashed_password=hash_password(password), role=role_value)
    db.add(user)
    db.commit()
    db.refresh(user)
    request.session["user_id"] = user.id
    return RedirectResponse(url="/dashboard", status_code=303)


@router.get("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/", status_code=303)


@router.get("/properties")
def properties_page(
    request: Request,
    location: str | None = None,
    rooms: int | None = None,
    max_price: float | None = None,
    page: int = 1,
    db: Session = Depends(get_db),
):
    page = max(page, 1)
    page_size = 24
    query = db.query(Property).options(joinedload(Property.images)).order_by(Property.created_at.desc())
    if location:
        query = query.filter(Property.location.ilike(f"%{location}%"))
    if rooms:
        query = query.filter(Property.number_of_rooms == rooms)
    if max_price is not None:
        query = query.filter(Property.price <= max_price)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    has_next = total > page * page_size
    return templates.TemplateResponse(
        "properties.html",
        {
            "request": request,
            "user": _current_user(request, db),
            "properties": items,
            "page": page,
            "has_next": has_next,
            "has_prev": page > 1,
            "location": location or "",
            "rooms": rooms or "",
            "max_price": max_price or "",
        },
    )


@router.get("/properties/{property_id}")
def property_detail(property_id: int, request: Request, db: Session = Depends(get_db)):
    prop = db.query(Property).options(joinedload(Property.images)).filter(Property.id == property_id).first()
    if not prop:
        return RedirectResponse(url="/properties", status_code=303)
    landlord = db.query(User).filter(User.id == prop.landlord_id).first()
    return templates.TemplateResponse(
        "property_detail.html",
        {"request": request, "user": _current_user(request, db), "property": prop, "landlord": landlord},
    )


@router.post("/properties/{property_id}/book")
def request_booking(property_id: int, request: Request, db: Session = Depends(get_db)):
    user = _current_user(request, db)
    if not user or user.role != UserRole.tenant:
        return RedirectResponse(url="/login", status_code=303)
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or prop.status != PropertyStatus.available:
        return RedirectResponse(url=f"/properties/{property_id}", status_code=303)
    db.add(Booking(tenant_id=user.id, property_id=prop.id, status=BookingStatus.pending))
    db.commit()
    return RedirectResponse(url="/dashboard", status_code=303)


@router.post("/dashboard/landlord/properties")
def add_property_from_dashboard(
    request: Request,
    title: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    price: float = Form(...),
    number_of_rooms: int = Form(...),
    image_links: str = Form(default=""),
    db: Session = Depends(get_db),
):
    user = _current_user(request, db)
    if not user or user.role != UserRole.landlord:
        return RedirectResponse(url="/login", status_code=303)

    prop = Property(
        title=title.strip(),
        description=description.strip(),
        location=location.strip(),
        price=price,
        number_of_rooms=number_of_rooms,
        status=PropertyStatus.available,
        landlord_id=user.id,
    )
    db.add(prop)
    db.flush()

    links = [link.strip() for link in image_links.splitlines() if link.strip()]
    for link in links:
        db.add(PropertyImage(property_id=prop.id, file_path=link))

    db.commit()
    return RedirectResponse(url="/dashboard", status_code=303)


@router.get("/dashboard")
def dashboard(request: Request, db: Session = Depends(get_db)):
    user = _current_user(request, db)
    if not user:
        return RedirectResponse(url="/login", status_code=303)

    context = {"request": request, "user": user}

    if user.role == UserRole.tenant:
        bookings = (
            db.query(Booking)
            .options(joinedload(Booking.property))
            .filter(Booking.tenant_id == user.id)
            .order_by(Booking.request_date.desc())
            .limit(100)
            .all()
        )
        context["bookings"] = bookings
        context["pending_count"] = sum(1 for item in bookings if item.status == BookingStatus.pending)
        return templates.TemplateResponse("dashboard_tenant.html", context)

    if user.role == UserRole.landlord:
        properties = (
            db.query(Property)
            .options(joinedload(Property.images))
            .filter(Property.landlord_id == user.id)
            .limit(100)
            .all()
        )
        bookings = (
            db.query(Booking)
            .join(Property, Property.id == Booking.property_id)
            .options(joinedload(Booking.property), joinedload(Booking.tenant))
            .filter(Property.landlord_id == user.id)
            .order_by(Booking.request_date.desc())
            .limit(100)
            .all()
        )
        context["properties"] = properties
        context["bookings"] = bookings
        context["available_count"] = sum(1 for item in properties if item.status == PropertyStatus.available)
        context["pending_count"] = sum(1 for item in bookings if item.status == BookingStatus.pending)
        return templates.TemplateResponse("dashboard_landlord.html", context)

    stats = {
        "users": db.query(User).count(),
        "properties": db.query(Property).count(),
        "bookings": db.query(Booking).count(),
    }
    context["stats"] = stats
    context["users"] = db.query(User).order_by(User.created_at.desc()).limit(10).all()
    return templates.TemplateResponse("dashboard_admin.html", context)
