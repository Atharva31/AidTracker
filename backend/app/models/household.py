from sqlalchemy import Column, Integer, String, Date, Enum, Text, TIMESTAMP, text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Household(Base):
    __tablename__ = "Households"

    household_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    family_name = Column(String(100), nullable=False)
    primary_contact_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False, unique=True)
    email = Column(String(100))
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(50), nullable=False)
    zip_code = Column(String(10), nullable=False)
    family_size = Column(Integer, nullable=False)
    income_level = Column(
        Enum('no_income', 'very_low', 'low', 'moderate', name='income_level_enum'),
        nullable=False
    )
    priority_level = Column(
        Enum('critical', 'high', 'medium', 'low', name='priority_level_enum'),
        default='medium',
        index=True
    )
    registration_date = Column(Date, nullable=False, index=True)
    last_verified_date = Column(Date)
    status = Column(
        Enum('active', 'inactive', 'suspended', name='household_status_enum'),
        default='active',
        index=True
    )
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(
        TIMESTAMP,
        server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    )

    # Relationships
    distribution_logs = relationship("DistributionLog", back_populates="household")
