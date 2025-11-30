from sqlalchemy import Column, Integer, String, Text, Enum, DECIMAL, Boolean, TIMESTAMP, text
from sqlalchemy.orm import relationship
from app.core.database import Base


class AidPackage(Base):
    __tablename__ = "Aid_Packages"

    package_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    package_name = Column(String(100), nullable=False)
    description = Column(Text)
    category = Column(
        Enum('food', 'medical', 'shelter', 'hygiene', 'education', 'emergency', name='package_category_enum'),
        nullable=False,
        index=True
    )
    unit_weight_kg = Column(DECIMAL(8, 2))
    estimated_cost = Column(DECIMAL(10, 2), nullable=False)
    validity_period_days = Column(Integer, nullable=False, default=30)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(
        TIMESTAMP,
        server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    )

    # Relationships
    inventory = relationship("Inventory", back_populates="package", cascade="all, delete-orphan")
    distribution_logs = relationship("DistributionLog", back_populates="package")
