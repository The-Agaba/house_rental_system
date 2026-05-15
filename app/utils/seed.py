from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.models import Booking, BookingStatus, Property, PropertyImage, PropertyStatus, User, UserRole


def run_seed() -> None:
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        def ensure_user(full_name: str, email: str, password: str, role: UserRole) -> User:
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                return existing
            user = User(full_name=full_name, email=email, hashed_password=hash_password(password), role=role)
            db.add(user)
            db.flush()
            return user

        admin = ensure_user("System Admin", "admin@houserental.com", "Admin@123", UserRole.admin)
        landlord_one = ensure_user("Liam Parker", "landlord@houserental.com", "Landlord@123", UserRole.landlord)
        landlord_two = ensure_user("Sophia Turner", "landlord2@houserental.com", "Landlord@123", UserRole.landlord)
        tenant_one = ensure_user("Noah Carter", "tenant@houserental.com", "Tenant@123", UserRole.tenant)
        tenant_two = ensure_user("Emma Ross", "tenant2@houserental.com", "Tenant@123", UserRole.tenant)

        properties_data = [
            {
                "title": "Modern 2BR Apartment",
                "description": "Spacious apartment with balcony, parking, and nearby metro access.",
                "location": "Downtown",
                "price": 1200.0,
                "number_of_rooms": 2,
                "status": PropertyStatus.available,
                "landlord_id": landlord_one.id,
                "images": [
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
                ],
            },
            {
                "title": "Luxury Penthouse with City View",
                "description": "Top-floor penthouse with premium interiors and skyline views.",
                "location": "Business Bay",
                "price": 3200.0,
                "number_of_rooms": 4,
                "status": PropertyStatus.available,
                "landlord_id": landlord_one.id,
                "images": [
                    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
                ],
            },
            {
                "title": "Cozy Studio Near University",
                "description": "Affordable studio ideal for students and remote workers.",
                "location": "University District",
                "price": 780.0,
                "number_of_rooms": 1,
                "status": PropertyStatus.available,
                "landlord_id": landlord_two.id,
                "images": [
                    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
                ],
            },
            {
                "title": "Family Villa with Garden",
                "description": "Large villa with private garden, 2 parking spaces, and storage.",
                "location": "Green Hills",
                "price": 2500.0,
                "number_of_rooms": 5,
                "status": PropertyStatus.rented,
                "landlord_id": landlord_two.id,
                "images": [
                    "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1200&q=80",
                ],
            },
            {
                "title": "Waterfront 3BR Apartment",
                "description": "Bright apartment with sea view and gym access.",
                "location": "Marina",
                "price": 2100.0,
                "number_of_rooms": 3,
                "status": PropertyStatus.unavailable,
                "landlord_id": landlord_one.id,
                "images": [
                    "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
                ],
            },
        ]

        created_properties: list[Property] = []
        for item in properties_data:
            if db.query(Property).filter(Property.title == item["title"]).first():
                continue
            image_links = item.pop("images")
            prop = Property(**item)
            db.add(prop)
            db.flush()
            for link in image_links:
                db.add(PropertyImage(property_id=prop.id, file_path=link))
            created_properties.append(prop)

        if created_properties:
            db.add_all(
                [
                    Booking(tenant_id=tenant_one.id, property_id=created_properties[0].id, status=BookingStatus.pending),
                    Booking(
                        tenant_id=tenant_two.id,
                        property_id=created_properties[min(1, len(created_properties) - 1)].id,
                        status=BookingStatus.approved,
                    ),
                    Booking(
                        tenant_id=tenant_one.id,
                        property_id=created_properties[min(2, len(created_properties) - 1)].id,
                        status=BookingStatus.completed,
                    ),
                ]
            )
        db.commit()
        print("Seed completed successfully (idempotent mode).")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
